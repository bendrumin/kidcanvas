import Foundation

/// Holds a link the app was opened with until the signed-in UI can act on it.
///
/// A widget tap on a cold launch arrives before the session check finishes,
/// so the destination is parked here and MainTabView picks it up when it
/// appears, rather than being dropped because there was nothing to show yet.
@MainActor
final class DeepLinkRouter: ObservableObject {
    enum Destination: Hashable {
        case artwork(UUID)
        case scan
    }

    @Published var pending: Destination?

    func handle(_ url: URL) {
        guard url.scheme == DeepLink.scheme else { return }
        switch url.host {
        case "artwork":
            if let id = UUID(uuidString: url.lastPathComponent) {
                pending = .artwork(id)
            }
        case "scan":
            pending = .scan
        default:
            break
        }
    }
}
