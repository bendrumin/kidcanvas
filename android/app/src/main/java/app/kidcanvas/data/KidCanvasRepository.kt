package app.kidcanvas.data

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.SignOutScope
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.status.SessionStatus
import io.github.jan.supabase.auth.user.UserInfo
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order
import io.github.jan.supabase.postgrest.rpc
import io.github.jan.supabase.storage.storage
import io.ktor.http.ContentType
import kotlinx.coroutines.flow.StateFlow
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import java.security.SecureRandom

/**
 * Every query here is a port of one in iOS ArtworkService.swift or
 * AuthManager.swift, with the same table, filters and ordering, so the three
 * clients see identical rows. Row-level security is still what decides access;
 * the family filters narrow a result RLS already allows, for people who belong
 * to more than one family.
 */
class KidCanvasRepository(private val supabase: SupabaseClient = SupabaseModule.client) {

    // region Auth

    val sessionStatus: StateFlow<SessionStatus> get() = supabase.auth.sessionStatus

    suspend fun signIn(email: String, password: String) {
        supabase.auth.signInWith(Email) {
            this.email = email.trim()
            this.password = password
        }
    }

    /**
     * The same metadata iOS sends. The family itself is created by
     * [ensureFamily] once a session exists, not here: with email confirmation
     * on there is no session yet, and creating it in one place avoids a race
     * that could make two families.
     */
    suspend fun signUp(email: String, password: String, fullName: String, familyName: String) {
        supabase.auth.signUpWith(Email) {
            this.email = email.trim()
            this.password = password
            data = buildJsonObject {
                put("full_name", fullName.trim())
                put("family_name", familyName.trim())
            }
        }
    }

    suspend fun signOut() = supabase.auth.signOut()

    /**
     * The stored token stays valid until it expires, so an account deleted on
     * the web kept "signing in" on iOS until it round-tripped to the server.
     * This is that round trip.
     */
    suspend fun verifySessionWithServer(): UserInfo = supabase.auth.retrieveUserForCurrentSession(updateSession = true)

    fun currentUser(): UserInfo? = supabase.auth.currentUserOrNull()
    fun currentUserId(): String? = currentUser()?.id

    /** Mirrors iOS `User.fullName`: the metadata name, else the email's local part. */
    fun currentUserName(): String {
        val user = currentUser()
        val meta = user?.userMetadata?.get("full_name")?.let { (it as? JsonPrimitive)?.contentOrNullSafe() }
        return meta?.takeIf { it.isNotBlank() } ?: user?.email?.substringBefore("@") ?: "User"
    }

    private fun metadataFamilyName(): String? =
        currentUser()?.userMetadata?.get("family_name")?.jsonPrimitive?.contentOrNullSafe()?.takeIf { it.isNotBlank() }

    /**
     * Permanently deletes the account and everything it owns, in the iOS order:
     * storage files first (a row cascade cannot reach the bucket), then the
     * delete_my_account RPC, then a local sign-out because the auth row is gone.
     */
    suspend fun deleteAccount(ownedFamilyIds: List<String>) {
        ownedFamilyIds.forEach { runCatching { removeFamilyFiles(it) } }
        supabase.postgrest.rpc("delete_my_account")
        runCatching { supabase.auth.signOut(SignOutScope.LOCAL) }
        runCatching { supabase.auth.clearSession() }
    }

    /**
     * iOS lists once with the default page size of 100; paging here means a
     * family with more than 100 files does not leave the rest orphaned.
     */
    private suspend fun removeFamilyFiles(familyId: String) {
        val folder = familyId.lowercase()
        val bucket = supabase.storage.from(ARTWORK_BUCKET)
        var previousFirst: String? = null
        // Bounded: a delete that storage policy quietly ignores would otherwise
        // return the same page forever. 50 pages is 5,000 files.
        repeat(50) {
            val names = bucket.list(folder) { limit = 100 }.map { "$folder/${it.name}" }
            if (names.isEmpty() || names.first() == previousFirst) return
            previousFirst = names.first()
            bucket.delete(names)
            if (names.size < 100) return
        }
    }

    // endregion

    // region Families

    /** `select("*, families(*)")` on the user's own memberships, as iOS loadFamily does. */
    suspend fun myMemberships(): List<FamilyMember> {
        val userId = currentUserId() ?: return emptyList()
        return supabase.from("family_members").select(Columns.raw("*, families(*)")) {
            filter { eq("user_id", userId) }
        }.decodeList<FamilyMember>()
    }

    /**
     * iOS self-heals a signed-in user with no family by creating one. The name
     * prefers what they typed at sign-up (kept in metadata so it survives email
     * confirmation), then the iOS fallback of "<name>'s Family".
     */
    suspend fun createFamilyForUser() {
        val name = metadataFamilyName() ?: "${currentUserName()}'s Family"
        supabase.postgrest.rpc("create_family_for_user", buildJsonObject { put("family_name", name) })
    }

    suspend fun familyRole(familyId: String): String? = runCatching {
        supabase.postgrest.rpc("get_family_role", buildJsonObject { put("family_uuid", familyId) })
            .decodeAs<String?>()
    }.getOrNull()

    suspend fun children(familyId: String): List<Child> =
        supabase.from("children").select {
            filter { eq("family_id", familyId) }
            order("name", Order.ASCENDING)
        }.decodeList<Child>()

    @Serializable
    private data class NewChild(
        @SerialName("family_id") val familyId: String,
        val name: String,
        @SerialName("birth_date") val birthDate: String?,
    )

    /** birthDate is a calendar day, "yyyy-MM-dd", as AddChildView writes it. */
    suspend fun addChild(familyId: String, name: String, birthDate: String?) {
        supabase.from("children").insert(NewChild(familyId, name.trim(), birthDate))
    }

    suspend fun familyMembers(familyId: String): List<FamilyMember> =
        supabase.from("family_members").select {
            filter { eq("family_id", familyId) }
            order("joined_at", Order.ASCENDING)
        }.decodeList<FamilyMember>()

    /**
     * RLS allows owners and parents to remove anyone, and anyone to remove
     * themselves. Asking for the deleted row back is how a refusal shows up:
     * PostgREST reports a delete RLS filtered out as success with zero rows.
     */
    suspend fun removeMember(memberId: String): Boolean =
        supabase.from("family_members").delete {
            select()
            filter { eq("id", memberId) }
        }.decodeList<FamilyMember>().isNotEmpty()

    @Serializable
    private data class NewInvite(
        @SerialName("family_id") val familyId: String,
        val code: String,
        val role: String,
        @SerialName("created_by") val createdBy: String?,
    )

    /** Single-use code; the schema sets the seven-day expiry. */
    suspend fun createInvite(familyId: String, role: String = Roles.MEMBER): String {
        // Ambiguous characters left out so a code can be read aloud, same alphabet as iOS.
        val alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        val random = SecureRandom()
        val code = (0 until 8).map { alphabet[random.nextInt(alphabet.length)] }.joinToString("")
        supabase.from("family_invites").insert(NewInvite(familyId, code, role, currentUserId()))
        return code
    }

    /** Returns the joined family's id, which accept_family_invite already hands back. */
    suspend fun redeemInvite(code: String): String? =
        supabase.postgrest.rpc("accept_family_invite", buildJsonObject { put("invite_code", code.trim().uppercase()) })
            .decodeAs<String?>()

    // endregion

    // region Artwork

    /** Same query as iOS ArtworkService.artworks: joined child, newest upload first. */
    suspend fun artworks(familyId: String): List<Artwork> =
        supabase.from("artworks").select(Columns.raw("*, children(*)")) {
            filter { eq("family_id", familyId) }
            order("uploaded_at", Order.DESCENDING)
        }.decodeList<Artwork>()

    suspend fun artwork(id: String): Artwork =
        supabase.from("artworks").select(Columns.raw("*, children(*)")) {
            filter { eq("id", id) }
        }.decodeSingle<Artwork>()

    /**
     * RLS lets only owners and parents update artwork. A refused update comes
     * back as success with no rows, so the row is requested back and an empty
     * result means "not allowed" rather than silently pretending it worked.
     */
    suspend fun setFavorite(artworkId: String, favorite: Boolean): Boolean =
        supabase.from("artworks").update({ set("is_favorite", favorite) }) {
            select(Columns.raw("id"))
            filter { eq("id", artworkId) }
        }.decodeList<IdOnly>().isNotEmpty()

    suspend fun updateStory(artworkId: String, story: String): Boolean =
        supabase.from("artworks").update({ set("story", story) }) {
            select(Columns.raw("id"))
            filter { eq("id", artworkId) }
        }.decodeList<IdOnly>().isNotEmpty()

    @Serializable
    private data class IdOnly(val id: String)

    @Serializable
    private data class NewArtwork(
        val id: String,
        @SerialName("family_id") val familyId: String,
        @SerialName("child_id") val childId: String,
        @SerialName("image_url") val imageUrl: String,
        @SerialName("thumbnail_url") val thumbnailUrl: String,
        val title: String,
        val story: String?,
        @SerialName("created_date") val createdDate: String,
        @SerialName("uploaded_by") val uploadedBy: String?,
    )

    /**
     * Storage layout shared with iOS and the web: `{familyId}/{artworkId}.jpg`
     * and `{familyId}/{artworkId}_thumb.jpg`, both lowercase, in the public
     * `artworks` bucket. The folder must be the family id because the storage
     * INSERT policy checks the first path segment against the user's families.
     */
    suspend fun uploadArtwork(
        familyId: String,
        childId: String,
        title: String,
        story: String?,
        createdDate: String,
        image: ByteArray,
        thumbnail: ByteArray,
    ) {
        val artworkId = java.util.UUID.randomUUID().toString().lowercase()
        val basePath = "${familyId.lowercase()}/$artworkId"
        val bucket = supabase.storage.from(ARTWORK_BUCKET)

        bucket.upload("$basePath.jpg", image) { contentType = ContentType.Image.JPEG; upsert = false }
        bucket.upload("${basePath}_thumb.jpg", thumbnail) { contentType = ContentType.Image.JPEG; upsert = false }

        supabase.from("artworks").insert(
            NewArtwork(
                id = artworkId,
                familyId = familyId,
                childId = childId,
                imageUrl = bucket.publicUrl("$basePath.jpg"),
                thumbnailUrl = bucket.publicUrl("${basePath}_thumb.jpg"),
                title = title.trim(),
                // Empty means no story, so the detail screen's "No story yet"
                // prompt shows. Store NULL, not "", exactly as iOS does.
                story = story?.trim()?.takeIf { it.isNotEmpty() },
                createdDate = createdDate,
                uploadedBy = currentUserId(),
            )
        )
    }

    // endregion

    // region Reactions

    suspend fun reactionCounts(artworkId: String): Map<String, Long> =
        supabase.postgrest.rpc("get_artwork_reaction_counts", buildJsonObject { put("artwork_uuid", artworkId) })
            .decodeList<ReactionCount>()
            .associate { it.emojiType to it.count }

    @Serializable
    private data class EmojiRow(@SerialName("emoji_type") val emojiType: String)

    /** Which of the five reactions this user has already left. */
    suspend fun myReactions(artworkId: String): Set<String> {
        val userId = currentUserId() ?: return emptySet()
        return supabase.from("artwork_reactions").select(Columns.raw("emoji_type")) {
            filter {
                eq("artwork_id", artworkId)
                eq("user_id", userId)
            }
        }.decodeList<EmojiRow>().map { it.emojiType }.toSet()
    }

    @Serializable
    private data class NewReaction(
        @SerialName("artwork_id") val artworkId: String,
        @SerialName("user_id") val userId: String,
        @SerialName("emoji_type") val emojiType: String,
    )

    suspend fun addReaction(reaction: Reaction, artworkId: String) {
        val userId = currentUserId() ?: return
        supabase.from("artwork_reactions").insert(NewReaction(artworkId, userId, reaction.emoji))
    }

    suspend fun removeReaction(reaction: Reaction, artworkId: String) {
        val userId = currentUserId() ?: return
        supabase.from("artwork_reactions").delete {
            filter {
                eq("artwork_id", artworkId)
                eq("user_id", userId)
                eq("emoji_type", reaction.emoji)
            }
        }
    }

    // endregion

    // region Comments

    suspend fun comments(artworkId: String): List<ArtworkComment> =
        supabase.from("artwork_comments").select {
            filter { eq("artwork_id", artworkId) }
            order("created_at", Order.ASCENDING)
        }.decodeList<ArtworkComment>()

    @Serializable
    private data class NewComment(
        @SerialName("artwork_id") val artworkId: String,
        @SerialName("user_id") val userId: String,
        val text: String,
    )

    /** Trimmed and capped at 500 characters, matching the table's CHECK constraint. */
    suspend fun addComment(text: String, artworkId: String) {
        val userId = currentUserId() ?: return
        val trimmed = text.trim().take(COMMENT_MAX_CHARS)
        if (trimmed.isEmpty()) return
        supabase.from("artwork_comments").insert(NewComment(artworkId, userId, trimmed))
    }

    /** False when RLS refused it: the author, owners and parents may delete; nobody else. */
    suspend fun deleteComment(id: String): Boolean =
        supabase.from("artwork_comments").delete {
            select()
            filter { eq("id", id) }
        }.decodeList<ArtworkComment>().isNotEmpty()

    // endregion

    companion object {
        /** Same bucket name as iOS Config.artworkBucket and web lib/storage.ts. */
        const val ARTWORK_BUCKET = "artworks"
    }
}

/** JsonPrimitive.contentOrNull without depending on its opt-in status across versions. */
private fun JsonPrimitive.contentOrNullSafe(): String? = if (this is kotlinx.serialization.json.JsonNull) null else content
