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

            // Date-only columns (created_date, birth_date) are calendar days, not
            // instants: parse them at LOCAL midnight so a day picked in the app
            // doesn't display as the day before in a negative-offset timezone.
            let dateOnly = DateFormatter()
            dateOnly.locale = Locale(identifier: "en_US_POSIX")
            dateOnly.timeZone = .current
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
            // `auth.session` only reads the locally stored token, which stays
            // valid until it expires -- so an account deleted on the server
            // (from the web app, or by support) kept "signing in" here for up
            // to an hour, landing in a ghost state with an empty family.
            // `auth.user()` round-trips to the server, so a dead account fails
            // immediately and we fall back to the sign-in screen.
            _ = try await supabase.auth.session
            currentUser = try await supabase.auth.user()
            isAuthenticated = true
            await loadFamily()
        } catch {
            try? await supabase.auth.signOut()
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

    func renameFamily(_ name: String) async throws {
        guard let family = currentFamily else { return }
        struct Rename: Encodable { let name: String }
        try await supabase
            .from("families")
            .update(Rename(name: name))
            .eq("id", value: family.id.uuidString)
            .execute()
        await loadFamily()
    }

    /// Permanently deletes the family and everything in it, for every member.
    /// RLS restricts the row delete to the owner, and every table cascades from
    /// families -- children, artworks, comments, reactions, memberships. Storage
    /// files are removed first, same as account deletion, since a cascade cannot
    /// reach the bucket. loadFamily() then self-heals by creating a fresh empty
    /// family, so the owner lands on a clean slate rather than a broken state.
    func deleteFamily() async throws {
        guard let family = currentFamily else { return }

        let folder = family.id.uuidString.lowercased()
        let storage = supabase.storage.from(Config.artworkBucket)
        if let files = try? await storage.list(path: folder), !files.isEmpty {
            _ = try? await storage.remove(paths: files.map { "\(folder)/\($0.name)" })
        }

        try await supabase
            .from("families")
            .delete()
            .eq("id", value: family.id.uuidString)
            .execute()

        currentFamily = nil
        children = []
        // Let the first-run guide reappear for the fresh family.
        UserDefaults.standard.removeObject(forKey: "hasSeenOnboarding")
        await loadFamily()
    }

    func signOut() async throws {
        try await supabase.auth.signOut()
        isAuthenticated = false
        currentUser = nil
        currentFamily = nil
        children = []
    }

    /// Permanently deletes the account and everything it owns
    /// (App Store Guideline 5.1.1(v)). Artwork files are removed from storage
    /// first, since deleting database rows would otherwise orphan them.
    func deleteAccount() async throws {
        if let familyId = currentFamily?.id {
            let folder = familyId.uuidString.lowercased()
            let storage = supabase.storage.from(Config.artworkBucket)
            if let files = try? await storage.list(path: folder), !files.isEmpty {
                let paths = files.map { "\(folder)/\($0.name)" }
                _ = try? await storage.remove(paths: paths)
            }
        }

        try await supabase.rpc("delete_my_account").execute()

        // The auth row is gone, so a server sign-out would fail; clear locally.
        try? await supabase.auth.signOut()
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
