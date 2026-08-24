import SwiftUI
import Supabase

struct UploadSheetView: View {
    @EnvironmentObject var authManager: AuthManager
    let image: UIImage
    let onComplete: () -> Void

    @State private var title = ""
    @State private var story = ""
    @State private var selectedChild: Child?
    @State private var createdDate = Date()
    @State private var isUploading = false
    @State private var errorMessage: String?
    @State private var showSuccess = false
    @State private var showTemplates = false

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Color.paperBackground
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        // Preview
                        Image(uiImage: image)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(maxHeight: 250)
                            .cornerRadius(16)
                            .shadow(color: .black.opacity(0.1), radius: 10, y: 5)

                        // Form
                        VStack(spacing: 16) {
                            // Title
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Title")
                                    .font(.subheadline.bold())
                                    .foregroundColor(.secondary)

                                TextField("Artwork title", text: $title)
                                    .padding()
                                    .background(Color.cardSurface)
                                    .cornerRadius(12)
                            }

                            // Artist (Child)
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Artist")
                                    .font(.subheadline.bold())
                                    .foregroundColor(.secondary)

                                Menu {
                                    ForEach(authManager.children) { child in
                                        Button(child.name) {
                                            selectedChild = child
                                        }
                                    }
                                } label: {
                                    HStack {
                                        if let child = selectedChild {
                                            Circle()
                                                .fill(
                                                    LinearGradient(
                                                        colors: [.pink, .purple],
                                                        startPoint: .topLeading,
                                                        endPoint: .bottomTrailing
                                                    )
                                                )
                                                .frame(width: 28, height: 28)
                                                .overlay {
                                                    Text(child.initial)
                                                        .font(.caption.bold())
                                                        .foregroundColor(.white)
                                                }

                                            Text(child.name)
                                                .foregroundColor(.primary)
                                        } else {
                                            Text("Select artist")
                                                .foregroundColor(.secondary)
                                        }

                                        Spacer()

                                        Image(systemName: "chevron.down")
                                            .foregroundColor(.secondary)
                                    }
                                    .padding()
                                    .background(Color.cardSurface)
                                    .cornerRadius(12)
                                }
                            }

                            // Date Created
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Date Created")
                                    .font(.subheadline.bold())
                                    .foregroundColor(.secondary)

                                DatePicker(
                                    "",
                                    selection: $createdDate,
                                    displayedComponents: .date
                                )
                                .datePickerStyle(.compact)
                                .labelsHidden()
                                .padding()
                                .background(Color.cardSurface)
                                .cornerRadius(12)
                            }

                            StoryField(
                                story: $story,
                                childName: selectedChild?.name,
                                onBrowseTemplates: { showTemplates = true }
                            )
                        }
                        .padding(.horizontal)

                        if let error = errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.red)
                        }

                        // Upload button
                        Button(action: uploadArtwork) {
                            HStack {
                                if isUploading {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Image(systemName: "arrow.up.circle.fill")
                                    Text("Save to Gallery")
                                }
                            }
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(
                                LinearGradient(
                                    colors: canUpload ? [.pink, .purple] : [.gray],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .foregroundColor(.white)
                            .cornerRadius(16)
                            .shadow(color: canUpload ? .pink.opacity(0.4) : .clear, radius: 10, y: 5)
                        }
                        .disabled(!canUpload || isUploading)
                        .padding(.horizontal)
                    }
                    .padding(.vertical)
                }
            }
            .navigationTitle("New Artwork")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .overlay {
                if showSuccess {
                    SuccessOverlay {
                        onComplete()
                    }
                }
            }
            .sheet(isPresented: $showTemplates) {
                StoryTemplatePicker { opener in
                    story = story.isEmpty ? opener : story + " " + opener
                    showTemplates = false
                }
            }
        }
    }

    private var canUpload: Bool {
        !title.isEmpty && selectedChild != nil && story.trimmed.count >= StoryRules.minimumLength
    }

    private func uploadArtwork() {
        guard let child = selectedChild,
              let familyId = authManager.currentFamily?.id else { return }

        Task {
            isUploading = true
            errorMessage = nil

            do {
                // The bucket caps uploads at 10MB; shrink first so a big scan
                // fails on quality rather than being rejected outright.
                guard let imageData = compressedJPEG(maxBytes: UploadLimits.maxImageBytes) else {
                    throw UploadError.invalidImage
                }
                let thumbnailData = thumbnailJPEG(maxDimension: 500) ?? imageData

                // Images live in Supabase Storage under family/artwork paths;
                // the bucket is public so the stored URLs render directly.
                let artworkId = UUID()
                let basePath = "\(familyId.uuidString.lowercased())/\(artworkId.uuidString.lowercased())"
                let storage = authManager.client.storage.from(Config.artworkBucket)

                try await storage.upload(
                    "\(basePath).jpg",
                    data: imageData,
                    options: FileOptions(contentType: "image/jpeg")
                )
                try await storage.upload(
                    "\(basePath)_thumb.jpg",
                    data: thumbnailData,
                    options: FileOptions(contentType: "image/jpeg")
                )

                let imageURL = try storage.getPublicURL(path: "\(basePath).jpg").absoluteString
                let thumbURL = try storage.getPublicURL(path: "\(basePath)_thumb.jpg").absoluteString

                // Local timezone: the stored day must be the day the user picked.
                let dateFormatter = DateFormatter()
                dateFormatter.locale = Locale(identifier: "en_US_POSIX")
                dateFormatter.timeZone = .current
                dateFormatter.dateFormat = "yyyy-MM-dd"

                let payload = NewArtworkPayload(
                    id: artworkId.uuidString,
                    familyId: familyId.uuidString,
                    childId: child.id.uuidString,
                    imageUrl: imageURL,
                    thumbnailUrl: thumbURL,
                    title: title,
                    story: story.trimmed,
                    createdDate: dateFormatter.string(from: createdDate),
                    uploadedBy: authManager.currentUser?.id.uuidString
                )

                try await authManager.client
                    .from("artworks")
                    .insert(payload)
                    .execute()

                showSuccess = true

            } catch {
                errorMessage = error.localizedDescription
            }

            isUploading = false
        }
    }

    /// Encodes at descending quality, then descending size, until the data
    /// fits the bucket's limit. Returns nil only if even a small image can't
    /// be encoded.
    private func compressedJPEG(maxBytes: Int) -> Data? {
        for quality in [0.8, 0.6, 0.45] {
            if let data = image.jpegData(compressionQuality: quality), data.count <= maxBytes {
                return data
            }
        }
        var candidate = image
        for _ in 0..<4 {
            let scaled = CGSize(width: candidate.size.width * 0.7, height: candidate.size.height * 0.7)
            let renderer = UIGraphicsImageRenderer(size: scaled)
            candidate = renderer.image { _ in
                candidate.draw(in: CGRect(origin: .zero, size: scaled))
            }
            if let data = candidate.jpegData(compressionQuality: 0.7), data.count <= maxBytes {
                return data
            }
        }
        return candidate.jpegData(compressionQuality: 0.5)
    }

    private func thumbnailJPEG(maxDimension: CGFloat) -> Data? {
        let scale = min(1, maxDimension / max(image.size.width, image.size.height))
        guard scale < 1 else { return image.jpegData(compressionQuality: 0.7) }
        let newSize = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let renderer = UIGraphicsImageRenderer(size: newSize)
        let resized = renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: newSize))
        }
        return resized.jpegData(compressionQuality: 0.7)
    }
}

struct NewArtworkPayload: Encodable {
    let id: String
    let familyId: String
    let childId: String
    let imageUrl: String
    let thumbnailUrl: String
    let title: String
    let story: String
    let createdDate: String
    let uploadedBy: String?

    enum CodingKeys: String, CodingKey {
        case id
        case familyId = "family_id"
        case childId = "child_id"
        case imageUrl = "image_url"
        case thumbnailUrl = "thumbnail_url"
        case title
        case story
        case createdDate = "created_date"
        case uploadedBy = "uploaded_by"
    }
}

enum StoryRules {
    /// Matches the web app's requirement; short enough not to feel like a form,
    /// long enough to be an actual sentence.
    static let minimumLength = 20
}

extension String {
    var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }
}

enum UploadLimits {
    /// Matches the `artworks` bucket's file_size_limit.
    static let maxImageBytes = 10 * 1024 * 1024
}

enum UploadError: LocalizedError {
    case invalidImage
    case serverError

    var errorDescription: String? {
        switch self {
        case .invalidImage:
            return "Could not process image"
        case .serverError:
            return "Upload failed. Please try again."
        }
    }
}

struct SuccessOverlay: View {
    let onDismiss: () -> Void
    @State private var showContent = false

    var body: some View {
        ZStack {
            Color.black.opacity(0.4)
                .ignoresSafeArea()

            VStack(spacing: 24) {
                ZStack {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 100, height: 100)

                    Image(systemName: "checkmark")
                        .font(.system(size: 50, weight: .bold))
                        .foregroundColor(.white)
                }
                .scaleEffect(showContent ? 1 : 0.5)
                .opacity(showContent ? 1 : 0)

                Text("Artwork Saved!")
                    .font(.title2.bold())
                    .foregroundColor(.white)
                    .opacity(showContent ? 1 : 0)
            }
            .padding(40)
            .background(
                RoundedRectangle(cornerRadius: 24)
                    .fill(Color.white.opacity(0.1))
            )
        }
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                showContent = true
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                onDismiss()
            }
        }
    }
}

#Preview {
    UploadSheetView(image: UIImage(systemName: "photo")!) {}
        .environmentObject(AuthManager.shared)
}
