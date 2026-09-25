import SwiftUI
import WidgetKit

/// The fridge on the home screen: the drawing, and what the child said about it.
struct FridgeWidgetView: View {
    let entry: ArtworkEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        Group {
            if let artwork = entry.artwork {
                switch family {
                case .systemSmall:
                    SmallFridgeView(artwork: artwork, image: entry.image)
                case .systemLarge:
                    LargeFridgeView(artwork: artwork, image: entry.image, caption: entry.caption)
                default:
                    MediumFridgeView(artwork: artwork, image: entry.image, caption: entry.caption)
                }
            } else {
                EmptyFridgeView()
            }
        }
        .widgetURL(entry.artwork.map { DeepLink.artwork($0.id) } ?? DeepLink.scan)
        .containerBackground(for: .widget) { Color.paperBackground }
    }
}

// MARK: - Sizes

/// Image only, with the artist's name, because a quote at this size would be
/// three words and an ellipsis.
private struct SmallFridgeView: View {
    let artwork: WidgetArtwork
    let image: UIImage?

    var body: some View {
        ArtworkImage(image: image)
            .overlay(alignment: .bottomLeading) {
                if let name = artwork.childName {
                    Text(name)
                        .font(.system(.caption, design: .rounded).weight(.bold))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        // A scrim, since the drawing behind the name can be any
                        // colour, including white paper.
                        .background(
                            LinearGradient(colors: [.clear, .black.opacity(0.55)],
                                           startPoint: .top, endPoint: .bottom)
                        )
                }
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(accessibilityText(for: artwork))
    }
}

private struct MediumFridgeView: View {
    let artwork: WidgetArtwork
    let image: UIImage?
    let caption: String?

    var body: some View {
        GeometryReader { geo in
            HStack(spacing: 0) {
                ArtworkImage(image: image)
                    .frame(width: geo.size.width * 0.42)

                VStack(alignment: .leading, spacing: 6) {
                    CaptionText(text: caption ?? artwork.title)
                    QuoteText(artwork: artwork, size: 15, lineLimit: 4)
                    Spacer(minLength: 0)
                    ArtistLine(artwork: artwork)
                }
                .padding(14)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(accessibilityText(for: artwork))
    }
}

/// Room for the whole quote and the family's reactions, the part that makes
/// it feel like the fridge rather than a photo frame.
private struct LargeFridgeView: View {
    let artwork: WidgetArtwork
    let image: UIImage?
    let caption: String?

    var body: some View {
        GeometryReader { geo in
            VStack(spacing: 0) {
                ArtworkImage(image: image)
                    .frame(height: geo.size.height * 0.55)

                VStack(alignment: .leading, spacing: 8) {
                    if let caption {
                        CaptionText(text: caption)
                    }
                    if artwork.hasStory {
                        Text(artwork.title)
                            .font(.system(.subheadline, design: .rounded).weight(.bold))
                            .lineLimit(1)
                    }
                    QuoteText(artwork: artwork, size: 17, lineLimit: 5)
                    Spacer(minLength: 0)
                    HStack(alignment: .firstTextBaseline) {
                        ArtistLine(artwork: artwork, showsDate: true)
                        Spacer(minLength: 8)
                        if let reactions = artwork.reactionSummary {
                            Text(reactions)
                                .font(.caption)
                                .lineLimit(1)
                                .accessibilityLabel("Reactions \(reactions)")
                        }
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(accessibilityText(for: artwork))
    }
}

/// Asks for the one thing that fills it, and the tap opens the scanner.
private struct EmptyFridgeView: View {
    @Environment(\.widgetFamily) private var family

    var body: some View {
        VStack(spacing: family == .systemSmall ? 8 : 12) {
            Image(systemName: "paintpalette.fill")
                .font(.system(size: family == .systemSmall ? 30 : 38))
                .foregroundStyle(
                    LinearGradient(colors: [.pink, .purple],
                                   startPoint: .leading, endPoint: .trailing)
                )
            Text("Scan the next drawing and it shows up here.")
                .font(.system(family == .systemSmall ? .caption : .subheadline, design: .rounded)
                    .weight(.medium))
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Pieces

private struct ArtworkImage: View {
    let image: UIImage?

    var body: some View {
        Group {
            if let image {
                fridgeImage(image)
            } else {
                // The image can be missing if the download had not finished
                // when the snapshot was written. A warm tile reads as "coming"
                // rather than broken.
                LinearGradient(colors: Color.paperGradientStops,
                               startPoint: .topLeading, endPoint: .bottomTrailing)
                    .overlay {
                        Image(systemName: "photo.artframe")
                            .font(.title)
                            .foregroundStyle(.pink.opacity(0.6))
                    }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .clipped()
    }

    /// Tinted and clear home screens (iOS 18) desaturate widget images by
    /// default. A child's drawing is the point, so it keeps its colours.
    @ViewBuilder
    private func fridgeImage(_ image: UIImage) -> some View {
        if #available(iOS 18.0, *) {
            Image(uiImage: image)
                .resizable()
                .widgetAccentedRenderingMode(.fullColor)
                .scaledToFill()
        } else {
            Image(uiImage: image)
                .resizable()
                .scaledToFill()
        }
    }
}

/// The child's words. Rounded italic so it reads as something said out loud,
/// not a caption the parent wrote.
private struct QuoteText: View {
    let artwork: WidgetArtwork
    let size: CGFloat
    let lineLimit: Int

    var body: some View {
        if artwork.hasStory, let story = artwork.story {
            Text("\u{201C}\(story.trimmingCharacters(in: .whitespacesAndNewlines))\u{201D}")
                .font(.system(size: size, weight: .medium, design: .rounded).italic())
                .foregroundStyle(.primary)
                .lineLimit(lineLimit)
                .minimumScaleFactor(0.8)
                .fixedSize(horizontal: false, vertical: true)
        } else {
            // No story yet: the title stands in, upright, so it is not
            // mistaken for something the child said.
            Text(artwork.title)
                .font(.system(size: size, weight: .bold, design: .rounded))
                .foregroundStyle(.primary)
                .lineLimit(lineLimit)
        }
    }
}

private struct CaptionText: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.system(.caption2, design: .rounded).weight(.semibold))
            .foregroundStyle(.pink)
            .lineLimit(1)
    }
}

/// "Maya, 4 years" with the same initial badge the feed uses.
private struct ArtistLine: View {
    let artwork: WidgetArtwork
    var showsDate = false

    var body: some View {
        HStack(spacing: 6) {
            if let name = artwork.childName {
                Circle()
                    .fill(LinearGradient(colors: [.pink, .purple],
                                         startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 18, height: 18)
                    .overlay {
                        Text(String(name.prefix(1)).uppercased())
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(.white)
                    }
            }
            Text(detailText)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
        }
    }

    private var detailText: String {
        var parts: [String] = []
        if let name = artwork.childName {
            parts.append(artwork.ageLabel.map { "\(name), \($0)" } ?? name)
        }
        if showsDate || parts.isEmpty {
            parts.append(artwork.createdDate.formatted(date: .abbreviated, time: .omitted))
        }
        return parts.joined(separator: " · ")
    }
}

private func accessibilityText(for artwork: WidgetArtwork) -> String {
    var text = artwork.title
    if let name = artwork.childName { text += " by \(name)" }
    if artwork.hasStory, let story = artwork.story { text += ". \(story)" }
    return text
}
