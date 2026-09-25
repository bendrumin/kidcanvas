package app.kidcanvas.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Columns mirror the shared Postgres schema (supabase/schema_baseline.sql) and
 * the iOS Models.swift. Dates stay as the strings Postgres sends; the UI parses
 * them where it formats them, so a new date format cannot break decoding.
 */
@Serializable
data class Artwork(
    val id: String,
    @SerialName("family_id") val familyId: String,
    @SerialName("child_id") val childId: String? = null,
    @SerialName("image_url") val imageUrl: String,
    @SerialName("thumbnail_url") val thumbnailUrl: String? = null,
    val title: String? = null,
    /** What the child said about it. The reason this app exists. */
    val story: String? = null,
    val description: String? = null,
    val tags: List<String>? = null,
    /** A calendar day, "yyyy-MM-dd": the day it was made, not the upload instant. */
    @SerialName("created_date") val createdDate: String? = null,
    /** Worked out by the set_child_age_months trigger, never by a client. */
    @SerialName("child_age_months") val childAgeMonths: Int? = null,
    @SerialName("is_favorite") val isFavorite: Boolean = false,
    @SerialName("uploaded_at") val uploadedAt: String? = null,
    @SerialName("uploaded_by") val uploadedBy: String? = null,
    /** Embedded by `select("*, children(*)")`, the same join iOS uses. */
    @SerialName("children") val child: Child? = null,
)

@Serializable
data class Child(
    val id: String,
    @SerialName("family_id") val familyId: String,
    val name: String,
    @SerialName("birth_date") val birthDate: String? = null,
    @SerialName("avatar_color") val avatarColor: String? = null,
)

@Serializable
data class Family(
    val id: String,
    val name: String,
    @SerialName("created_by") val createdBy: String? = null,
)

@Serializable
data class FamilyMember(
    val id: String,
    @SerialName("family_id") val familyId: String,
    @SerialName("user_id") val userId: String,
    val role: String,
    val nickname: String? = null,
    @SerialName("joined_at") val joinedAt: String? = null,
    /** Embedded by `select("*, families(*)")` when loading the user's memberships. */
    @SerialName("families") val family: Family? = null,
)

@Serializable
data class ReactionCount(
    @SerialName("emoji_type") val emojiType: String,
    val count: Long,
)

@Serializable
data class ArtworkComment(
    val id: String,
    @SerialName("artwork_id") val artworkId: String,
    @SerialName("user_id") val userId: String,
    val text: String,
    @SerialName("created_at") val createdAt: String,
)

/**
 * The five reactions the database's CHECK constraint allows, in the iOS order.
 * Anything else is rejected by Postgres, so this list is not a design choice.
 */
enum class Reaction(val emoji: String, val label: String) {
    Love("❤️", "Love"),
    Adore("😍", "Adore"),
    Artistic("🎨", "Artistic"),
    Applause("👏", "Bravo"),
    Star("🌟", "Star"),
}

/** Family roles as the schema names them. Owners and parents manage; viewers only look. */
object Roles {
    const val OWNER = "owner"
    const val PARENT = "parent"
    const val MEMBER = "member"
    const val VIEWER = "viewer"

    fun canManage(role: String?) = role == OWNER || role == PARENT
    fun canUpload(role: String?) = role == OWNER || role == PARENT || role == MEMBER
}

/** Matches the `artworks` bucket's file_size_limit, same constant iOS uses. */
const val MAX_IMAGE_BYTES = 10 * 1024 * 1024
const val COMMENT_MAX_CHARS = 500
