import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var selectedTab = 0
    @State private var showOnboarding = false
    /// Only nag once per install. Someone who taps "I'll do this later" gets an
    /// empty gallery, which is at least honest, and the upload sheet now explains
    /// itself too.
    @AppStorage("hasSeenOnboarding") private var hasSeenOnboarding = false
    @ObservedObject private var push = PushNotifications.shared
    @State private var notificationArtwork: Artwork?

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
        .sheet(item: $notificationArtwork) { artwork in
            NavigationStack {
                ArtworkDetailView(artwork: artwork)
                    .environmentObject(authManager)
                    .toolbar {
                        ToolbarItem(placement: .topBarLeading) {
                            Button("Done") { notificationArtwork = nil }
                        }
                    }
            }
        }
        .task {
            // children is loaded by AuthManager after sign-in; a family with none
            // has nothing to look at and cannot upload yet.
            if !hasSeenOnboarding && authManager.children.isEmpty {
                showOnboarding = true
                hasSeenOnboarding = true
            }
            await push.registerIfAuthorized()
            // A tap that cold-launched the app landed before this view existed.
            await openPendingArtwork()
        }
        .onChange(of: push.pendingArtworkID) { _, _ in
            Task { await openPendingArtwork() }
        }
    }

    /// Opens the artwork from a tapped family notification as a sheet over
    /// whichever tab is showing, so the tap lands on the drawing itself rather
    /// than on a feed the user then has to scroll.
    private func openPendingArtwork() async {
        guard let id = push.pendingArtworkID else { return }
        push.pendingArtworkID = nil
        let service = ArtworkService(client: authManager.client)
        if let artwork = try? await service.artwork(id: id) {
            showOnboarding = false
            notificationArtwork = artwork
        }
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthManager.shared)
}

