import UIKit

/// Builds the quote book PDF: one page per story, the child's words set large
/// with the drawing underneath, title, date and age at the foot.
///
/// This mirrors `generateQuoteBookPDF` in the web app's lib/pdf-generator.ts.
/// The two are drawn by different code, so keep the rules in step: which
/// artworks go in, the page order, the age wording, and the cover text. A
/// grandparent who gets one book from the web and one from the phone should
/// not be able to tell.
enum QuoteBookRenderer {

    enum Paper: String, CaseIterable, Identifiable {
        case letter
        case a4

        var id: String { rawValue }

        var label: String {
            switch self {
            case .letter: "US Letter"
            case .a4: "A4"
            }
        }

        /// Page size in PDF points (1/72 inch).
        var size: CGSize {
            switch self {
            case .letter: CGSize(width: 612, height: 792)
            case .a4: CGSize(width: 595.28, height: 841.89)
            }
        }
    }

    struct Page {
        let artwork: Artwork
        /// JPEG data, already scaled for print. Nil when the scan couldn't be
        /// downloaded: the page still prints, because the words are the point.
        let image: Data?
    }

    // MARK: - Choosing the stories

    /// Artworks with a non-blank story, drawn within the range, oldest first.
    static func selectArtworks(_ artworks: [Artwork], from: Date?, to: Date?) -> [Artwork] {
        let calendar = Calendar.current
        return artworks
            .filter { !($0.story ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
            .filter { artwork in
                // created_date decodes at local midnight (see AuthManager), so
                // comparing start-of-day values keeps whole days inclusive.
                let day = calendar.startOfDay(for: artwork.createdDate)
                if let from, day < calendar.startOfDay(for: from) { return false }
                if let to, day > calendar.startOfDay(for: to) { return false }
                return true
            }
            .sorted { $0.createdDate < $1.createdDate }
    }

    /// Same wording as the web book: months for toddlers, "Age 4" after that.
    static func ageLabel(for artwork: Artwork, birthDate: Date?) -> String? {
        var months = artwork.childAgeMonths
        // The database trigger only fills child_age_months when a birth date
        // existed at save time, so work it out for birthdays added later.
        if months == nil, let birthDate {
            months = Calendar.current.dateComponents([.month], from: birthDate, to: artwork.createdDate).month
        }
        guard let months, months >= 0 else { return nil }
        if months < 24 { return "\(months) month\(months == 1 ? "" : "s") old" }
        return "Age \(months / 12)"
    }

    static func fileName(childName: String, periodLabel: String) -> String {
        let raw = "the things \(childName) said \(periodLabel)".lowercased()
        let slug = raw
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .filter { !$0.isEmpty }
            .joined(separator: "-")
        return "\(slug).pdf"
    }

    // MARK: - Images

    /// Downloads each scan and shrinks it to 2000px on the long edge. A full-size
    /// phone scan on every page makes a book too big to email to a grandparent,
    /// and 2000px is more than a printed page can show.
    static func loadPages(for artworks: [Artwork]) async -> [Page] {
        await withTaskGroup(of: (Int, Data?).self) { group in
            for (index, artwork) in artworks.enumerated() {
                group.addTask {
                    guard let url = URL(string: artwork.imageUrl),
                          let (data, _) = try? await URLSession.shared.data(from: url),
                          let image = UIImage(data: data) else {
                        return (index, nil)
                    }
                    return (index, printReady(image))
                }
            }
            var images = [Data?](repeating: nil, count: artworks.count)
            for await (index, data) in group {
                images[index] = data
            }
            return zip(artworks, images).map { Page(artwork: $0, image: $1) }
        }
    }

    private static func printReady(_ image: UIImage) -> Data? {
        let longEdge = max(image.size.width, image.size.height)
        let scale = min(1, 2000 / max(longEdge, 1))
        let size = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.opaque = true
        // Opaque with a white fill, so a transparent PNG doesn't print black.
        return UIGraphicsImageRenderer(size: size, format: format).jpegData(withCompressionQuality: 0.88) { ctx in
            UIColor.white.setFill()
            ctx.fill(CGRect(origin: .zero, size: size))
            image.draw(in: CGRect(origin: .zero, size: size))
        }
    }

    // MARK: - Drawing

    private static let pink = UIColor(red: 233 / 255, green: 30 / 255, blue: 99 / 255, alpha: 1)
    private static let ink = UIColor(red: 38 / 255, green: 34 / 255, blue: 32 / 255, alpha: 1)
    private static let muted = UIColor(red: 120 / 255, green: 112 / 255, blue: 106 / 255, alpha: 1)
    // Fixed cream, not Color.paperBackground: paper is paper, whatever mode
    // the phone happens to be in when the book is made.
    private static let cream = UIColor(red: 253 / 255, green: 250 / 255, blue: 245 / 255, alpha: 1)

    private static func serif(_ size: CGFloat, italic: Bool = false, bold: Bool = false) -> UIFont {
        var descriptor = UIFont.systemFont(ofSize: size).fontDescriptor
        descriptor = descriptor.withDesign(.serif) ?? descriptor
        var traits: UIFontDescriptor.SymbolicTraits = []
        if italic { traits.insert(.traitItalic) }
        if bold { traits.insert(.traitBold) }
        descriptor = descriptor.withSymbolicTraits(traits) ?? descriptor
        return UIFont(descriptor: descriptor, size: size)
    }

    static func render(pages: [Page], childName: String, birthDate: Date?, periodLabel: String, paper: Paper) -> Data {
        let bounds = CGRect(origin: .zero, size: paper.size)
        let margin: CGFloat = 62
        let contentWidth = bounds.width - margin * 2
        let captionHeight: CGFloat = 62

        let format = UIGraphicsPDFRendererFormat()
        format.documentInfo = [
            kCGPDFContextTitle as String: "The things \(childName) said, \(periodLabel)",
            kCGPDFContextCreator as String: "KidCanvas",
        ]

        return UIGraphicsPDFRenderer(bounds: bounds, format: format).pdfData { ctx in
            // Cover
            ctx.beginPage()
            cream.setFill()
            ctx.fill(bounds)

            let centre = NSMutableParagraphStyle()
            centre.alignment = .center

            let rule = UIBezierPath()
            rule.move(to: CGPoint(x: bounds.midX - 42, y: bounds.midY - 108))
            rule.addLine(to: CGPoint(x: bounds.midX + 42, y: bounds.midY - 108))
            rule.lineWidth = 2
            pink.setStroke()
            rule.stroke()

            let title = NSAttributedString(string: "The things \(childName) said", attributes: [
                .font: serif(34, bold: true), .foregroundColor: ink, .paragraphStyle: centre,
            ])
            let titleRect = title.boundingRect(
                with: CGSize(width: contentWidth, height: .greatestFiniteMagnitude),
                options: [.usesLineFragmentOrigin, .usesFontLeading], context: nil
            )
            let titleTop = bounds.midY - 80
            title.draw(with: CGRect(x: margin, y: titleTop, width: contentWidth, height: ceil(titleRect.height)),
                       options: [.usesLineFragmentOrigin, .usesFontLeading], context: nil)

            let period = NSAttributedString(string: periodLabel, attributes: [
                .font: serif(22, italic: true), .foregroundColor: pink, .paragraphStyle: centre,
            ])
            period.draw(in: CGRect(x: margin, y: titleTop + ceil(titleRect.height) + 10, width: contentWidth, height: 40))

            let count = pages.count
            let countLine = NSAttributedString(
                string: "\(count) \(count == 1 ? "story" : "stories"), in \(childName)'s words",
                attributes: [.font: UIFont.systemFont(ofSize: 10), .foregroundColor: muted, .paragraphStyle: centre]
            )
            countLine.draw(in: CGRect(x: margin, y: bounds.height - 120, width: contentWidth, height: 16))
            NSAttributedString(string: "Made with KidCanvas", attributes: [
                .font: UIFont.systemFont(ofSize: 8), .foregroundColor: muted, .paragraphStyle: centre,
            ]).draw(in: CGRect(x: margin, y: bounds.height - 92, width: contentWidth, height: 12))

            // One page per story. The quote steps down in size until it fits in
            // the top 55% of the page; the drawing gets whatever is left.
            let quoteSizes: [CGFloat] = [30, 26, 22, 19, 16, 14, 12]
            let maxQuoteHeight = (bounds.height - margin * 2) * 0.55

            for (index, page) in pages.enumerated() {
                ctx.beginPage()
                cream.setFill()
                ctx.fill(bounds)

                let story = (page.artwork.story ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                let leading = NSMutableParagraphStyle()
                leading.lineHeightMultiple = 1.15

                var quote = NSAttributedString()
                var quoteHeight: CGFloat = 0
                for size in quoteSizes {
                    quote = NSAttributedString(string: "\u{201C}\(story)\u{201D}", attributes: [
                        .font: serif(size, italic: true), .foregroundColor: ink, .paragraphStyle: leading,
                    ])
                    quoteHeight = ceil(quote.boundingRect(
                        with: CGSize(width: contentWidth, height: .greatestFiniteMagnitude),
                        options: [.usesLineFragmentOrigin, .usesFontLeading], context: nil
                    ).height)
                    if quoteHeight <= maxQuoteHeight { break }
                }
                quote.draw(with: CGRect(x: margin, y: margin, width: contentWidth, height: quoteHeight),
                           options: [.usesLineFragmentOrigin, .usesFontLeading], context: nil)

                let imageTop = margin + quoteHeight + 30
                let imageBox = CGRect(x: margin, y: imageTop, width: contentWidth,
                                      height: bounds.height - margin - captionHeight - imageTop)
                if imageBox.height > 85, let data = page.image, let image = UIImage(data: data) {
                    let ratio = image.size.width / max(image.size.height, 1)
                    var w = imageBox.width
                    var h = w / ratio
                    if h > imageBox.height {
                        h = imageBox.height
                        w = h * ratio
                    }
                    image.draw(in: CGRect(x: imageBox.midX - w / 2, y: imageBox.midY - h / 2, width: w, height: h))
                }

                let captionTop = bounds.height - margin - captionHeight + 18
                NSAttributedString(string: page.artwork.title, attributes: [
                    .font: UIFont.systemFont(ofSize: 11, weight: .bold), .foregroundColor: ink,
                ]).draw(with: CGRect(x: margin, y: captionTop, width: contentWidth, height: 16),
                        options: [.usesLineFragmentOrigin, .truncatesLastVisibleLine], context: nil)

                let meta = [
                    page.artwork.createdDate.formatted(date: .long, time: .omitted),
                    ageLabel(for: page.artwork, birthDate: birthDate),
                ].compactMap { $0 }.joined(separator: "  \u{00B7}  ")
                NSAttributedString(string: meta, attributes: [
                    .font: UIFont.systemFont(ofSize: 9), .foregroundColor: muted,
                ]).draw(at: CGPoint(x: margin, y: captionTop + 16))

                let number = NSAttributedString(string: "\(index + 1)", attributes: [
                    .font: UIFont.systemFont(ofSize: 8), .foregroundColor: muted,
                ])
                number.draw(at: CGPoint(x: bounds.width - margin - number.size().width,
                                        y: bounds.height - margin / 2 - number.size().height))
            }
        }
    }
}
