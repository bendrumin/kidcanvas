import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var deepLinks: DeepLinkRouter
    @State private var selectedTab = 0
    /// The artwork a widget tap asked for, shown over whichever tab is open.
    @State private var linkedArtwork: Artwork?
    @State private var showOnboarding = false
    /// Only nag once per install. Someone who taps "I'll do this later" gets an
    /// empty gallery, which is at least honest, and the upload sheet now explains
    /// itself too.
    @AppStorage("hasSeenOnboarding") private var hasSeenOnboarding = false
    @ObservedObject private var push = PushNotifications.shared

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
        .sheet(item: $linkedArtwork) { artwork in
            NavigationStack {
                ArtworkDetailView(artwork: artwork)
                    .environmentObject(authManager)
                    .toolbar {
                        ToolbarItem(placement: .topBarLeading) {
                            Button("Done") { linkedArtwork = nil }
                        }
                    }
            }
        }
        // task(id:) rather than onChange: it also runs on first appearance,
        // which is when a link from a cold launch is waiting.
        .task(id: deepLinks.pending) { await openPendingLink() }
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
            linkedArtwork = artwork
        }
    }

    private func openPendingLink() async {
        guard let destination = deepLinks.pending else { return }
        switch destination {
        case .scan:
            linkedArtwork = nil
            selectedTab = 1
        case .artwork(let id):
            selectedTab = 0
            // A deleted artwork or one from another family just leaves the
            // user on the feed, which is where the widget's content lives.
            linkedArtwork = (try? await ArtworkService(client: authManager.client).artwork(id: id)) ?? nil
        }
        // Cleared only after the fetch: pending is this task's id, so
        // clearing it first would cancel the request it is waiting on.
        deepLinks.pending = nil
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthManager.shared)
        .environmentObject(DeepLinkRouter())
}

