# iOS App Storytelling Features Implementation Guide

This guide provides a comprehensive plan for implementing the storytelling-focused features in the iOS app to achieve feature parity with the web application.

## ✅ Completed

### Data Models
- ✅ Updated `Artwork` model with `story` and `momentPhotoUrl` fields
- ✅ Added `ArtworkReaction` model for reactions
- ✅ Added `ArtworkComment` model for comments
- ✅ Added `ReactionCount` helper struct

**Location**: `/ios/KidCanvas/KidCanvas/KidCanvas/Models/Models.swift`

---

## 🔨 To Implement

### 1. Reactions Component (`ArtworkReactionsView.swift`)

**Purpose**: Display and interact with artwork reactions (Love, Amazing, Artistic, Proud, Star)

**Implementation Details**:

```swift
import SwiftUI

struct ArtworkReactionsView: View {
    let artworkId: UUID
    let userId: UUID
    @State private var reactions: [ReactionCount] = []
    @State private var userReaction: String?

    let reactionTypes: [(emoji: String, type: String, color: Color)] = [
        ("❤️", "heart", .pink),
        ("✨", "sparkles", .purple),
        ("🎨", "palette", .blue),
        ("🫶", "hand_heart", .orange),
        ("⭐", "star", .yellow)
    ]

    var body: some View {
        HStack(spacing: 8) {
            ForEach(reactionTypes, id: \.type) { reaction in
                ReactionButton(
                    emoji: reaction.emoji,
                    type: reaction.type,
                    color: reaction.color,
                    count: getCount(for: reaction.type),
                    isSelected: userReaction == reaction.type,
                    onTap: { toggleReaction(reaction.type) }
                )
            }
        }
        .onAppear { loadReactions() }
    }

    private func getCount(for type: String) -> Int {
        reactions.first(where: { $0.emojiType == type })?.count ?? 0
    }

    private func toggleReaction(_ type: String) {
        // Toggle reaction logic here
        if userReaction == type {
            // Remove reaction via Supabase
            removeReaction(type)
        } else {
            // Add/update reaction via Supabase
            addReaction(type)
        }
    }

    private func loadReactions() {
        // Load reactions from Supabase
        // Use RPC function: get_artwork_reaction_counts(artwork_uuid)
    }

    private func addReaction(_ type: String) {
        // Insert into artwork_reactions table
    }

    private func removeReaction(_ type: String) {
        // Delete from artwork_reactions table
    }
}

struct ReactionButton: View {
    let emoji: String
    let type: String
    let color: Color
    let count: Int
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 4) {
                Text(emoji)
                    .font(.system(size: 20))
                if count > 0 {
                    Text("\(count)")
                        .font(.caption)
                        .fontWeight(.semibold)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(isSelected ? color.opacity(0.2) : Color.gray.opacity(0.1))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .strokeBorder(isSelected ? color : Color.clear, lineWidth: 2)
            )
            .scaleEffect(isSelected ? 1.1 : 1.0)
            .animation(.spring(response: 0.3), value: isSelected)
        }
    }
}
```

**Supabase Integration**:
- Load reactions: `supabase.rpc('get_artwork_reaction_counts', parameters: ['artwork_uuid': artworkId])`
- Add reaction: `supabase.from('artwork_reactions').insert(['artwork_id': artworkId, 'user_id': userId, 'emoji_type': type])`
- Remove reaction: `supabase.from('artwork_reactions').delete().eq('artwork_id', artworkId).eq('user_id', userId).eq('emoji_type', type)`

---

### 2. Comments Component (`ArtworkCommentsView.swift`)

**Purpose**: Display and post comments on artwork

**Implementation Details**:

```swift
import SwiftUI

struct ArtworkCommentsView: View {
    let artworkId: UUID
    let userId: UUID
    let userNickname: String

    @State private var comments: [ArtworkComment] = []
    @State private var newCommentText: String = ""
    @State private var isLoading = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Comments")
                .font(.headline)
                .padding(.horizontal)

            // Comments list
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 12) {
                    ForEach(comments) { comment in
                        CommentRow(
                            comment: comment,
                            isOwnComment: comment.userId == userId,
                            onDelete: { deleteComment(comment.id) }
                        )
                    }
                }
                .padding(.horizontal)
            }

            // Input field
            HStack(spacing: 12) {
                TextField("Add a comment...", text: $newCommentText, axis: .vertical)
                    .lineLimit(1...5)
                    .textFieldStyle(.roundedBorder)

                Button(action: postComment) {
                    Image(systemName: "paperplane.fill")
                        .foregroundColor(.white)
                        .frame(width: 40, height: 40)
                        .background(
                            newCommentText.count >= 1 && newCommentText.count <= 500
                                ? LinearGradient(colors: [.pink, .purple], startPoint: .leading, endPoint: .trailing)
                                : LinearGradient(colors: [.gray, .gray], startPoint: .leading, endPoint: .trailing)
                        )
                        .clipShape(Circle())
                }
                .disabled(newCommentText.count < 1 || newCommentText.count > 500)
            }
            .padding()
            .background(Color(.systemBackground))
        }
        .onAppear { loadComments() }
    }

    private func loadComments() {
        // Load comments from Supabase
        // SELECT * FROM artwork_comments WHERE artwork_id = artworkId ORDER BY created_at ASC
    }

    private func postComment() {
        guard !newCommentText.isEmpty else { return }
        // Insert comment via Supabase
        // INSERT INTO artwork_comments (artwork_id, user_id, text) VALUES (...)
        newCommentText = ""
    }

    private func deleteComment(_ commentId: UUID) {
        // Delete comment via Supabase
        // DELETE FROM artwork_comments WHERE id = commentId
    }
}

struct CommentRow: View {
    let comment: ArtworkComment
    let isOwnComment: Bool
    let onDelete: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Avatar
            Circle()
                .fill(LinearGradient(colors: isOwnComment ? [.pink, .purple] : [.gray, .blue], startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(width: 36, height: 36)
                .overlay(
                    Text(comment.userNickname?.prefix(1).uppercased() ?? "?")
                        .foregroundColor(.white)
                        .fontWeight(.semibold)
                )

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(comment.userNickname ?? "Unknown")
                        .font(.caption)
                        .fontWeight(.semibold)

                    Text(comment.createdAt?.timeAgoDisplay() ?? "")
                        .font(.caption2)
                        .foregroundColor(.secondary)

                    Spacer()

                    if isOwnComment {
                        Button(action: onDelete) {
                            Image(systemName: "trash")
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                    }
                }

                Text(comment.text)
                    .font(.body)
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(isOwnComment ? LinearGradient(colors: [.pink.opacity(0.1), .purple.opacity(0.1)], startPoint: .topLeading, endPoint: .bottomTrailing) : Color.gray.opacity(0.1))
            )
        }
    }
}
```

**Supabase Integration**:
- Load comments: `supabase.from('artwork_comments').select().eq('artwork_id', artworkId).order('created_at')`
- Post comment: `supabase.from('artwork_comments').insert(['artwork_id': artworkId, 'user_id': userId, 'text': text])`
- Delete comment: `supabase.from('artwork_comments').delete().eq('id', commentId)`

---

### 3. Feed View (`FeedView.swift`)

**Purpose**: Instagram-style feed showing artwork with stories

**Implementation Details**:

```swift
import SwiftUI

struct FeedView: View {
    @State private var artworks: [Artwork] = []
    @State private var isLoading = true

    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 20) {
                    ForEach(artworks) { artwork in
                        if artwork.story != nil && !artwork.story!.isEmpty {
                            FeedCard(artwork: artwork)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Feed")
            .refreshable {
                await loadFeed()
            }
        }
        .onAppear { Task { await loadFeed() } }
    }

    private func loadFeed() async {
        // Load artworks with stories from Supabase
        // SELECT * FROM artworks WHERE story IS NOT NULL AND story != '' ORDER BY created_date DESC
    }
}

struct FeedCard: View {
    let artwork: Artwork
    @State private var reactionCounts: [ReactionCount] = []
    @State private var commentCount: Int = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack(spacing: 12) {
                // Child avatar
                Circle()
                    .fill(Color(hex: artwork.child?.color ?? "#E91E63") ?? .pink)
                    .frame(width: 40, height: 40)
                    .overlay(
                        Text(artwork.child?.initial ?? "?")
                            .foregroundColor(.white)
                            .fontWeight(.bold)
                    )

                VStack(alignment: .leading, spacing: 2) {
                    Text(artwork.child?.name ?? "Unknown")
                        .font(.headline)
                    Text(artwork.createdDate?.formatted(date: .abbreviated, time: .omitted) ?? "")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()
            }

            // Story (prominent)
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "book.fill")
                        .foregroundColor(.purple)
                    Text("Story")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }

                Text(artwork.story ?? "")
                    .font(.body)
            }
            .padding()
            .background(
                LinearGradient(colors: [.pink.opacity(0.1), .purple.opacity(0.1), .blue.opacity(0.1)], startPoint: .topLeading, endPoint: .bottomTrailing)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))

            // Moment photo (if exists)
            if let momentPhotoUrl = artwork.momentPhotoUrl {
                AsyncImage(url: URL(string: momentPhotoUrl)) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                }
                .frame(height: 300)
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .overlay(
                    HStack {
                        Image(systemName: "camera.fill")
                        Text("Moment Photo")
                    }
                    .font(.caption)
                    .padding(8)
                    .background(.ultraThinMaterial)
                    .clipShape(Capsule())
                    .padding(12),
                    alignment: .topLeading
                )
            }

            // Artwork image
            AsyncImage(url: URL(string: artwork.imageUrl)) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fit)
            } placeholder: {
                Rectangle()
                    .fill(Color.gray.opacity(0.2))
            }
            .clipShape(RoundedRectangle(cornerRadius: 16))

            // Title
            Text(artwork.title)
                .font(.headline)

            // Reactions
            ArtworkReactionsView(artworkId: artwork.id, userId: getCurrentUserId())

            // Comment count
            if commentCount > 0 {
                NavigationLink(destination: ArtworkDetailView(artwork: artwork)) {
                    HStack {
                        Image(systemName: "bubble.left.fill")
                        Text("\(commentCount) comments")
                    }
                    .font(.caption)
                    .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.1), radius: 8, y: 4)
        .onAppear { loadMetadata() }
    }

    private func loadMetadata() {
        // Load reaction counts and comment count
    }
}
```

**Supabase Integration**:
- Load feed: `supabase.from('artworks').select('*, children(*)').neq('story', '').order('created_date', ascending: false)`

---

### 4. Updated Upload Flow (`UploadView.swift`)

**Key Changes**:
- Make story field **required** (minimum 20 characters)
- Add moment photo upload option
- Show story prompts/templates
- Title becomes optional (auto-generated from story if empty)

**Implementation**:

```swift
struct UploadView: View {
    @State private var selectedImage: UIImage?
    @State private var selectedMomentPhoto: UIImage?
    @State private var selectedChild: Child?
    @State private var title: String = ""
    @State private var story: String = ""
    @State private var createdDate: Date = Date()
    @State private var showingImagePicker = false
    @State private var showingMomentPhotoPicker = false

    var body: some View {
        Form {
            // Image preview
            if let image = selectedImage {
                Section {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }

            // Child selector
            Section("Artist *") {
                Picker("Who made this?", selection: $selectedChild) {
                    ForEach(children) { child in
                        Text(child.name).tag(child as Child?)
                    }
                }
            }

            // Story (REQUIRED)
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Label("Story", systemImage: "book.fill")
                            .font(.headline)
                        Spacer()
                        Text("Required")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    TextEditor(text: $story)
                        .frame(minHeight: 120)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .strokeBorder(story.count < 20 ? Color.red.opacity(0.3) : Color.clear, lineWidth: 1)
                        )

                    HStack {
                        Text("\(story.count) characters")
                            .font(.caption)
                            .foregroundColor(story.count < 20 ? .red : .secondary)
                        if story.count < 20 {
                            Text("(minimum 20)")
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                    }
                }
            } header: {
                Text("Tell the story behind this artwork")
            } footer: {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Story prompts:")
                        .fontWeight(.medium)
                    Text("• What did your child say about this?")
                    Text("• When or where did they make it?")
                    Text("• How did they feel creating it?")
                    Text("• What makes this special?")
                }
                .font(.caption)
            }

            // Moment Photo (Optional)
            Section("Moment Photo (Optional)") {
                if let momentPhoto = selectedMomentPhoto {
                    Image(uiImage: momentPhoto)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(height: 200)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            Button(action: { selectedMomentPhoto = nil }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.white)
                                    .background(Color.black.opacity(0.6))
                                    .clipShape(Circle())
                            }
                            .padding(8),
                            alignment: .topTrailing
                        )
                } else {
                    Button(action: { showingMomentPhotoPicker = true }) {
                        HStack {
                            Image(systemName: "camera.fill")
                            Text("Add photo of child with artwork")
                        }
                    }
                }
            }

            // Title (Optional)
            Section("Title (Optional)") {
                TextField("Short title for searching", text: $title)
            }
            .font(.caption)

            // Date
            Section("Created Date") {
                DatePicker("When was this made?", selection: $createdDate, displayedComponents: .date)
            }

            // Upload button
            Section {
                Button(action: uploadArtwork) {
                    Text("Upload Artwork")
                        .frame(maxWidth: .infinity)
                        .fontWeight(.semibold)
                }
                .disabled(!canUpload)
            }
        }
        .navigationTitle("Upload Artwork")
    }

    private var canUpload: Bool {
        selectedImage != nil && selectedChild != nil && story.count >= 20
    }

    private func uploadArtwork() {
        // Upload logic
        // If title is empty, generate from first 50 chars of story
        let finalTitle = title.isEmpty ? String(story.prefix(50)) : title

        // Upload artwork image + moment photo (if exists) to R2
        // Insert into database with story
    }
}
```

---

### 5. Updated Artwork Detail View (`ArtworkDetailView.swift`)

**Key Changes**:
- Display story prominently at the top in a gradient card
- Show moment photo before artwork
- Integrate reactions and comments components
- Legacy artwork handling (prompt to add story)

**Layout Order**:
1. Header (child info, date)
2. **Story** (in gradient card with book icon)
3. **Moment Photo** (if exists, with camera icon)
4. **Artwork Image**
5. Title
6. Reactions
7. Comments

---

### 6. Additional Files to Update

#### Supabase Client Updates
Add helper functions for reactions and comments in your Supabase client:

```swift
extension SupabaseClient {
    func getReactionCounts(artworkId: UUID) async throws -> [ReactionCount] {
        // Call RPC function
        let response: PostgrestResponse = try await rpc(
            "get_artwork_reaction_counts",
            params: ["artwork_uuid": artworkId]
        )
        return try response.decoded()
    }

    func toggleReaction(artworkId: UUID, userId: UUID, emojiType: String) async throws {
        // Check if exists, delete if yes, insert if no
    }

    func getComments(artworkId: UUID) async throws -> [ArtworkComment] {
        try await from("artwork_comments")
            .select()
            .eq("artwork_id", artworkId)
            .order("created_at")
            .execute()
            .decoded()
    }
}
```

---

## 🎨 Design Guidelines

### Colors
- Primary gradient: Pink to Purple (`[.pink, .purple]`)
- Story cards: Pink-Purple-Blue gradient with low opacity
- Reaction colors:
  - Heart: Pink
  - Sparkles: Purple
  - Palette: Blue
  - Hand Heart: Orange
  - Star: Yellow

### Typography
- Story text: `.body` weight regular
- Prompts: `.caption` weight medium
- Headers: `.headline` weight semibold

### Spacing
- Card padding: 16pt
- Section spacing: 20pt
- Element spacing: 12pt

### Animations
- Reaction button scale: Spring animation (0.3s response)
- Card transitions: Smooth fade with slide

---

## 📋 Testing Checklist

- [ ] Can upload artwork with story (minimum 20 chars)
- [ ] Can upload moment photo with artwork
- [ ] Title auto-generates from story if empty
- [ ] Feed shows only artworks with stories
- [ ] Can add/remove reactions
- [ ] Can post comments (1-500 chars)
- [ ] Can delete own comments
- [ ] Story displays prominently in detail view
- [ ] Moment photo displays before artwork
- [ ] All data syncs with web app

---

## 🚀 Deployment Notes

1. Update minimum iOS version if needed for SwiftUI features
2. Test on iOS 16+ and iOS 17+
3. Verify Supabase RLS policies allow iOS app access
4. Test image upload to R2 from iOS
5. Verify real-time subscriptions work for comments

---

## 📚 Resources

- **Web Implementation Reference**: `/components/feed/`, `/components/artwork/`
- **Database Schema**: `/supabase/migrations/004_storytelling_features.sql`
- **Supabase RPC Functions**: `get_artwork_reaction_counts`, `user_has_reacted`
- **Design System**: Custom gradients, rounded corners (16-20pt), shadows

---

## 🤝 Need Help?

Refer to the web implementation for exact behavior and styling. The web app is the source of truth for:
- Reaction types and icons
- Comment character limits
- Story requirements
- Feed filtering logic
- Design patterns
