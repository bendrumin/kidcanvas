import SwiftUI

/// Story-first, newest-first. The gallery answers "show me everything"; the
/// feed answers "what happened lately".
struct FeedView: View {
    @EnvironmentObject var authManager: AuthManager

    @State private var artworks: [Artwork] = []
    @State private var isLoading = true

    private var service: ArtworkService {
        ArtworkService(client: authManager.client)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.paperBackground
                    .ignoresSafeArea()

                if isLoading {
                    ProgressView().tint(.pink)
                } else if artworks.isEmpty {
                    EmptyFeedView()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 20) {
                            ForEach(artworks) { artwork in
                                FeedCard(artwork: artwork, service: service)
                            }
                        }
                        .padding()
                        .padding(.bottom, 60)
                    }
                    .refreshable { await load() }
                }
            }
            .navigationTitle("Recently")
        }
        .task(id: authManager.currentFamily?.id) { await load() }
    }

    private func load() async {
        guard let familyId = authManager.currentFamily?.id else {
            isLoading = false
            return
        }
        artworks = (try? await service.artworks(familyId: familyId)) ?? []
        isLoading = false
    }
}

struct FeedCard: View {
    let artwork: Artwork
    let service: ArtworkService

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            NavigationLink(destination: ArtworkDetailView(artwork: artwork)) {
                VStack(alignment: .leading, spacing: 0) {
                    AsyncImage(url: URL(string: artwork.thumbnailUrl ?? artwork.imageUrl)) { image in
                        image.resizable().aspectRatio(contentMode: .fit)
                    } placeholder: {
                        Rectangle()
                            .fill(Color.placeholderFill)
                            .frame(height: 220)
                            .overlay { ProgressView().tint(.pink) }
                    }

                    FeedCardHeader(
                        title: artwork.title,
                        childName: artwork.child?.name,
                        date: artwork.createdDate
                    )

                    if let story = artwork.story, !story.isEmpty {
                        Text(story)
                            .font(.subheadline)
                            .foregroundColor(.primary)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.horizontal, 14)
                            .padding(.bottom, 12)
                    }
                }
            }
            .buttonStyle(.plain)

            Divider()

            ReactionBar(artworkId: artwork.id, service: service)
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
        }
        .background(Color.cardSurface)
        .cornerRadius(18)
        .shadow(color: .black.opacity(0.07), radius: 10, y: 4)
    }
}

struct FeedCardHeader: View {
    let title: String
    let childName: String?
    let date: Date

    var body: some View {
        HStack(spacing: 8) {
            if let childName {
                Circle()
                    .fill(
                        LinearGradient(colors: [.pink, .purple],
                                       startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .frame(width: 26, height: 26)
                    .overlay {
                        Text(String(childName.prefix(1)).uppercased())
                            .font(.caption2.bold())
                            .foregroundColor(.white)
                    }
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.subheadline.bold())
                    .foregroundColor(.primary)
                    .lineLimit(2)
                Text(childName.map { "\($0) · " } .map { $0 + date.formatted(date: .abbreviated, time: .omitted) }
                     ?? date.formatted(date: .abbreviated, time: .omitted))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
        .padding(14)
    }
}

struct EmptyFeedView: View {
    var body: some View {
        ContentUnavailableView {
            Label("Nothing here yet", systemImage: "sparkles")
        } description: {
            Text("Scan a drawing and write down what they said about it — that's the part you'll want back later.")
        }
    }
}
