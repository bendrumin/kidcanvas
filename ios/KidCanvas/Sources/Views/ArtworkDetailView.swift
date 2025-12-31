import SwiftUI

struct ArtworkDetailView: View {
    @EnvironmentObject var authManager: AuthManager
    let artwork: Artwork
    
    @State private var isFavorite: Bool
    @State private var showShareSheet = false
    @State private var showDeleteAlert = false
    @Environment(\.dismiss) private var dismiss
    
    init(artwork: Artwork) {
        self.artwork = artwork
        _isFavorite = State(initialValue: artwork.isFavorite)
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Image
                AsyncImage(url: URL(string: artwork.imageUrl)) { phase in
                    switch phase {
                    case .loading:
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .aspectRatio(1, contentMode: .fit)
                            .overlay {
                                ProgressView()
                                    .tint(.pink)
                            }
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    case .failure:
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
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
                    
                    // AI Tags
                    if let aiTags = artwork.aiTags, !aiTags.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Image(systemName: "sparkles")
                                Text("AI Detected")
                            }
                            .font(.subheadline.bold())
                            .foregroundColor(.secondary)
                            
                            FlowLayout(spacing: 8) {
                                ForEach(aiTags, id: \.self) { tag in
                                    Text(tag)
                                        .font(.caption)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(Color.purple.opacity(0.1))
                                        .foregroundColor(.purple)
                                        .cornerRadius(20)
                                }
                            }
                        }
                    }
                }
                .padding(24)
                .background(Color.white)
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
    }
    
    private func ageText(months: Int) -> String {
        if months >= 12 {
            let years = months / 12
            let remainingMonths = months % 12
            if remainingMonths > 0 {
                return "\(years)y \(remainingMonths)m"
            }
            return "\(years) year\(years == 1 ? "" : "s")"
        }
        return "\(months) month\(months == 1 ? "" : "s")"
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
    
    private func deleteArtwork() {
        Task {
            do {
                try await authManager.client
                    .from("artworks")
                    .delete()
                    .eq("id", value: artwork.id.uuidString)
                    .execute()
                
                dismiss()
            } catch {
                print("Error deleting artwork: \(error)")
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
            description: "A beautiful butterfly painting from art class",
            tags: ["butterfly", "colorful", "nature"],
            aiTags: ["painting", "insect", "wings"],
            aiDescription: nil,
            createdDate: Date(),
            childAgeMonths: 48,
            isFavorite: true,
            uploadedAt: Date(),
            uploadedBy: UUID()
        ))
    }
    .environmentObject(AuthManager.shared)
}

