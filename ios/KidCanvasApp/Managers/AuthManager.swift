import Foundation
import Supabase

enum SignUpOutcome: Error, LocalizedError {
    case emailConfirmationRequired

    var errorDescription: String? {
        "Almost there! Check your email to confirm your account, then sign in."
    }
}

@MainActor
class AuthManager: ObservableObject {
    static let shared = AuthManager()

    @Published var isAuthenticated = false
    @Published var isLoading = true
    @Published var currentUser: Auth.User?
    @Published var currentFamily: Family?
    @Published var children: [Child] = []

    private let supabase: SupabaseClient

    private init() {
        // Postgres DATE columns arrive as "yyyy-MM-dd", which the SDK's default
        // decoder rejects — this decoder accepts both timestamps and bare dates.
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let string = try container.decode(String.self)

            let isoFractional = ISO8601DateFormatter()
            isoFractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = isoFractional.date(from: string) { return date }

            let iso = ISO8601DateFormatter()
            if let date = iso.date(from: string) { return date }

            let dateOnly = DateFormatter()
            dateOnly.locale = Locale(identifier: "en_US_POSIX")
            dateOnly.timeZone = TimeZone(identifier: "UTC")
            dateOnly.dateFormat = "yyyy-MM-dd"
            if let date = dateOnly.date(from: string) { return date }

            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Unrecognized date format: \(string)"
            )
        }

        supabase = SupabaseClient(
            supabaseURL: Config.supabaseURL,
            supabaseKey: Config.supabaseAnonKey,
            options: SupabaseClientOptions(db: .init(decoder: decoder))
        )
    }

    var client: SupabaseClient { supabase }

    func checkSession() async {
        isLoading = true

        do {
            let session = try await supabase.auth.session
            currentUser = session.user
            isAuthenticated = true
            await loadFamily()
        } catch {
            isAuthenticated = false
            currentUser = nil
        }

        isLoading = false
    }

    func signIn(email: String, password: String) async throws {
        let session = try await supabase.auth.signIn(email: email, password: password)
        currentUser = session.user
        isAuthenticated = true
        await loadFamily()
    }

    func signUp(email: String, password: String, fullName: String, familyName: String) async throws {
        let response = try await supabase.auth.signUp(
            email: email,
            password: password,
            data: [
                "full_name": .string(fullName),
                "family_name": .string(familyName)
            ]
        )

        guard response.session != nil else {
            // Email confirmation is enabled on the project; the user has to
            // confirm before a session exists.
            throw SignUpOutcome.emailConfirmationRequired
        }

        currentUser = response.user
        try await supabase
            .rpc("create_family_for_user", params: ["family_name": familyName])
            .execute()
        isAuthenticated = true
        await loadFamily()
    }

    func signOut() async throws {
        try await supabase.auth.signOut()
        isAuthenticated = false
        currentUser = nil
        currentFamily = nil
        children = []
    }

    func loadFamily() async {
        guard let userId = currentUser?.id else { return }

        do {
            let memberships: [FamilyMember] = try await supabase
                .from("family_members")
                .select("*, families(*)")
                .eq("user_id", value: userId.uuidString)
                .execute()
                .value

            if let membership = memberships.first, let family = membership.family {
                currentFamily = family
                await loadChildren(familyId: family.id)
            } else if isAuthenticated {
                // Signed in but no family yet (e.g. signup RPC failed earlier).
                try await supabase
                    .rpc("create_family_for_user", params: ["family_name": "\(currentUser?.fullName ?? "My")'s Family"])
                    .execute()
                let retried: [FamilyMember] = try await supabase
                    .from("family_members")
                    .select("*, families(*)")
                    .eq("user_id", value: userId.uuidString)
                    .execute()
                    .value
                if let membership = retried.first, let family = membership.family {
                    currentFamily = family
                    await loadChildren(familyId: family.id)
                }
            }
        } catch {
            print("Error loading family: \(error)")
        }
    }

    func loadChildren(familyId: UUID) async {
        do {
            let loadedChildren: [Child] = try await supabase
                .from("children")
                .select()
                .eq("family_id", value: familyId.uuidString)
                .order("name")
                .execute()
                .value

            children = loadedChildren
        } catch {
            print("Error loading children: \(error)")
        }
    }
}
