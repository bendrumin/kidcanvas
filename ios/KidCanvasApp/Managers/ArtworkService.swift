import Foundation
import Supabase

/// Queries that back the feed, reactions, comments, and family invites.
/// Views stay thin; everything that talks to Postgres lives here.
struct ArtworkService {
    let client: SupabaseClient

    private var currentUserID: UUID? {
        client.auth.currentUser?.id
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
