import Foundation

struct User: Codable, Identifiable {
    let id: UUID
    let email: String?
    let userMetadata: UserMetadata?
    
    enum CodingKeys: String, CodingKey {
        case id
        case email
        case userMetadata = "user_metadata"
    }
    
    var fullName: String {
        userMetadata?.fullName ?? email?.components(separatedBy: "@").first ?? "User"
    }
}

struct UserMetadata: Codable {
    let fullName: String?
    let familyName: String?
    
    enum CodingKeys: String, CodingKey {
        case fullName = "full_name"
        case familyName = "family_name"
    }
}

struct Family: Codable, Identifiable {
    let id: UUID
    let name: String
    let createdAt: Date
    let createdBy: UUID
    
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
    let description: String?
    let tags: [String]?
    let aiTags: [String]?
    let aiDescription: String?
    let createdDate: Date
    let childAgeMonths: Int?
    let isFavorite: Bool
    let uploadedAt: Date
    let uploadedBy: UUID
    
    // Joined child data
    var child: Child?
    
    enum CodingKeys: String, CodingKey {
        case id
        case familyId = "family_id"
        case childId = "child_id"
        case imageUrl = "image_url"
        case thumbnailUrl = "thumbnail_url"
        case title
        case description
        case tags
        case aiTags = "ai_tags"
        case aiDescription = "ai_description"
        case createdDate = "created_date"
        case childAgeMonths = "child_age_months"
        case isFavorite = "is_favorite"
        case uploadedAt = "uploaded_at"
        case uploadedBy = "uploaded_by"
        case child = "children"
    }
}

