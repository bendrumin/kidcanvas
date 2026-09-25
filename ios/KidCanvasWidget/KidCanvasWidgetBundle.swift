import SwiftUI
import WidgetKit

@main
struct KidCanvasWidgetBundle: WidgetBundle {
    var body: some Widget {
        LatestArtworkWidget()
        OnThisDayWidget()
    }
}

struct LatestArtworkWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: WidgetStore.latestKind, provider: LatestArtworkProvider()) { entry in
            FridgeWidgetView(entry: entry)
        }
        .configurationDisplayName("Latest drawing")
        .description("The newest drawing, in their words.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        // The drawing runs to the edges like a print on the fridge; text views
        // add their own padding.
        .contentMarginsDisabled()
    }
}

struct OnThisDayWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: WidgetStore.onThisDayKind, provider: OnThisDayProvider()) { entry in
            FridgeWidgetView(entry: entry)
        }
        .configurationDisplayName("On this day")
        .description("A drawing from this date in an earlier year, or a favorite when there isn't one.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .contentMarginsDisabled()
    }
}

#Preview("Medium", as: .systemMedium) {
    LatestArtworkWidget()
} timeline: {
    ArtworkEntry.sample
    ArtworkEntry.empty()
}

#Preview("Large", as: .systemLarge) {
    LatestArtworkWidget()
} timeline: {
    ArtworkEntry.sample
}
