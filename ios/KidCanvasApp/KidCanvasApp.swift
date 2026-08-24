import SwiftUI
import Supabase

@main
struct KidCanvasApp: App {
    @StateObject private var authManager = AuthManager.shared
    /// "system" | "light" | "dark", set from Settings.
    @AppStorage("appearance") private var appearance = "system"

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .preferredColorScheme(
                    appearance == "light" ? .light :
                    appearance == "dark" ? .dark : nil
                )
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager
    
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
}

