import UIKit
import WidgetKit

/// Keeps the home-screen widget's copy of the family's artwork current.
///
/// The widget reads whatever was last written here and never fetches anything
/// itself, so this is the only way new drawings reach the home screen.
enum WidgetSnapshotWriter {
    /// How far ahead "on this day" candidates are collected. The widget picks
    /// the match for the current date, so a family that does not open the app
    /// for a while still gets the right drawing for the next two weeks.
    private static let lookaheadDays = 14
    private static let maxPastYears = 14
    private static let maxFavorites = 8
    /// Larger than any widget renders at on a 3x phone. WidgetKit refuses to
    /// draw images that are much bigger than the widget, so full scans are out.
    private static let maxImageDimension: CGFloat = 700

    // MARK: - Writes

    /// Rebuilds the snapshot from the feed. `artworks` is the feed's list,
    /// newest upload first.
    static func update(from artworks: [Artwork], service: ArtworkService) async {
        guard WidgetStore.directory != nil else { return }

        let calendar = Calendar.current
        let now = Date()
        let thisYear = calendar.component(.year, from: now)
        let upcomingDays: Set<MonthDay> = Set((0..<lookaheadDays).compactMap { offset in
            calendar.date(byAdding: .day, value: offset, to: now).map { MonthDay($0, calendar) }
        })

        var snapshot = WidgetSnapshot()
        if let first = artworks.first {
            var latest = widgetArtwork(from: first)
            latest.reactionSummary = await reactionSummary(for: first.id, service: service)
            snapshot.latest = latest
        }
        // Stories first: the widget is about what they said, so a drawing with
        // words beats one without when there are more candidates than slots.
        // Two filters rather than sorted(by:), which is not stable and would
        // lose the newest-first order within each group.
        let hasStory: (Artwork) -> Bool = { !($0.story ?? "").trimmed.isEmpty }
        let byStory = artworks.filter(hasStory) + artworks.filter { !hasStory($0) }
        snapshot.pastYears = Array(byStory
            .filter {
                calendar.component(.year, from: $0.createdDate) < thisYear
                    && upcomingDays.contains(MonthDay($0.createdDate, calendar))
            }
            .prefix(maxPastYears)
            .map(widgetArtwork(from:)))
        snapshot.favorites = Array(byStory
            .filter(\.isFavorite)
            .prefix(maxFavorites)
            .map(widgetArtwork(from:)))

        let imageSources = Dictionary(
            artworks.map { ($0.id, $0.thumbnailUrl ?? $0.imageUrl) },
            uniquingKeysWith: { first, _ in first }
        )
        await downloadMissingImages(for: snapshot.allArtworks, sources: imageSources)
        save(snapshot)
    }

    /// Puts a just-saved drawing on the widget straight away, using the image
    /// already in memory rather than waiting for the next feed load.
    static func saveLatest(_ artwork: WidgetArtwork, imageData: Data) {
        guard WidgetStore.directory != nil else { return }
        if let url = WidgetStore.imageURL(for: artwork) {
            try? FileManager.default.createDirectory(
                at: url.deletingLastPathComponent(), withIntermediateDirectories: true
            )
            try? downsized(imageData)?.write(to: url, options: .atomic)
        }
        var snapshot = WidgetStore.read() ?? WidgetSnapshot()
        snapshot.latest = artwork
        save(snapshot)
    }

    /// A story added later should show up on the widget without a feed reload.
    static func updateStory(_ story: String, artworkId: UUID) {
        guard var snapshot = WidgetStore.read() else { return }
        func apply(_ artwork: inout WidgetArtwork) {
            if artwork.id == artworkId { artwork.story = story }
        }
        if var latest = snapshot.latest { apply(&latest); snapshot.latest = latest }
        for i in snapshot.pastYears.indices { apply(&snapshot.pastYears[i]) }
        for i in snapshot.favorites.indices { apply(&snapshot.favorites[i]) }
        save(snapshot)
    }

    static func clear() {
        WidgetStore.clear()
        WidgetCenter.shared.reloadAllTimelines()
    }

    // MARK: - Helpers

    private static func save(_ snapshot: WidgetSnapshot) {
        // Every feed load lands here. Skipping identical writes keeps the
        // widget from re-rendering for nothing.
        if WidgetStore.read() == snapshot { return }
        do {
            try WidgetStore.write(snapshot)
            WidgetCenter.shared.reloadAllTimelines()
        } catch {
            print("Error writing widget snapshot: \(error)")
        }
    }

    private static func widgetArtwork(from artwork: Artwork) -> WidgetArtwork {
        WidgetArtwork(
            id: artwork.id,
            title: artwork.title,
            story: artwork.story,
            childName: artwork.child?.name,
            ageLabel: AgeLabel.text(
                storedMonths: artwork.childAgeMonths,
                birthDate: artwork.child?.birthDate,
                madeOn: artwork.createdDate
            ),
            createdDate: artwork.createdDate,
            isFavorite: artwork.isFavorite
        )
    }

    private static func reactionSummary(for artworkId: UUID, service: ArtworkService) async -> String? {
        guard let counts = try? await service.reactionCounts(artworkId: artworkId) else { return nil }
        let parts = counts
            .filter { $0.count > 0 }
            .sorted { $0.count > $1.count }
            .map { "\($0.emojiType) \($0.count)" }
        return parts.isEmpty ? nil : parts.joined(separator: "  ")
    }

    /// Fetches only images not already in the container. Artwork images never
    /// change once uploaded, so after the first load this is usually no work.
    private static func downloadMissingImages(for artworks: [WidgetArtwork], sources: [UUID: String]) async {
        let missing = artworks.filter { artwork in
            guard let url = WidgetStore.imageURL(for: artwork) else { return false }
            return !FileManager.default.fileExists(atPath: url.path)
        }
        guard !missing.isEmpty, let directory = WidgetStore.directory else { return }
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)

        await withTaskGroup(of: Void.self) { group in
            for artwork in missing {
                guard let source = sources[artwork.id].flatMap(URL.init(string:)),
                      let destination = WidgetStore.imageURL(for: artwork) else { continue }
                group.addTask {
                    guard let (data, _) = try? await URLSession.shared.data(from: source),
                          let jpeg = downsized(data) else { return }
                    try? jpeg.write(to: destination, options: .atomic)
                }
            }
        }
    }

    private static func downsized(_ data: Data) -> Data? {
        guard let image = UIImage(data: data) else { return nil }
        let scale = min(1, maxImageDimension / max(image.size.width, image.size.height))
        let size = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let resized = UIGraphicsImageRenderer(size: size, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
        return resized.jpegData(compressionQuality: 0.75)
    }
}

/// A calendar day with the year dropped, for "on this day" matching.
private struct MonthDay: Hashable {
    let month: Int
    let day: Int

    init(_ date: Date, _ calendar: Calendar) {
        let parts = calendar.dateComponents([.month, .day], from: date)
        month = parts.month ?? 0
        day = parts.day ?? 0
    }
}
