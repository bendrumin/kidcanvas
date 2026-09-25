import AVFoundation
import Foundation
import Supabase

/// The child telling the story in their own voice.
///
/// Recordings live in the private `voice-notes` bucket (migration 013). There is
/// no public address for them: playback downloads through the signed-in session,
/// so storage RLS decides who can hear a child, not whoever holds a link.
enum VoiceNote {
    static let bucket = "voice-notes"

    /// Long enough for a kid's explanation, short enough that it stays a
    /// moment rather than a podcast. The database CHECK agrees.
    static let maxSeconds: TimeInterval = 60

    /// The one key a recording may have. The upload policy and a CHECK on the
    /// row both require exactly this, so nothing needs to trust a stored path
    /// to find or delete the file. Postgres prints uuids lowercase.
    static func key(familyId: UUID, artworkId: UUID) -> String {
        "\(familyId.uuidString.lowercased())/\(artworkId.uuidString.lowercased()).m4a"
    }

    /// Mono AAC at 64 kbps: about 480 KB a minute, well under the bucket's
    /// 2 MB cap, and plenty for a voice.
    static let recorderSettings: [String: Any] = [
        AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
        AVSampleRateKey: 44_100,
        AVNumberOfChannelsKey: 1,
        AVEncoderBitRateKey: 64_000,
        AVEncoderAudioQualityKey: AVAudioQuality.medium.rawValue,
    ]
}

/// A finished take waiting to be saved.
struct VoiceRecording: Equatable {
    let fileURL: URL
    let durationSeconds: Int
}

// MARK: - Recording

/// Owns one AVAudioRecorder for a sheet. Records to a temp file; the caller
/// uploads that file once the artwork row exists and then deletes it.
@MainActor
final class VoiceRecorder: NSObject, ObservableObject {
    enum State: Equatable {
        case idle
        case recording
        case recorded(VoiceRecording)
        case denied
        case failed(String)
    }

    @Published private(set) var state: State = .idle
    @Published private(set) var elapsed: TimeInterval = 0
    @Published private(set) var isPreviewing = false

    private var recorder: AVAudioRecorder?
    private var previewPlayer: AVAudioPlayer?
    private var ticker: Timer?

    var recording: VoiceRecording? {
        if case .recorded(let take) = state { return take }
        return nil
    }

    var isRecording: Bool { state == .recording }

    func start() {
        switch AVAudioApplication.shared.recordPermission {
        case .granted:
            beginRecording()
        case .denied:
            state = .denied
        case .undetermined:
            AVAudioApplication.requestRecordPermission { granted in
                Task { @MainActor in
                    if granted { self.beginRecording() } else { self.state = .denied }
                }
            }
        @unknown default:
            state = .denied
        }
    }

    func stop() {
        guard let recorder, recorder.isRecording else { return }
        // Read the length before stop(): afterwards currentTime resets to 0.
        let seconds = recorder.currentTime
        recorder.stop()
        finish(seconds: seconds)
    }

    /// Throws the take away, including its file. Used by delete and re-record.
    func discard() {
        stopPreview()
        if let recorder, recorder.isRecording { recorder.stop() }
        stopTicker()
        if let take = recording { try? FileManager.default.removeItem(at: take.fileURL) }
        recorder = nil
        elapsed = 0
        state = .idle
        deactivateSession()
    }

    func reRecord() {
        discard()
        start()
    }

    /// Hands the take to the caller, who now owns the file. The recorder
    /// forgets it so leaving the sheet does not delete a file mid-upload.
    func takeRecording() -> VoiceRecording? {
        stop()
        stopPreview()
        guard let take = recording else { return nil }
        state = .idle
        return take
    }

    /// Called when a sheet goes away without saving: nothing should be left in
    /// the temp directory holding a child's voice.
    func cleanUpUnsaved() {
        discard()
    }

    // MARK: Preview

    func togglePreview() {
        if isPreviewing {
            stopPreview()
            return
        }
        guard let take = recording else { return }
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio)
            try AVAudioSession.sharedInstance().setActive(true)
            let player = try AVAudioPlayer(contentsOf: take.fileURL)
            player.delegate = self
            player.play()
            previewPlayer = player
            isPreviewing = true
        } catch {
            state = .failed("Couldn't play the recording.")
        }
    }

    private func stopPreview() {
        previewPlayer?.stop()
        previewPlayer = nil
        isPreviewing = false
    }

    // MARK: Private

    private func beginRecording() {
        do {
            let session = AVAudioSession.sharedInstance()
            // .defaultToSpeaker so a preview right after recording is audible
            // without holding the phone to an ear.
            try session.setCategory(.playAndRecord, mode: .spokenAudio, options: [.defaultToSpeaker])
            try session.setActive(true)

            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("voice-\(UUID().uuidString).m4a")
            let recorder = try AVAudioRecorder(url: url, settings: VoiceNote.recorderSettings)
            recorder.delegate = self
            guard recorder.record(forDuration: VoiceNote.maxSeconds) else {
                state = .failed("Couldn't start recording.")
                return
            }
            self.recorder = recorder
            elapsed = 0
            state = .recording
            startTicker()
        } catch {
            state = .failed("Couldn't start recording.")
        }
    }

    private func finish(seconds: TimeInterval) {
        stopTicker()
        deactivateSession()
        guard let url = recorder?.url else { return }
        // Under a second is almost always an accidental tap; don't keep it.
        let rounded = min(Int(VoiceNote.maxSeconds), Int(seconds.rounded()))
        guard rounded >= 1 else {
            try? FileManager.default.removeItem(at: url)
            recorder = nil
            state = .idle
            return
        }
        state = .recorded(VoiceRecording(fileURL: url, durationSeconds: rounded))
        elapsed = TimeInterval(rounded)
    }

    private func startTicker() {
        ticker?.invalidate()
        ticker = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self, let recorder = self.recorder, recorder.isRecording else { return }
                self.elapsed = recorder.currentTime
            }
        }
    }

    private func stopTicker() {
        ticker?.invalidate()
        ticker = nil
    }

    private func deactivateSession() {
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}

extension VoiceRecorder: AVAudioRecorderDelegate, AVAudioPlayerDelegate {
    /// Fires when the 60 second cap stops the recorder on its own.
    nonisolated func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        Task { @MainActor in
            guard self.state == .recording else { return }
            // The ticker's last reading, which at the cap rounds to 60.
            self.finish(seconds: self.elapsed)
        }
    }

    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        Task { @MainActor in
            self.isPreviewing = false
            self.previewPlayer = nil
        }
    }
}

// MARK: - Playback

/// Plays a saved recording. Downloads through the authenticated storage API
/// rather than a URL, so iOS never holds a link that plays without a session.
@MainActor
final class VoiceNotePlayer: NSObject, ObservableObject {
    enum State: Equatable { case idle, loading, playing, failed }

    @Published private(set) var state: State = .idle
    @Published private(set) var elapsed: TimeInterval = 0

    private var player: AVAudioPlayer?
    private var ticker: Timer?

    /// Recordings are small and a feed scrolls past the same few repeatedly;
    /// keep them in memory only, never on disk.
    private static let cache = NSCache<NSString, NSData>()

    func toggle(path: String, client: SupabaseClient) {
        switch state {
        case .playing:
            pause()
        case .loading:
            return
        case .idle, .failed:
            if let player {
                play(player)
            } else {
                Task { await load(path: path, client: client) }
            }
        }
    }

    func stop() {
        player?.stop()
        player = nil
        stopTicker()
        elapsed = 0
        if state != .failed { state = .idle }
    }

    private func load(path: String, client: SupabaseClient) async {
        state = .loading
        do {
            let data: Data
            if let cached = Self.cache.object(forKey: path as NSString) {
                data = cached as Data
            } else {
                data = try await client.storage.from(VoiceNote.bucket).download(path: path)
                Self.cache.setObject(data as NSData, forKey: path as NSString)
            }
            let player = try AVAudioPlayer(data: data)
            player.delegate = self
            self.player = player
            play(player)
        } catch {
            state = .failed
        }
    }

    private func play(_ player: AVAudioPlayer) {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            // Playback still works on the default session; not worth failing.
        }
        player.play()
        state = .playing
        ticker?.invalidate()
        ticker = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self, let player = self.player else { return }
                self.elapsed = player.currentTime
            }
        }
    }

    private func pause() {
        player?.pause()
        stopTicker()
        state = .idle
    }

    private func stopTicker() {
        ticker?.invalidate()
        ticker = nil
    }
}

extension VoiceNotePlayer: AVAudioPlayerDelegate {
    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        Task { @MainActor in
            self.stopTicker()
            self.elapsed = 0
            self.state = .idle
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        }
    }
}

// MARK: - Storage and rows

extension ArtworkService {
    /// Uploads a take and points the artwork row at it. The row must already
    /// exist: the storage policy only accepts a key belonging to a real artwork.
    /// Upsert so re-recording replaces the file in place.
    func attachVoiceNote(_ take: VoiceRecording, familyId: UUID, artworkId: UUID) async throws {
        let key = VoiceNote.key(familyId: familyId, artworkId: artworkId)
        let data = try Data(contentsOf: take.fileURL)

        try await client.storage.from(VoiceNote.bucket).upload(
            key,
            data: data,
            options: FileOptions(contentType: "audio/mp4", upsert: true)
        )

        struct VoiceUpdate: Encodable {
            let voice_note_path: String
            let voice_duration_seconds: Int
        }
        try await client
            .from("artworks")
            .update(VoiceUpdate(voice_note_path: key, voice_duration_seconds: take.durationSeconds))
            .eq("id", value: artworkId.uuidString)
            .execute()

        try? FileManager.default.removeItem(at: take.fileURL)
    }

    /// Fire-and-forget version for the upload sheet, which must not hold the
    /// artwork save hostage to the audio. One retry covers a flaky moment on
    /// the network; the temp file is removed either way so a child's voice is
    /// never left behind on the device.
    func attachVoiceNoteInBackground(_ take: VoiceRecording, familyId: UUID, artworkId: UUID) {
        Task {
            for attempt in 1...2 {
                do {
                    try await attachVoiceNote(take, familyId: familyId, artworkId: artworkId)
                    return
                } catch {
                    print("Voice note upload attempt \(attempt) failed: \(error)")
                    if attempt == 1 { try? await Task.sleep(nanoseconds: 2_000_000_000) }
                }
            }
            try? FileManager.default.removeItem(at: take.fileURL)
        }
    }

    /// Removes the recording and clears the row. File first, so a failure part
    /// way leaves an empty player rather than an orphaned recording.
    func deleteVoiceNote(familyId: UUID, artworkId: UUID) async throws {
        _ = try await client.storage
            .from(VoiceNote.bucket)
            .remove(paths: [VoiceNote.key(familyId: familyId, artworkId: artworkId)])

        /// Writes explicit nulls. Synthesized Encodable skips nil optionals, so
        /// the update would otherwise send `{}` and change nothing.
        struct ClearVoice: Encodable {
            enum CodingKeys: String, CodingKey { case voice_note_path, voice_duration_seconds }

            func encode(to encoder: Encoder) throws {
                var container = encoder.container(keyedBy: CodingKeys.self)
                try container.encodeNil(forKey: .voice_note_path)
                try container.encodeNil(forKey: .voice_duration_seconds)
            }
        }
        try await client
            .from("artworks")
            .update(ClearVoice())
            .eq("id", value: artworkId.uuidString)
            .execute()
    }

    /// Deletes an artwork and the files hanging off it. RLS cascades the rows;
    /// nothing cascades into storage, so the recording is removed first.
    func deleteArtwork(_ artwork: Artwork) async throws {
        _ = try? await client.storage
            .from(VoiceNote.bucket)
            .remove(paths: [VoiceNote.key(familyId: artwork.familyId, artworkId: artwork.id)])

        try await client
            .from("artworks")
            .delete()
            .eq("id", value: artwork.id.uuidString)
            .execute()
    }
}

extension SupabaseClient {
    /// Empties one family's folder in a bucket, paging because list() returns
    /// at most 100 names. Best effort: callers are already deleting the rows,
    /// and a failure here should not stop that.
    func removeStorageFolder(bucket: String, folder: String) async {
        let api = storage.from(bucket)
        // Removal shrinks the listing, so re-read from the start each pass.
        // The cap stops a remove that keeps failing from looping forever.
        for _ in 0..<1000 {
            guard let files = try? await api.list(path: folder, options: SearchOptions(limit: 100)),
                  !files.isEmpty else { return }
            guard (try? await api.remove(paths: files.map { "\(folder)/\($0.name)" })) != nil else { return }
            if files.count < 100 { return }
        }
    }
}
