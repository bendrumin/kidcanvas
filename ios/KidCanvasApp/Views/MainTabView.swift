import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var selectedTab = 0
    @State private var showOnboarding = false
    /// Only nag once per install. Someone who taps "I'll do this later" gets an
    /// empty gallery, which is at least honest, and the upload sheet now explains
    /// itself too.
    @AppStorage("hasSeenOnboarding") private var hasSeenOnboarding = false
    
    var body: some View {
        TabView(selection: $selectedTab) {
            FeedView()
                .tabItem {
                    Label("Recently", systemImage: "sparkles.rectangle.stack.fill")
                }
                .tag(0)

            GalleryView()
                .tabItem {
                    Label("Gallery", systemImage: "square.grid.2x2.fill")
                }
                .tag(4)
            
            ScannerView()
                .tabItem {
                    Label("Scan", systemImage: "camera.fill")
                }
                .tag(1)
            
            FavoritesView()
                .tabItem {
                    Label("Favorites", systemImage: "heart.fill")
                }
                .tag(2)
            
            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(3)
        }
        .tint(.pink)
        .sheet(isPresented: $showOnboarding) {
            OnboardingView()
                .environmentObject(authManager)
        }
        .task {
            // children is loaded by AuthManager after sign-in; a family with none
            // has nothing to look at and cannot upload yet.
            if !hasSeenOnboarding && authManager.children.isEmpty {
                showOnboarding = true
                hasSeenOnboarding = true
            }
        }
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthManager.shared)
}

