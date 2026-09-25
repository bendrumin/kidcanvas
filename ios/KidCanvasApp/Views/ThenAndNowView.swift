import SwiftUI
import UIKit

/// One child's drawings of one subject, oldest to newest. "Emma's dinosaurs,
/// age 3 to 7."
struct ThenAndNowView: View {
    @EnvironmentObject var authManager: AuthManager
    let child: Child
    let term: String

    /// The gallery already has every artwork in memory, so it hands them over
    /// instead of making this screen fetch them again. The detail view does
    /// not, so nil means load.
    private let preloaded: [Artwork]?

    @State private var matches: [Artwork] = []
    @State private var isLoading = true
    @State private var shareImage: Image?

    init(child: Child, term: String, artworks: [Artwork]? = nil) {
        self.child = child
        self.term = term
        self.preloaded = artworks
    }

    private var title: String {
        "\(child.name)'s \(ThenAndNow.pluralize(term))"
    }

    private var ageSpan: String? {
        let ages = matches.compactMap { $0.ageMonths(birthDate: child.birthDate) }
        guard let first = ages.first, let last = ages.last, first / 12 != last / 12 else { return nil }
        return "age \(first / 12) to \(last / 12)"
    }

    var body: some View {
        ZStack {
            Color.paperBackground
                .ignoresSafeArea()

            if isLoading {
                ProgressView()
                    .tint(.pink)
            } else if matches.count < 2 {
                ThenAndNowEmptyState(term: term, childName: child.name, count: matches.count)
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(title)
                                .font(.title2.bold())
                            Text(subtitle)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        .padding(.horizontal)

                        ScrollView(.horizontal, showsIndicators: false) {
                            LazyHStack(alignment: .top, spacing: 0) {
                                ForEach(Array(matches.enumerated()), id: \.element.id) { index, artwork in
                                    NavigationLink(destination: ArtworkDetailView(artwork: artwork)) {
                                        ThenAndNowItem(
                                            artwork: artwork,
                                            ageMonths: artwork.ageMonths(birthDate: child.birthDate),
                                            isLast: index == matches.count - 1
                                        )
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .scrollTargetLayout()
                            .padding(.horizontal)
                        }
                        .scrollTargetBehavior(.viewAligned)
                    }
                    .padding(.vertical)
                    // Clears the floating tab bar, same as the detail screen.
                    .padding(.bottom, 70)
                }
            }
        }
        .navigationTitle("Then and now")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if let shareImage {
                ToolbarItem(placement: .topBarTrailing) {
                    ShareLink(
                        item: shareImage,
                        preview: SharePreview(title, image: shareImage)
                    ) {
                        Image(systemName: "square.and.arrow.up")
                    }
                    .accessibilityLabel("Share then and now")
                }
            }
        }
        .task(id: "\(child.id)|\(term)") {
            await load()
        }
    }

    private var subtitle: String {
        [ "\(matches.count) drawings", ageSpan, "oldest first" ]
            .compactMap { $0 }
            .joined(separator: ", ") + "."
    }

    private func load() async {
        var artworks = preloaded ?? []
        if preloaded == nil, let familyId = authManager.currentFamily?.id {
            do {
                artworks = try await ArtworkService(client: authManager.client).artworks(familyId: familyId)
            } catch {
                print("Error loading then and now: \(error)")
            }
        }
        matches = ThenAndNow.timeline(artworks, childId: child.id, term: term)
        isLoading = false
        await renderShareCard()
    }

    /// ImageRenderer draws synchronously and cannot wait on AsyncImage, so the
    /// two pieces are downloaded first. Only the first and latest are fetched:
    /// the card is a before and after, not the whole timeline.
    private func renderShareCard() async {
        guard matches.count >= 2, let first = matches.first, let latest = matches.last else { return }
        async let firstImage = Self.download(first.imageUrl)
        async let latestImage = Self.download(latest.imageUrl)
        guard let thenImage = await firstImage, let nowImage = await latestImage else { return }

        let card = ThenAndNowShareCard(
            title: title,
            then: .init(image: thenImage, artwork: first, ageMonths: first.ageMonths(birthDate: child.birthDate)),
            now: .init(image: nowImage, artwork: latest, ageMonths: latest.ageMonths(birthDate: child.birthDate))
        )
        let renderer = ImageRenderer(content: card)
        // 3x of a 360pt-wide card is 1080px, the size social apps expect.
        renderer.scale = 3
        if let uiImage = renderer.uiImage {
            shareImage = Image(uiImage: uiImage)
        }
    }

    private static func download(_ urlString: String) async -> UIImage? {
        guard let url = URL(string: urlString) else { return nil }
        guard let (data, _) = try? await URLSession.shared.data(from: url) else { return nil }
        return UIImage(data: data)
    }
}

/// One stop on the timeline: the drawing, a dot on the line, the age, and what
/// the child said.
private struct ThenAndNowItem: View {
    let artwork: Artwork
    let ageMonths: Int?
    let isLast: Bool

    private let width: CGFloat = 220

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            AsyncImage(url: URL(string: artwork.thumbnailUrl ?? artwork.imageUrl)) { image in
                image
                    .resizable()
                    .aspectRatio(1, contentMode: .fill)
            } placeholder: {
                Rectangle()
                    .fill(Color.placeholderFill)
                    .overlay { ProgressView().tint(.pink) }
            }
            .frame(width: width - 20, height: width - 20)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.08), radius: 8, y: 4)

            // The line runs into the next item's dot, which is what makes a
            // row of cards read as a timeline.
            HStack(spacing: 0) {
                Circle()
                    .fill(LinearGradient(colors: [.pink, .purple], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 12, height: 12)
                if !isLast {
                    Rectangle()
                        .fill(Color.purple.opacity(0.25))
                        .frame(height: 2)
                }
            }
            .accessibilityHidden(true)

            Text(ThenAndNow.shortAge(months: ageMonths) ?? artwork.createdDate.formatted(date: .abbreviated, time: .omitted))
                .font(.headline)
            if ageMonths != nil {
                Text(artwork.createdDate.formatted(date: .abbreviated, time: .omitted))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Text(artwork.title)
                .font(.subheadline.weight(.semibold))
                .lineLimit(2)
            if let story = artwork.story?.trimmed, !story.isEmpty {
                Text("\u{201C}\(story)\u{201D}")
                    .font(.subheadline)
                    .italic()
                    .foregroundColor(.secondary)
                    .lineLimit(6)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(width: width, alignment: .leading)
        .accessibilityElement(children: .combine)
    }
}

private struct ThenAndNowEmptyState: View {
    let term: String
    let childName: String
    let count: Int

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "sparkles")
                .font(.system(size: 44))
                .foregroundColor(.purple.opacity(0.6))
            Text(count == 1
                 ? "Only one \(ThenAndNow.singularize(term)) so far."
                 : "No \(ThenAndNow.pluralize(term)) yet.")
                .font(.title3.bold())
                .multilineTextAlignment(.center)
            Text(count == 1
                 ? "Check back next year."
                 : "Nothing in \(childName)'s titles or stories mentions \(term).")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(32)
    }
}

/// The image people post. First and latest side by side, ages and quotes under
/// each, and a small mark in the corner. The mark is how the loop works, but a
/// card that shouts the brand is one parents will not share, so it stays quiet.
struct ThenAndNowShareCard: View {
    struct Piece {
        let image: UIImage
        let artwork: Artwork
        let ageMonths: Int?
    }

    let title: String
    let then: Piece
    let now: Piece

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(title)
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundColor(Color(red: 0.2, green: 0.16, blue: 0.14))
                .lineLimit(2)

            HStack(alignment: .top, spacing: 14) {
                column(then, label: "Then")
                column(now, label: "Now")
            }

            Spacer(minLength: 0)

            HStack(spacing: 4) {
                Spacer()
                Image(systemName: "paintpalette.fill")
                    .font(.system(size: 9))
                Text("KidCanvas")
                    .font(.system(size: 10, weight: .semibold, design: .rounded))
            }
            .foregroundColor(Color(red: 0.2, green: 0.16, blue: 0.14).opacity(0.45))
        }
        .padding(20)
        .frame(width: 360, height: 450)
        // Fixed cream rather than paperBackground: the card is an image that
        // leaves the app, and it should look the same in anyone's feed
        // regardless of the sender's appearance setting.
        .background(Color(red: 1.0, green: 0.97, blue: 0.93))
    }

    private func column(_ piece: Piece, label: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Image(uiImage: piece.image)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: 153, height: 153)
                .clipShape(RoundedRectangle(cornerRadius: 12))

            Text(ThenAndNow.shortAge(months: piece.ageMonths) ?? label)
                .font(.system(size: 15, weight: .bold, design: .rounded))
                .foregroundColor(Color(red: 0.2, green: 0.16, blue: 0.14))

            Text(quote(for: piece.artwork))
                .font(.system(size: 12))
                .italic()
                .foregroundColor(Color(red: 0.2, green: 0.16, blue: 0.14).opacity(0.75))
                .lineLimit(7)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(width: 153, alignment: .leading)
    }

    /// The child's words when there are any. The title stands in otherwise,
    /// unquoted, so it is not passed off as something they said.
    private func quote(for artwork: Artwork) -> String {
        if let story = artwork.story?.trimmed, !story.isEmpty {
            return "\u{201C}\(story)\u{201D}"
        }
        return artwork.title
    }
}
