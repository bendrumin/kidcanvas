import Foundation

// Compiled into both the app and the widget extension. The two processes only
// share this file and the App Group container, so everything the widget needs
// to know about the hand-off lives here.

/// One artwork as the widget sees it.
///
/// The widget never talks to Supabase: it has no session, and signing it in
/// would mean handing the auth token to a second process that runs whenever
/// the system likes. Copying a few fields the family can already see, plus a
/// small JPEG, keeps the widget offline and private.
struct WidgetArtwork: Codable, Hashable, Identifiable {
    let id: UUID
    var title: String
    var story: String?
    var childName: String?
    var ageLabel: String?
    /// The day the drawing was made, which is what "on this day" matches on.
    var createdDate: Date
    var isFavorite: Bool
    /// Short reaction tally such as "❤️ 3  🌟 1". Only filled for the latest
    /// artwork, since it costs a query per artwork.
    var reactionSummary: String?

    /// Images are stored by artwork id. An artwork's image never changes after
    /// upload, so a file that already exists can be reused without downloading.
    var imageFileName: String { "\(id.uuidString.lowercased()).jpg" }

    var hasStory: Bool {
        !(story ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}

/// Everything the widget can show, written as one file so a reader never sees
/// half an update.
struct WidgetSnapshot: Codable, Equatable {
    /// The newest upload, what the "Latest drawing" widget shows.
    var latest: WidgetArtwork?
    /// Drawings from earlier years whose day falls in the coming couple of
    /// weeks. The widget picks today's match itself, so it still works on days
    /// the app is not opened.
    var pastYears: [WidgetArtwork] = []
    /// The fallback for "On this day" when nothing matches the date.
    var favorites: [WidgetArtwork] = []

    var allArtworks: [WidgetArtwork] {
        [latest].compactMap { $0 } + pastYears + favorites
    }
}

enum WidgetStore {
    static let appGroupID = "group.Siegel.KidCanvas"

    /// Widget kinds, shared so the app can reload them by name.
    static let latestKind = "KidCanvasLatestWidget"
    static let onThisDayKind = "KidCanvasOnThisDayWidget"

    /// Nil when the App Group entitlement is missing, which happens in a build
    /// signed without it. Every caller treats that as "no widget data" rather
    /// than crashing.
    static var directory: URL? {
        FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: appGroupID)?
            .appendingPathComponent("Widget", isDirectory: true)
    }

    private static var snapshotURL: URL? {
        directory?.appendingPathComponent("snapshot.json")
    }

    static func imageURL(for artwork: WidgetArtwork) -> URL? {
        directory?.appendingPathComponent(artwork.imageFileName)
    }

    static func read() -> WidgetSnapshot? {
        guard let url = snapshotURL, let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
    }

    /// Writes the snapshot and deletes images nothing refers to any more, so
    /// the container does not grow with every drawing the family ever scanned.
    static func write(_ snapshot: WidgetSnapshot) throws {
        guard let directory, let snapshotURL else { return }
        let fm = FileManager.default
        try fm.createDirectory(at: directory, withIntermediateDirectories: true)
        try JSONEncoder().encode(snapshot).write(to: snapshotURL, options: .atomic)

        let keep = Set(snapshot.allArtworks.map(\.imageFileName))
        let files = (try? fm.contentsOfDirectory(atPath: directory.path)) ?? []
        for file in files where file.hasSuffix(".jpg") && !keep.contains(file) {
            try? fm.removeItem(at: directory.appendingPathComponent(file))
        }
    }

    /// Removes everything, used on sign-out so the next person to sign in on
    /// this phone does not see the previous family's drawings on the home screen.
    static func clear() {
        guard let directory else { return }
        try? FileManager.default.removeItem(at: directory)
    }
}

/// URLs the widget opens the app with.
enum DeepLink {
    static let scheme = "kidcanvas"

    /// kidcanvas://artwork/<uuid>
    static func artwork(_ id: UUID) -> URL {
        URL(string: "\(scheme)://artwork/\(id.uuidString.lowercased())")!
    }

    /// kidcanvas://scan, used by the empty widget so the tap goes straight to
    /// the thing it asks for.
    static let scan = URL(string: "\(scheme)://scan")!
}

enum AgeLabel {
    /// "8 months", "3 years", "3y 4m". Same wording as the artwork detail screen.
    static func text(months: Int) -> String {
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

    /// The age when the drawing was made. Uses the stored age if the artwork
    /// has one, otherwise works it out from the birth date.
    static func text(storedMonths: Int?, birthDate: Date?, madeOn date: Date) -> String? {
        if let storedMonths { return text(months: storedMonths) }
        guard let birthDate else { return nil }
        let months = Calendar.current.dateComponents([.month], from: birthDate, to: date).month ?? 0
        return months >= 0 ? text(months: months) : nil
    }
}
