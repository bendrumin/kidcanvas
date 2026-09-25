import SwiftUI

struct ArtworkDetailView: View {
    @EnvironmentObject var authManager: AuthManager
    let artwork: Artwork

    @State private var isFavorite: Bool
    @State private var showShareSheet = false
    @State private var showDeleteAlert = false
    @State private var isAddingStory = false
    @State private var isRecording = false
    @State private var showDeleteVoiceAlert = false
    /// Local copies so a story or recording added from a sheet shows at once;
    /// `artwork` is a snapshot from the list that pushed this screen.
    @State private var story: String?
    @State private var voicePath: String?
    @State private var voiceDuration: Int?
    /// Owners and parents can record and delete recordings; everyone else
    /// only listens. Mirrors the storage policies in migration 013.
    @State private var canEdit = false
    /// Bumped on every new take so the player remounts.
    @State private var voiceVersion = 0
    @Environment(\.dismiss) private var dismiss

    init(artwork: Artwork) {
        self.artwork = artwork
        _isFavorite = State(initialValue: artwork.isFavorite)
        _story = State(initialValue: artwork.story)
        _voicePath = State(initialValue: artwork.voiceNotePath)
        _voiceDuration = State(initialValue: artwork.voiceDurationSeconds)
    }

    private var service: ArtworkService {
        ArtworkService(client: authManager.client)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Image
                AsyncImage(url: URL(string: artwork.imageUrl)) { phase in
                    switch phase {
                    case .empty:
                        Rectangle()
                            .fill(Color.placeholderFill)
                            .aspectRatio(1, contentMode: .fit)
                            .overlay {
                                ProgressView()
                                    .tint(.pink)
                            }
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(maxWidth: .infinity)
                            .background(Color.faintFill)
                    case .failure:
                        Rectangle()
                            .fill(Color.placeholderFill)
                            .aspectRatio(1, contentMode: .fit)
                            .overlay {
                                Image(systemName: "photo")
                                    .font(.largeTitle)
                                    .foregroundColor(.gray)
                            }
                    @unknown default:
                        EmptyView()
                    }
                }

                // Info Card
                VStack(alignment: .leading, spacing: 20) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(artwork.title)
                                .font(.title2.bold())

                            if let child = artwork.child {
                                HStack(spacing: 6) {
                                    Circle()
                                        .fill(
                                            LinearGradient(
                                                colors: [.pink, .purple],
                                                startPoint: .topLeading,
                                                endPoint: .bottomTrailing
                                            )
                                        )
                                        .frame(width: 24, height: 24)
                                        .overlay {
                                            Text(child.initial)
                                                .font(.caption.bold())
                                                .foregroundColor(.white)
                                        }

                                    Text("by \(child.name)")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }

                        Spacer()

                        // Favorite button
                        Button(action: toggleFavorite) {
                            Image(systemName: isFavorite ? "heart.fill" : "heart")
                                .font(.title2)
                                .foregroundColor(isFavorite ? .pink : .gray)
                        }
                    }

                    Divider()

                    // Date
                    HStack {
                        Image(systemName: "calendar")
                            .foregroundColor(.secondary)
                        Text(artwork.createdDate.formatted(date: .long, time: .omitted))
                            .font(.subheadline)
                            .foregroundColor(.secondary)

                        if let ageMonths = artwork.childAgeMonths {
                            Text("•")
                                .foregroundColor(.secondary)
                            Text("Age: \(ageText(months: ageMonths))")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }

                    if let story, !story.trimmed.isEmpty {
                        StoryCard(story: story, childName: artwork.child?.name)
                    } else {
                        AddStoryPrompt { isAddingStory = true }
                    }

                    if let voicePath {
                        VoiceNotePlaybackView(
                            path: voicePath,
                            durationSeconds: voiceDuration,
                            childName: artwork.child?.name
                        )
                        // Re-recording keeps the same key; a new identity
                        // throws away the old player and its loaded audio.
                        .id("\(voicePath)-\(voiceDuration ?? 0)-\(voiceVersion)")
                    } else if canEdit, let story, !story.trimmed.isEmpty {
                        // With no story yet, AddStorySheet already offers the
                        // recorder; only show this once the written story exists.
                        RecordVoicePrompt { isRecording = true }
                    }

                    if let child = artworkChild {
                        MoreLikeThis(artwork: artwork, child: child)
                    }

                    ReactionBar(artworkId: artwork.id, service: service)

                    CommentsSection(artworkId: artwork.id, familyId: artwork.familyId, service: service)

                    // Description
                    if let description = artwork.description, !description.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Description")
                                .font(.subheadline.bold())
                                .foregroundColor(.secondary)

                            Text(description)
                                .font(.body)
                        }
                    }

                    // Tags
                    if let tags = artwork.tags, !tags.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Tags")
                                .font(.subheadline.bold())
                                .foregroundColor(.secondary)

                            FlowLayout(spacing: 8) {
                                ForEach(tags, id: \.self) { tag in
                                    Text(tag)
                                        .font(.caption)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(Color.pink.opacity(0.1))
                                        .foregroundColor(.pink)
                                        .cornerRadius(20)
                                }
                            }
                        }
                    }
                }
                .padding(24)
                // Clears the floating tab bar. Without this the story card ran
                // underneath it on a 6.3-inch phone and the reactions and
                // comments below were unreachable.
                .padding(.bottom, 70)
                .background(Color.cardSurface)
                .cornerRadius(24, corners: [.topLeft, .topRight])
                .offset(y: -24)
            }
        }
        .ignoresSafeArea(edges: .top)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button(action: { showShareSheet = true }) {
                        Label("Share", systemImage: "square.and.arrow.up")
                    }

                    if canEdit, voicePath != nil {
                        Button(action: { isRecording = true }) {
                            Label("Re-record", systemImage: "mic")
                        }
                        Button(role: .destructive, action: { showDeleteVoiceAlert = true }) {
                            Label("Delete recording", systemImage: "mic.slash")
                        }
                    }

                    Button(role: .destructive, action: { showDeleteAlert = true }) {
                        Label("Delete", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .font(.title3)
                }
            }
        }
        .alert("Delete Artwork", isPresented: $showDeleteAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                deleteArtwork()
            }
        } message: {
            Text("Are you sure you want to delete this artwork? This cannot be undone.")
        }
        .alert("Delete recording", isPresented: $showDeleteVoiceAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                deleteVoiceNote()
            }
        } message: {
            Text("The recording is removed for everyone in your family. The artwork and written story stay.")
        }
        .sheet(isPresented: $isAddingStory) {
            AddStorySheet(artwork: artwork, service: service) { savedStory, voice in
                if let savedStory { story = savedStory }
                if let voice {
                    voicePath = voice.path
                    voiceDuration = voice.durationSeconds
                    voiceVersion += 1
                }
            }
        }
        .sheet(isPresented: $isRecording) {
            RecordVoiceSheet(artwork: artwork, service: service) { path, duration in
                voicePath = path
                voiceDuration = duration
                voiceVersion += 1
            }
        }
        .task {
            let role = await service.familyRole(familyId: artwork.familyId)
            canEdit = role == "owner" || role == "parent"
        }
    }
    
    /// The joined child, or the family's copy when the row came without one.
    private var artworkChild: Child? {
        artwork.child ?? authManager.children.first { $0.id == artwork.childId }
    }

    /// Shared with the widget so the home screen and this screen word ages the
    /// same way.
    private func ageText(months: Int) -> String {
        AgeLabel.text(months: months)
    }

    private func toggleFavorite() {
        Task {
            let newValue = !isFavorite

            do {
                try await authManager.client
                    .from("artworks")
                    .update(["is_favorite": newValue])
                    .eq("id", value: artwork.id.uuidString)
                    .execute()

                withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                    isFavorite = newValue
                }
            } catch {
                print("Error toggling favorite: \(error)")
            }
        }
    }

    private func deleteVoiceNote() {
        Task {
            do {
                try await service.deleteVoiceNote(familyId: artwork.familyId, artworkId: artwork.id)
                voicePath = nil
                voiceDuration = nil
            } catch {
                print("Error deleting voice note: \(error)")
            }
        }
    }

    private func deleteArtwork() {
        Task {
            do {
                // Removes the recording before the row; see ArtworkService.
                try await service.deleteArtwork(artwork)

                dismiss()
            } catch {
                print("Error deleting artwork: \(error)")
            }
        }
    }
}

/// "More like this": the subjects in this piece, each opening the child's
/// other drawings of it. The words come from this artwork alone, so a subject
/// with no other matches lands on the "only one so far" state, which is still
/// worth seeing.
private struct MoreLikeThis: View {
    let artwork: Artwork
    let child: Child

    var body: some View {
        let subjects = ThenAndNow.subjects(in: artwork, childName: child.name)
        if !subjects.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Label("More like this", systemImage: "sparkles")
                    .font(.subheadline.bold())
                    .foregroundColor(.secondary)
                FlowLayout(spacing: 8) {
                    ForEach(subjects, id: \.self) { subject in
                        NavigationLink(destination: ThenAndNowView(child: child, term: subject)) {
                            Text("\(child.name)'s \(ThenAndNow.pluralize(subject))")
                                .font(.caption.weight(.medium))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color.pink.opacity(0.1))
                                .foregroundColor(.pink)
                                .cornerRadius(20)
                        }
                    }
                }
            }
        }
    }
}

// Custom FlowLayout for tags
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = flowLayout(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = flowLayout(proposal: proposal, subviews: subviews)

        for (index, frame) in result.frames.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY), proposal: .unspecified)
        }
    }

    private func flowLayout(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, frames: [CGRect]) {
        let maxWidth = proposal.width ?? .infinity
        var frames: [CGRect] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)

            if x + size.width > maxWidth && x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }

            frames.append(CGRect(origin: CGPoint(x: x, y: y), size: size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }

        return (CGSize(width: maxWidth, height: y + rowHeight), frames)
    }
}

// Corner radius helper
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(roundedRect: rect, byRoundingCorners: corners, cornerRadii: CGSize(width: radius, height: radius))
        return Path(path.cgPath)
    }
}

#Preview {
    NavigationStack {
        ArtworkDetailView(artwork: Artwork(
            id: UUID(),
            familyId: UUID(),
            childId: UUID(),
            imageUrl: "https://picsum.photos/400",
            thumbnailUrl: nil,
            title: "Rainbow Butterfly",
            story: "She said it's a butterfly that only comes out at night, and its wings are made of rainbows so it can find its way home.",
            description: "A beautiful butterfly painting from art class",
            tags: ["butterfly", "colorful", "nature"],
            createdDate: Date(),
            childAgeMonths: 48,
            isFavorite: true,
            uploadedAt: Date(),
            uploadedBy: UUID()
        ))
    }
    .environmentObject(AuthManager.shared)
}

