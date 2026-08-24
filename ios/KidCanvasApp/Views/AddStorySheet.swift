import SwiftUI

/// Adds a story to artwork saved before the story field existed — the app has
/// months of images with no context attached.
struct AddStorySheet: View {
    let artwork: Artwork
    let service: ArtworkService

    @Environment(\.dismiss) private var dismiss
    @State private var story = ""
    @State private var showTemplates = false
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            ZStack {
                Color.paperBackground.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        AsyncImage(url: URL(string: artwork.thumbnailUrl ?? artwork.imageUrl)) { image in
                            image.resizable().aspectRatio(contentMode: .fit)
                        } placeholder: {
                            Rectangle().fill(Color.placeholderFill).frame(height: 160)
                        }
                        .frame(maxHeight: 200)
                        .cornerRadius(14)

                        StoryField(
                            story: $story,
                            childName: artwork.child?.name,
                            onBrowseTemplates: { showTemplates = true }
                        )

                        if let errorMessage {
                            Text(errorMessage)
                                .font(.caption)
                                .foregroundColor(.red)
                        }

                        Button(action: save) {
                            HStack {
                                if isSaving {
                                    ProgressView().tint(.white)
                                } else {
                                    Image(systemName: "checkmark.circle.fill")
                                    Text("Save story")
                                }
                            }
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .background(
                                canSave
                                    ? AnyShapeStyle(LinearGradient(colors: [.pink, .purple],
                                                                   startPoint: .leading, endPoint: .trailing))
                                    : AnyShapeStyle(Color.gray)
                            )
                            .foregroundColor(.white)
                            .cornerRadius(16)
                        }
                        .disabled(!canSave || isSaving)
                    }
                    .padding()
                }
            }
            .navigationTitle("Add the story")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
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

    private var canSave: Bool {
        story.trimmed.count >= StoryRules.minimumLength
    }

    private func save() {
        isSaving = true
        errorMessage = nil
        Task {
            do {
                try await service.updateStory(story.trimmed, artworkId: artwork.id)
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            isSaving = false
        }
    }
}
