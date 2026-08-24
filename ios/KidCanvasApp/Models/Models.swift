import Foundation
import Supabase

// Auth users come from the Supabase SDK; this adds the display helper the
// views need.
extension Auth.User {
    var fullName: String {
        if case .string(let name)? = userMetadata["full_name"] {
            return name
        }
        return email?.components(separatedBy: "@").first ?? "User"
    }
}

struct Family: Codable, Identifiable {
    let id: UUID
    let name: String
    let createdAt: Date
    let createdBy: UUID?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case createdAt = "created_at"
        case createdBy = "created_by"
    }
}

struct FamilyMember: Codable, Identifiable {
    let id: UUID
    let familyId: UUID
    let userId: UUID
    let role: String
    let nickname: String?
    let joinedAt: Date
    let family: Family?

    enum CodingKeys: String, CodingKey {
        case id
        case familyId = "family_id"
        case userId = "user_id"
        case role
        case nickname
        case joinedAt = "joined_at"
        case family = "families"
    }
}

struct Child: Codable, Identifiable, Hashable {
    let id: UUID
    let familyId: UUID
    let name: String
    let birthDate: Date?
    let avatarColor: String?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case familyId = "family_id"
        case name
        case birthDate = "birth_date"
        case avatarColor = "avatar_color"
        case createdAt = "created_at"
    }

    var initial: String {
        String(name.prefix(1)).uppercased()
    }

    var color: String {
        avatarColor ?? "#E91E63"
    }
}

struct Artwork: Codable, Identifiable {
    let id: UUID
    let familyId: UUID
    let childId: UUID
    let imageUrl: String
    let thumbnailUrl: String?
    let title: String
    let story: String?
    let description: String?
    let tags: [String]?
    let createdDate: Date
    let childAgeMonths: Int?
    let isFavorite: Bool
    let uploadedAt: Date
    let uploadedBy: UUID?

    // Joined child data
    var child: Child?

    enum CodingKeys: String, CodingKey {
        case id
        case familyId = "family_id"
        case childId = "child_id"
        case imageUrl = "image_url"
        case thumbnailUrl = "thumbnail_url"
        case title
        case story
        case description
        case tags
        case createdDate = "created_date"
        case childAgeMonths = "child_age_months"
        case isFavorite = "is_favorite"
        case uploadedAt = "uploaded_at"
        case uploadedBy = "uploaded_by"
        case child = "children"
    }
}

/// The five reactions the database's CHECK constraint allows.
enum Reaction: String, CaseIterable, Identifiable {
    case love = "❤️"
    case adore = "😍"
    case artistic = "🎨"
    case applause = "👏"
    case star = "🌟"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .love: "Love"
        case .adore: "Adore"
        case .artistic: "Artistic"
        case .applause: "Bravo"
        case .star: "Star"
        }
    }
}

struct ReactionCount: Codable, Identifiable {
    let emojiType: String
    let count: Int

    var id: String { emojiType }

    enum CodingKeys: String, CodingKey {
        case emojiType = "emoji_type"
        case count
    }
}

struct ArtworkComment: Codable, Identifiable {
    let id: UUID
    let artworkId: UUID
    let userId: UUID
    let text: String
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case artworkId = "artwork_id"
        case userId = "user_id"
        case text
        case createdAt = "created_at"
    }
}

