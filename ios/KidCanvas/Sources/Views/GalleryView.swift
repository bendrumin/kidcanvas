import SwiftUI

struct GalleryView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var artworks: [Artwork] = []
    @State private var isLoading = true
    @State private var selectedChild: Child?
    
    private let columns = [
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16)
    ]
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                Color(red: 0.98, green: 0.97, blue: 0.95)
                    .ignoresSafeArea()
                
                if isLoading {
                    ProgressView()
                        .tint(.pink)
                } else if artworks.isEmpty {
                    EmptyGalleryView()
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 20) {
                            ForEach(filteredArtworks) { artwork in
                                NavigationLink(destination: ArtworkDetailView(artwork: artwork)) {
                                    ArtworkCard(artwork: artwork)
                                }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Gallery")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if let family = authManager.currentFamily {
                        Text(family.name)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button("All Children") {
                            selectedChild = nil
                        }
                        
                        ForEach(authManager.children) { child in
                            Button(child.name) {
                                selectedChild = child
                            }
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Text(selectedChild?.name ?? "All")
                                .font(.subheadline)
                            Image(systemName: "chevron.down")
                                .font(.caption)
                        }
                        .foregroundColor(.pink)
                    }
                }
            }
        }
        .task {
            await loadArtworks()
        }
    }
    
    private var filteredArtworks: [Artwork] {
        guard let child = selectedChild else { return artworks }
        return artworks.filter { $0.childId == child.id }
    }
    
    private func loadArtworks() async {
        guard let familyId = authManager.currentFamily?.id else { return }
        
        do {
            let loaded: [Artwork] = try await authManager.client
                .from("artworks")
                .select("*, children(*)")
                .eq("family_id", value: familyId.uuidString)
                .order("created_date", ascending: false)
                .execute()
                .value
            
            artworks = loaded
        } catch {
            print("Error loading artworks: \(error)")
        }
        
        isLoading = false
    }
}

struct ArtworkCard: View {
    let artwork: Artwork
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Image
            AsyncImage(url: URL(string: artwork.thumbnailUrl ?? artwork.imageUrl)) { image in
                image
                    .resizable()
                    .aspectRatio(1, contentMode: .fill)
            } placeholder: {
                Rectangle()
                    .fill(Color.gray.opacity(0.2))
                    .overlay {
                        ProgressView()
                            .tint(.pink)
                    }
            }
            .aspectRatio(1, contentMode: .fit)
            .clipped()
            
            // Info
            VStack(alignment: .leading, spacing: 4) {
                Text(artwork.title)
                    .font(.subheadline.bold())
                    .foregroundColor(.primary)
                    .lineLimit(1)
                
                if let child = artwork.child {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [.pink, .purple],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 16, height: 16)
                            .overlay {
                                Text(child.initial)
                                    .font(.system(size: 8, weight: .bold))
                                    .foregroundColor(.white)
                            }
                        
                        Text(child.name)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding(12)
        }
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.08), radius: 8, y: 4)
        .overlay(alignment: .topTrailing) {
            if artwork.isFavorite {
                Image(systemName: "heart.fill")
                    .foregroundColor(.pink)
                    .padding(8)
                    .background(.white.opacity(0.9))
                    .clipShape(Circle())
                    .padding(8)
            }
        }
    }
}

struct EmptyGalleryView: View {
    var body: some View {
        VStack(spacing: 24) {
            ZStack {
                RoundedRectangle(cornerRadius: 24)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.yellow.opacity(0.3),
                                Color.orange.opacity(0.3)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 120, height: 120)
                
                Image(systemName: "paintpalette.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.orange)
            }
            
            Text("Your Gallery Awaits!")
                .font(.title2.bold())
            
            Text("Scan your first artwork to start\nbuilding your family's collection")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
    }
}

#Preview {
    GalleryView()
        .environmentObject(AuthManager.shared)
}

