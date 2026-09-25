import SwiftUI
import UIKit

/// Semantic surface colours.
///
/// Every view used to hardcode `Color.white` for card backgrounds and
/// `Color.gray.opacity(...)` for fills. Nothing forced a light appearance, so the
/// system chrome switched to dark correctly while every card stayed white --
/// which is why dark mode looked half-finished rather than broken.
///
/// These are the UIKit dynamic colours, so they resolve per appearance. In light
/// mode `cardSurface` is the same pure white it always was, so nothing changes
/// visually; in dark mode it becomes the raised grey it should have been.
///
/// Prefer these over a literal colour for anything that is a *surface*. Literal
/// colours are still right for content drawn on top of a fixed-colour element --
/// white text on the pink accent button stays white in both appearances.
extension Color {
    /// A card or raised panel sitting on the screen background.
    static let cardSurface = Color(uiColor: .secondarySystemGroupedBackground)

    /// The screen behind cards.
    static let screenBackground = Color(uiColor: .systemGroupedBackground)

    /// Text fields, chips, and other lightly-tinted controls.
    static let subtleFill = Color(uiColor: .secondarySystemFill)

    /// Image placeholders and skeletons, one step quieter than `subtleFill`.
    static let placeholderFill = Color(uiColor: .tertiarySystemFill)

    /// The quietest tint available, for hairline separators and faint washes.
    static let faintFill = Color(uiColor: .quaternarySystemFill)
}

/// The warm "paper" backdrop the app is designed around.
///
/// This was hardcoded cream in five places, so switching to dark mode left every
/// screen a bright cream page with dark cards floating on it -- the half-finished
/// look. A dynamic UIColor keeps the brand warmth in both appearances instead of
/// falling back to a neutral system grey: cream in light, a warm near-black in
/// dark.
extension Color {
    static let paperBackground = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.09, green: 0.08, blue: 0.07, alpha: 1)
            : UIColor(red: 0.98, green: 0.97, blue: 0.95, alpha: 1)
    })

    /// Stops for the same backdrop as a gradient, warm in both appearances.
    static let paperGradientStops: [Color] = [
        Color(uiColor: UIColor { t in
            t.userInterfaceStyle == .dark
                ? UIColor(red: 0.11, green: 0.09, blue: 0.08, alpha: 1)
                : UIColor(red: 1.0, green: 0.97, blue: 0.93, alpha: 1)
        }),
        Color(uiColor: UIColor { t in
            t.userInterfaceStyle == .dark
                ? UIColor(red: 0.08, green: 0.07, blue: 0.07, alpha: 1)
                : UIColor(red: 1.0, green: 0.94, blue: 0.90, alpha: 1)
        }),
        Color(uiColor: UIColor { t in
            t.userInterfaceStyle == .dark
                ? UIColor(red: 0.10, green: 0.07, blue: 0.08, alpha: 1)
                : UIColor(red: 1.0, green: 0.93, blue: 0.93, alpha: 1)
        }),
    ]
}
