import SwiftUI
import UIKit

private func clock(_ seconds: TimeInterval) -> String {
    let total = max(0, Int(seconds.rounded(.down)))
    return String(format: "%d:%02d", total / 60, total % 60)
}

/// "Record them telling it": the recorder as it sits under the story field.
/// Owns no state itself; the sheet holds the VoiceRecorder so the take
/// survives until save.
struct VoiceRecorderControl: View {
    @ObservedObject var recorder: VoiceRecorder
    let childName: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("In their own voice")
                    .font(.subheadline.bold())
                    .foregroundColor(.secondary)
                Text("optional")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            content
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.cardSurface)
                .cornerRadius(12)
        }
    }

    @ViewBuilder
    private var content: some View {
        switch recorder.state {
        case .idle:
            Button(action: recorder.start) {
                HStack(spacing: 12) {
                    Image(systemName: "mic.circle.fill")
                        .font(.system(size: 34))
                        .foregroundStyle(.pink)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Record them telling it")
                            .font(.subheadline.weight(.semibold))
                            .foregroundColor(.primary)
                        Text("Up to a minute, in \(childName.map { "\($0)'s" } ?? "their") own words.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                }
            }
            .buttonStyle(.plain)

        case .recording:
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 12) {
                    Circle()
                        .fill(Color.red)
                        .frame(width: 10, height: 10)
                    Text("Recording")
                        .font(.subheadline.weight(.semibold))
                    Spacer()
                    Text("\(clock(recorder.elapsed)) / \(clock(VoiceNote.maxSeconds))")
                        .font(.subheadline.monospacedDigit())
                        .foregroundColor(.secondary)
                        .accessibilityLabel("\(Int(recorder.elapsed)) of 60 seconds")
                    Button(action: recorder.stop) {
                        Image(systemName: "stop.circle.fill")
                            .font(.system(size: 34))
                            .foregroundStyle(.red)
                    }
                    .accessibilityLabel("Stop recording")
                }
                ProgressView(value: min(recorder.elapsed, VoiceNote.maxSeconds), total: VoiceNote.maxSeconds)
                    .tint(.pink)
            }

        case .recorded(let take):
            HStack(spacing: 12) {
                Button(action: recorder.togglePreview) {
                    Image(systemName: recorder.isPreviewing ? "pause.circle.fill" : "play.circle.fill")
                        .font(.system(size: 34))
                        .foregroundStyle(.pink)
                }
                .accessibilityLabel(recorder.isPreviewing ? "Pause recording" : "Play recording")

                VStack(alignment: .leading, spacing: 2) {
                    Text("Recorded")
                        .font(.subheadline.weight(.semibold))
                    Text(clock(TimeInterval(take.durationSeconds)))
                        .font(.caption.monospacedDigit())
                        .foregroundColor(.secondary)
                }
                Spacer()
                Button("Re-record", action: recorder.reRecord)
                    .font(.caption.weight(.semibold))
                Button(role: .destructive, action: recorder.discard) {
                    Image(systemName: "trash")
                }
                .accessibilityLabel("Delete recording")
            }

        case .denied:
            VStack(alignment: .leading, spacing: 8) {
                Text("Microphone access is off, so KidCanvas can't record. You can still write the story above.")
                    .font(.footnote)
                    .foregroundColor(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                Button("Turn on in Settings") {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }
                .font(.subheadline.bold())
                .foregroundColor(.pink)
            }

        case .failed(let message):
            HStack {
                Text(message)
                    .font(.footnote)
                    .foregroundColor(.secondary)
                Spacer()
                Button("Try again", action: recorder.reRecord)
                    .font(.subheadline.bold())
                    .foregroundColor(.pink)
            }
        }
    }
}

/// Plays a saved recording. Compact is the feed's single pill; the full size
/// sits on the detail screen next to the written story.
struct VoiceNotePlaybackView: View {
    @EnvironmentObject var authManager: AuthManager
    let path: String
    let durationSeconds: Int?
    let childName: String?
    var compact = false

    @StateObject private var player = VoiceNotePlayer()

    var body: some View {
        Group {
            if compact { compactBody } else { fullBody }
        }
        .onDisappear { player.stop() }
    }

    private var total: TimeInterval { TimeInterval(durationSeconds ?? 0) }

    private var timeText: String {
        player.state == .playing || player.elapsed > 0
            ? "\(clock(player.elapsed)) / \(clock(total))"
            : clock(total)
    }

    private var who: String {
        childName.map { "\($0) telling it" } ?? "Them telling it"
    }

    private var icon: String {
        player.state == .playing ? "pause.fill" : "play.fill"
    }

    private func toggle() {
        player.toggle(path: path, client: authManager.client)
    }

    private var compactBody: some View {
        Button(action: toggle) {
            HStack(spacing: 6) {
                if player.state == .loading {
                    ProgressView().controlSize(.mini).tint(.pink)
                } else {
                    Image(systemName: icon)
                        .font(.caption.bold())
                }
                Text(player.state == .failed ? "Couldn't play" : "Listen")
                    .font(.caption.weight(.semibold))
                Text(timeText)
                    .font(.caption.monospacedDigit())
                    .foregroundColor(.pink.opacity(0.8))
            }
            .foregroundColor(.pink)
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(Color.pink.opacity(0.1), in: Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(player.state == .playing ? "Pause \(who.lowercased())" : "Play \(who.lowercased())")
    }

    private var fullBody: some View {
        HStack(spacing: 14) {
            Button(action: toggle) {
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [.pink, .purple],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 48, height: 48)
                    if player.state == .loading {
                        ProgressView().tint(.white)
                    } else {
                        Image(systemName: icon)
                            .font(.title3.bold())
                            .foregroundColor(.white)
                    }
                }
            }
            .buttonStyle(.plain)
            .accessibilityLabel(player.state == .playing ? "Pause \(who.lowercased())" : "Play \(who.lowercased())")

            VStack(alignment: .leading, spacing: 4) {
                Label("In their own voice", systemImage: "waveform")
                    .font(.subheadline.bold())
                    .foregroundColor(.secondary)
                if player.state == .failed {
                    Text("Couldn't play the recording. Tap to try again.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                } else {
                    ProgressView(value: min(player.elapsed, max(total, 1)), total: max(total, 1))
                        .tint(.pink)
                    Text("\(who), \(timeText)")
                        .font(.caption.monospacedDigit())
                        .foregroundColor(.secondary)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.pink.opacity(0.06), in: RoundedRectangle(cornerRadius: 16))
    }
}

/// Records a note for artwork that is already saved, from the detail screen.
/// Unlike the upload sheet this waits for the upload, because the recording
/// is the whole of what is being saved here.
struct RecordVoiceSheet: View {
    let artwork: Artwork
    let service: ArtworkService
    let onSaved: (_ path: String, _ durationSeconds: Int) -> Void

    @Environment(\.dismiss) private var dismiss
    @StateObject private var recorder = VoiceRecorder()
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
                                    Text("Save recording")
                                }
                            }
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .background(
                                recorder.recording != nil
                                    ? AnyShapeStyle(LinearGradient(colors: [.pink, .purple],
                                                                   startPoint: .leading, endPoint: .trailing))
                                    : AnyShapeStyle(Color.gray)
                            )
                            .foregroundColor(.white)
                            .cornerRadius(16)
                        }
                        .disabled(recorder.recording == nil || isSaving)
                    }
                    .padding()
                }
            }
            .navigationTitle("Record the story")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .onDisappear { recorder.cleanUpUnsaved() }
        }
    }

    private func save() {
        guard let take = recorder.recording else { return }
        isSaving = true
        errorMessage = nil
        Task {
            do {
                try await service.attachVoiceNote(take, familyId: artwork.familyId, artworkId: artwork.id)
                _ = recorder.takeRecording()
                onSaved(VoiceNote.key(familyId: artwork.familyId, artworkId: artwork.id), take.durationSeconds)
                dismiss()
            } catch {
                errorMessage = "Couldn't save the recording. Check your connection and try again."
            }
            isSaving = false
        }
    }
}

/// Offers a recording on artwork that has none yet, in the style of
/// AddStoryPrompt so the two read as one family of prompts.
struct RecordVoicePrompt: View {
    let onRecord: () -> Void

    var body: some View {
        Button(action: onRecord) {
            HStack {
                Image(systemName: "mic.badge.plus")
                    .foregroundColor(.pink)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Record them telling it")
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(.primary)
                    Text("Up to a minute, in their own voice")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(16)
            .background(Color.faintFill, in: RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
    }
}
