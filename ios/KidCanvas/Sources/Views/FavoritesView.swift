import SwiftUI

struct FavoritesView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var favorites: [Artwork] = []
    @State private var isLoading = true
    
    private let columns = [
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16)
    ]
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.98, green: 0.97, blue: 0.95)
                    .ignoresSafeArea()
                
                if isLoading {
                    ProgressView()
                        .tint(.pink)
                } else if favorites.isEmpty {
                    EmptyFavoritesView()
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 20) {
                            ForEach(favorites) { artwork in
                                NavigationLink(destination: ArtworkDetailView(artwork: artwork)) {
                                    ArtworkCard(artwork: artwork)
                                }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Favorites")
        }
        .task {
            await loadFavorites()
        }
    }
    
    private func loadFavorites() async {
        guard let familyId = authManager.currentFamily?.id else { return }
        
        do {
            let loaded: [Artwork] = try await authManager.client
                .from("artworks")
                .select("*, children(*)")
                .eq("family_id", value: familyId.uuidString)
                .eq("is_favorite", value: true)
                .order("created_date", ascending: false)
                .execute()
                .value
            
            favorites = loaded
        } catch {
            print("Error loading favorites: \(error)")
        }
        
        isLoading = false
    }
}

struct EmptyFavoritesView: View {
    var body: some View {
        VStack(spacing: 24) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [.pink.opacity(0.2), .red.opacity(0.2)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 120, height: 120)
                
                Image(systemName: "heart.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.pink)
            }
            
            Text("No Favorites Yet")
                .font(.title2.bold())
            
            Text("Tap the heart on any artwork\nto add it to your favorites")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
    }
}

#Preview {
    FavoritesView()
        .environmentObject(AuthManager.shared)
}

