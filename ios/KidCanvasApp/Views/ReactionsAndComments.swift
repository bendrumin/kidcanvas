import SwiftUI

/// A row of the five allowed reactions, showing counts and what this user has
/// already left. Taps are optimistic — the count moves immediately.
struct ReactionBar: View {
    let artworkId: UUID
    let service: ArtworkService

    @State private var counts: [String: Int] = [:]
    @State private var mine: Set<String> = []

    var body: some View {
        HStack(spacing: 8) {
            ForEach(Reaction.allCases) { reaction in
                ReactionButton(
                    reaction: reaction,
                    count: counts[reaction.rawValue] ?? 0,
                    isMine: mine.contains(reaction.rawValue)
                ) {
                    toggle(reaction)
                }
            }
        }
        .task(id: artworkId) { await load() }
    }

    private func load() async {
        async let countsResult = try? service.reactionCounts(artworkId: artworkId)
        async let mineResult = try? service.myReactions(artworkId: artworkId)
        let (fetchedCounts, fetchedMine) = await (countsResult, mineResult)
        if let fetchedCounts {
            counts = Dictionary(uniqueKeysWithValues: fetchedCounts.map { ($0.emojiType, $0.count) })
        }
        if let fetchedMine { mine = fetchedMine }
    }

    private func toggle(_ reaction: Reaction) {
        let key = reaction.rawValue
        let wasMine = mine.contains(key)

        // Optimistic: reflect the tap now, reconcile after the round trip.
        if wasMine {
            mine.remove(key)
            counts[key] = max(0, (counts[key] ?? 1) - 1)
        } else {
            mine.insert(key)
            counts[key] = (counts[key] ?? 0) + 1
        }

        Task {
            do {
                if wasMine {
                    try await service.removeReaction(reaction, artworkId: artworkId)
                } else {
                    try await service.addReaction(reaction, artworkId: artworkId)
                }
            } catch {
                await load()
            }
        }
    }
}

struct ReactionButton: View {
    let reaction: Reaction
    let count: Int
    let isMine: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Text(reaction.rawValue)
                    .font(.callout)
                if count > 0 {
                    Text("\(count)")
                        .font(.caption.weight(.semibold))
                        .foregroundColor(isMine ? .white : .secondary)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(
                isMine
                    ? AnyShapeStyle(LinearGradient(colors: [.pink, .purple],
                                                   startPoint: .leading, endPoint: .trailing))
                    : AnyShapeStyle(Color.gray.opacity(0.12)),
                in: Capsule()
            )
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.impact(weight: .light), trigger: isMine)
        .accessibilityLabel("\(reaction.label)\(count > 0 ? ", \(count)" : "")")
        .accessibilityHint(isMine ? "Tap to remove your reaction" : "Tap to react")
    }
}

struct CommentsSection: View {
    let artworkId: UUID
    let service: ArtworkService

    @State private var comments: [ArtworkComment] = []
    @State private var draft = ""
    @State private var isSending = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(comments.isEmpty ? "Comments" : "Comments (\(comments.count))",
                  systemImage: "bubble.left.and.bubble.right")
                .font(.subheadline.bold())
                .foregroundColor(.secondary)

            ForEach(comments) { comment in
                CommentRow(text: comment.text, date: comment.createdAt)
            }

            HStack(spacing: 8) {
                TextField("Add a comment", text: $draft, axis: .vertical)
                    .lineLimit(1...3)
                    .padding(10)
                    .background(Color.gray.opacity(0.1), in: RoundedRectangle(cornerRadius: 10))
                Button {
                    send()
                } label: {
                    Image(systemName: isSending ? "hourglass" : "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundStyle(canSend ? Color.pink : Color.secondary)
                }
                .disabled(!canSend)
                .accessibilityLabel("Post comment")
            }
        }
        .task(id: artworkId) { await load() }
    }

    private var canSend: Bool {
        !draft.trimmed.isEmpty && !isSending
    }

    private func load() async {
        comments = (try? await service.comments(artworkId: artworkId)) ?? []
    }

    private func send() {
        let text = draft.trimmed
        guard !text.isEmpty else { return }
        isSending = true
        Task {
            try? await service.addComment(text, artworkId: artworkId)
            draft = ""
            await load()
            isSending = false
        }
    }
}

struct CommentRow: View {
    let text: String
    let date: Date

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(text)
                .font(.subheadline)
                .fixedSize(horizontal: false, vertical: true)
            Text(date, format: .relative(presentation: .named))
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color.gray.opacity(0.07), in: RoundedRectangle(cornerRadius: 12))
    }
}
