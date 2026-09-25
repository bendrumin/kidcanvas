import SwiftUI
import Supabase

@main
struct KidCanvasApp: App {
    @StateObject private var authManager = AuthManager.shared
    /// Created at launch, not on first use, so its Transaction.updates
    /// listener is running before any renewal or approval can arrive.
    @StateObject private var store = StoreManager.shared
    /// "system" | "light" | "dark", set from Settings.
    @AppStorage("appearance") private var appearance = "system"

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(store)
                .preferredColorScheme(
                    appearance == "light" ? .light :
                    appearance == "dark" ? .dark : nil
                )
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var store: StoreManager
    
    var body: some View {
        Group {
            if authManager.isLoading {
                LoadingView()
            } else if authManager.isAuthenticated {
                MainTabView()
            } else {
                AuthView()
            }
        }
        .task {
            await authManager.checkSession()
        }
        // Plan and entitlements follow the signed-in account, so switching
        // accounts never carries one person's plan over to the next.
        .onChange(of: authManager.currentUser?.id) { _, userID in
            Task {
                if userID != nil {
                    await store.start()
                } else {
                    store.reset()
                }
            }
        }
    }
}

struct LoadingView: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: Color.paperGradientStops,
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 20) {
                Image(systemName: "paintpalette.fill")
                    .font(.system(size: 60))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.pink, .purple],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                
                ProgressView()
                    .tint(.pink)
            }
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthManager.shared)
        .environmentObject(StoreManager.shared)
}

