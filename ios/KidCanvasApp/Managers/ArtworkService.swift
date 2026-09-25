import Foundation
import Supabase

/// Queries that back the feed, reactions, comments, and family invites.
/// Views stay thin; everything that talks to Postgres lives here.
struct ArtworkService {
    let client: SupabaseClient

    /// The signed-in user. Views need this to decide whether a comment is theirs.
    var currentUserID: UUID? {
        client.auth.currentUser?.id
    }

    /// This user's role in a family: "owner", "parent", "member", "viewer", or
    /// nil if they are not a member. Owners and parents can moderate comments.
    func familyRole(familyId: UUID) async -> String? {
        try? await client
            .rpc("get_family_role", params: ["family_uuid": familyId.uuidString])
            .execute()
            .value
    }

    // MARK: - Artwork

    func artworks(familyId: UUID, newestFirst: Bool = true) async throws -> [Artwork] {
        try await client
            .from("artworks")
            .select("*, children(*)")
            .eq("family_id", value: familyId.uuidString)
            .order("uploaded_at", ascending: !newestFirst)
            .execute()
            .value
    }

    /// Every artwork of one child that has a story, oldest first, for the quote
    /// book. Ordered by created_date (when it was drawn), not uploaded_at, so a
    /// batch of old drawings scanned in December still lands in the right month.
    func storiedArtworks(childId: UUID) async throws -> [Artwork] {
        try await client
            .from("artworks")
            .select("*, children(*)")
            .eq("child_id", value: childId.uuidString)
            .not("story", operator: .is, value: "null")
            .order("created_date", ascending: true)
            .execute()
            .value
    }

    /// One artwork by id, for a tapped notification or widget. RLS returns
    /// nothing if the user has since left that family (or a widget link is
    /// from a previous account), which is the right answer: the tap then just
    /// opens the app instead of leaking.
    func artwork(id: UUID) async throws -> Artwork? {
        let rows: [Artwork] = try await client
            .from("artworks")
            .select("*, children(*)")
            .eq("id", value: id.uuidString)
            .limit(1)
            .execute()
            .value
        return rows.first
    }

    // MARK: - Notification preferences

    /// The signed-in user's push switches. No row means both are on, matching
    /// the server's default, so a new user never has to save before hearing
    /// from their family.
    func notificationPreferences() async -> NotificationPreferences {
        guard let userId = currentUserID else { return .defaults }
        let rows: [NotificationPreferences]? = try? await client
            .from("notification_preferences")
            .select("new_artwork, comments_reactions")
            .eq("user_id", value: userId.uuidString)
            .limit(1)
            .execute()
            .value
        return rows?.first ?? .defaults
    }

    func saveNotificationPreferences(_ prefs: NotificationPreferences) async throws {
        guard let userId = currentUserID else { return }
        struct Row: Encodable {
            let user_id: String
            let new_artwork: Bool
            let comments_reactions: Bool
        }
        try await client
            .from("notification_preferences")
            .upsert(Row(
                user_id: userId.uuidString,
                new_artwork: prefs.newArtwork,
                comments_reactions: prefs.commentsReactions
            ), onConflict: "user_id")
            .execute()
    }

    // MARK: - Reactions

    func reactionCounts(artworkId: UUID) async throws -> [ReactionCount] {
        try await client
            .rpc("get_artwork_reaction_counts", params: ["artwork_uuid": artworkId.uuidString])
            .execute()
            .value
    }

    /// Which of the five reactions this user has already left.
    func myReactions(artworkId: UUID) async throws -> Set<String> {
        guard let userId = currentUserID else { return [] }
        struct Row: Decodable { let emoji_type: String }
        let rows: [Row] = try await client
            .from("artwork_reactions")
            .select("emoji_type")
            .eq("artwork_id", value: artworkId.uuidString)
            .eq("user_id", value: userId.uuidString)
            .execute()
            .value
        return Set(rows.map(\.emoji_type))
    }

    func addReaction(_ reaction: Reaction, artworkId: UUID) async throws {
        guard let userId = currentUserID else { return }
        struct NewReaction: Encodable {
            let artwork_id: String
            let user_id: String
            let emoji_type: String
        }
        try await client
            .from("artwork_reactions")
            .insert(NewReaction(
                artwork_id: artworkId.uuidString,
                user_id: userId.uuidString,
                emoji_type: reaction.rawValue
            ))
            .execute()
    }

    func removeReaction(_ reaction: Reaction, artworkId: UUID) async throws {
        guard let userId = currentUserID else { return }
        try await client
            .from("artwork_reactions")
            .delete()
            .eq("artwork_id", value: artworkId.uuidString)
            .eq("user_id", value: userId.uuidString)
            .eq("emoji_type", value: reaction.rawValue)
            .execute()
    }

    // MARK: - Comments

    func comments(artworkId: UUID) async throws -> [ArtworkComment] {
        try await client
            .from("artwork_comments")
            .select()
            .eq("artwork_id", value: artworkId.uuidString)
            .order("created_at", ascending: true)
            .execute()
            .value
    }

    func addComment(_ text: String, artworkId: UUID) async throws {
        guard let userId = currentUserID else { return }
        struct NewComment: Encodable {
            let artwork_id: String
            let user_id: String
            let text: String
        }
        let trimmed = String(text.trimmingCharacters(in: .whitespacesAndNewlines).prefix(500))
        guard !trimmed.isEmpty else { return }
        try await client
            .from("artwork_comments")
            .insert(NewComment(
                artwork_id: artworkId.uuidString,
                user_id: userId.uuidString,
                text: trimmed
            ))
            .execute()
    }

    func deleteComment(id: UUID) async throws {
        try await client
            .from("artwork_comments")
            .delete()
            .eq("id", value: id.uuidString)
            .execute()
    }

    // MARK: - Story edits

    func updateStory(_ story: String, artworkId: UUID) async throws {
        struct StoryUpdate: Encodable { let story: String }
        try await client
            .from("artworks")
            .update(StoryUpdate(story: story))
            .eq("id", value: artworkId.uuidString)
            .execute()
    }

    // MARK: - Family members

    func familyMembers(familyId: UUID) async throws -> [FamilyMember] {
        try await client
            .from("family_members")
            .select()
            .eq("family_id", value: familyId.uuidString)
            .order("joined_at", ascending: true)
            .execute()
            .value
    }

    /// Removes someone from a family. RLS allows this for owners and parents, and
    /// allows anyone to remove themselves, so leaving uses the same call.
    /// Guideline 1.2 wants a way to deal with an abusive member, not just their
    /// individual comments.
    func removeMember(id: UUID) async throws {
        try await client
            .from("family_members")
            .delete()
            .eq("id", value: id.uuidString)
            .execute()
    }

    // MARK: - Family invites

    /// Creates a single-use invite code that a grandparent or co-parent can
    /// redeem to join this family.
    func createInvite(familyId: UUID, role: String = "member") async throws -> String {
        struct NewInvite: Encodable {
            let family_id: String
            let code: String
            let role: String
            let created_by: String?
        }
        // Ambiguous characters left out so a code can be read aloud.
        let alphabet = Array("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")
        let code = String((0..<8).map { _ in alphabet.randomElement()! })
        try await client
            .from("family_invites")
            .insert(NewInvite(
                family_id: familyId.uuidString,
                code: code,
                role: role,
                created_by: currentUserID?.uuidString
            ))
            .execute()
        return code
    }

    func redeemInvite(code: String) async throws {
        try await client
            .rpc("accept_family_invite", params: ["invite_code": code.uppercased()])
            .execute()
    }
}
