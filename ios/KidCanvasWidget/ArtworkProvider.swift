import UIKit
import WidgetKit

struct ArtworkEntry: TimelineEntry {
    let date: Date
    let artwork: WidgetArtwork?
    let image: UIImage?
    /// Context above the quote, such as "On this day in 2024". Nil for the
    /// latest drawing, where the title does that job.
    let caption: String?

    static func empty(at date: Date = .now) -> ArtworkEntry {
        ArtworkEntry(date: date, artwork: nil, image: nil, caption: nil)
    }

    /// What the widget gallery shows before the family has anything saved. No
    /// image asset on purpose: a stock drawing would look like someone else's
    /// child on the fridge.
    static let sample = ArtworkEntry(
        date: .now,
        artwork: WidgetArtwork(
            id: UUID(),
            title: "Night butterfly",
            story: "It only comes out at night, and its wings are rainbows so it can find its way home.",
            childName: "Maya",
            ageLabel: "4 years",
            createdDate: .now,
            isFavorite: true,
            reactionSummary: "❤️ 3  🌟 1"
        ),
        image: nil,
        caption: nil
    )
}

private func loadImage(for artwork: WidgetArtwork?) -> UIImage? {
    guard let artwork, let url = WidgetStore.imageURL(for: artwork) else { return nil }
    return UIImage(contentsOfFile: url.path)
}

// MARK: - Latest drawing

struct LatestArtworkProvider: TimelineProvider {
    func placeholder(in context: Context) -> ArtworkEntry { .sample }

    func getSnapshot(in context: Context, completion: @escaping (ArtworkEntry) -> Void) {
        completion(currentEntry() ?? (context.isPreview ? .sample : .empty()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ArtworkEntry>) -> Void) {
        // .never because nothing changes on its own: the app reloads this
        // timeline whenever it writes a new snapshot.
        completion(Timeline(entries: [currentEntry() ?? .empty()], policy: .never))
    }

    private func currentEntry() -> ArtworkEntry? {
        guard let latest = WidgetStore.read()?.latest else { return nil }
        return ArtworkEntry(date: .now, artwork: latest, image: loadImage(for: latest), caption: nil)
    }
}

// MARK: - On this day

struct OnThisDayProvider: TimelineProvider {
    /// Days of entries built per timeline. The data is local, so a week ahead
    /// costs nothing and keeps the widget rotating if the app is not opened.
    private let daysAhead = 7

    func placeholder(in context: Context) -> ArtworkEntry { .sample }

    func getSnapshot(in context: Context, completion: @escaping (ArtworkEntry) -> Void) {
        let snapshot = WidgetStore.read()
        let entry = snapshot.map { entry(for: .now, from: $0) }
        if let entry, entry.artwork != nil {
            completion(entry)
        } else {
            completion(context.isPreview ? .sample : .empty())
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ArtworkEntry>) -> Void) {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: .now)
        guard let snapshot = WidgetStore.read() else {
            let tomorrow = calendar.date(byAdding: .day, value: 1, to: today) ?? today
            completion(Timeline(entries: [.empty()], policy: .after(tomorrow)))
            return
        }
        // The first entry is dated now, not midnight, so it shows immediately.
        let days = (0..<daysAhead).compactMap { calendar.date(byAdding: .day, value: $0, to: today) }
        let entries = days.enumerated().map { index, day in
            entry(for: index == 0 ? .now : day, from: snapshot)
        }
        let refresh = calendar.date(byAdding: .day, value: daysAhead, to: today) ?? today
        completion(Timeline(entries: entries, policy: .after(refresh)))
    }

    /// Today's match from an earlier year if there is one, then a favorite,
    /// then the latest drawing, so the widget is only empty when the family
    /// has nothing saved at all.
    private func entry(for date: Date, from snapshot: WidgetSnapshot) -> ArtworkEntry {
        let calendar = Calendar.current
        let day = calendar.dateComponents([.year, .month, .day], from: date)
        // Picked by day of year rather than at random, so the app reloading the
        // timeline during the day does not swap the drawing under the user.
        let seed = calendar.ordinality(of: .day, in: .year, for: date) ?? 0

        let matches = snapshot.pastYears.filter {
            let made = calendar.dateComponents([.year, .month, .day], from: $0.createdDate)
            return made.month == day.month && made.day == day.day && (made.year ?? 0) < (day.year ?? 0)
        }
        if !matches.isEmpty {
            let pick = matches[seed % matches.count]
            let year = calendar.component(.year, from: pick.createdDate)
            let yearsAgo = (day.year ?? year) - year
            let caption = yearsAgo == 1 ? "One year ago today" : "\(yearsAgo) years ago today"
            return ArtworkEntry(date: date, artwork: pick, image: loadImage(for: pick), caption: caption)
        }
        if !snapshot.favorites.isEmpty {
            let pick = snapshot.favorites[seed % snapshot.favorites.count]
            return ArtworkEntry(date: date, artwork: pick, image: loadImage(for: pick), caption: "A favorite")
        }
        if let latest = snapshot.latest {
            return ArtworkEntry(date: date, artwork: latest, image: loadImage(for: latest), caption: "Latest drawing")
        }
        return .empty(at: date)
    }
}
