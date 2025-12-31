import Foundation
import Supabase

@MainActor
class AuthManager: ObservableObject {
    static let shared = AuthManager()
    
    @Published var isAuthenticated = false
    @Published var isLoading = true
    @Published var currentUser: User?
    @Published var currentFamily: Family?
    @Published var children: [Child] = []
    
    private let supabase = SupabaseClient(
        supabaseURL: Config.supabaseURL,
        supabaseKey: Config.supabaseAnonKey
    )
    
    private init() {}
    
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
        let session = try await supabase.auth.signUp(
            email: email,
            password: password,
            data: [
                "full_name": .string(fullName),
                "family_name": .string(familyName)
            ]
        )
        
        if let user = session.user {
            currentUser = user
            // Create family
            try await supabase.rpc("create_family_for_user", params: ["family_name": familyName]).execute()
            isAuthenticated = true
            await loadFamily()
        }
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
            // Get family membership
            let memberships: [FamilyMember] = try await supabase
                .from("family_members")
                .select("*, families(*)")
                .eq("user_id", value: userId.uuidString)
                .execute()
                .value
            
            if let membership = memberships.first, let family = membership.family {
                currentFamily = family
                await loadChildren(familyId: family.id)
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

