import SwiftUI

/// Adds a story to artwork saved before the story field existed — the app has
/// months of images with no context attached. The story can be written, told
/// out loud, or both.
struct AddStorySheet: View {
    let artwork: Artwork
    let service: ArtworkService
    /// Reports what was saved so the detail screen can show it without a reload.
    var onSaved: (_ story: String?, _ voice: (path: String, durationSeconds: Int)?) -> Void = { _, _ in }

    @Environment(\.dismiss) private var dismiss
    @State private var story = ""
    @State private var showTemplates = false
    @State private var isSaving = false
    @State private var errorMessage: String?
    @StateObject private var recorder = VoiceRecorder()

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

                        VoiceRecorderControl(recorder: recorder, childName: artwork.child?.name)

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
                                    Text("Save Story")
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
            .navigationTitle("Add the Story")
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
            .onDisappear { recorder.cleanUpUnsaved() }
        }
    }

    private var canSave: Bool {
        !story.trimmed.isEmpty || recorder.recording != nil
    }

    private func save() {
        isSaving = true
        errorMessage = nil
        Task {
            do {
                let text = story.trimmed
                if !text.isEmpty {
                    try await service.updateStory(text, artworkId: artwork.id)
                    WidgetSnapshotWriter.updateStory(text, artworkId: artwork.id)
                }
                // The artwork already exists here, so the recording is the
                // save, not an extra riding along; wait for it and report
                // failure instead of dropping it quietly.
                var voice: (path: String, durationSeconds: Int)?
                if let take = recorder.recording {
                    try await service.attachVoiceNote(take, familyId: artwork.familyId, artworkId: artwork.id)
                    _ = recorder.takeRecording()
                    voice = (VoiceNote.key(familyId: artwork.familyId, artworkId: artwork.id), take.durationSeconds)
                }
                onSaved(text.isEmpty ? nil : text, voice)
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            isSaving = false
        }
    }
}
