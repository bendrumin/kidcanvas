import Foundation
import SwiftUI
import UIKit
import UserNotifications
import Supabase

/// Remote pushes from the family: new artwork, comments, and reactions.
///
/// The server side lives in the web app (app/api/notify) and is driven by a
/// database trigger, so nothing here sends anything. This class only asks for
/// permission, hands the APNs token to Supabase, and turns a tapped
/// notification into an artwork to open.
@MainActor
final class PushNotifications: NSObject, ObservableObject {
    static let shared = PushNotifications()

    /// Set when a family notification is tapped; MainTabView opens it.
    @Published var pendingArtworkID: UUID?

    /// The last token APNs gave us, kept so sign-out can remove exactly this
    /// device's row. Persisted because sign-out can happen on a launch where
    /// the token callback has not fired yet.
    private var currentToken: String? {
        get { UserDefaults.standard.string(forKey: "apnsDeviceToken") }
        set { UserDefaults.standard.set(newValue, forKey: "apnsDeviceToken") }
    }

    /// Must match what the build's aps-environment entitlement will be. Xcode
    /// signs Debug builds with "development" and re-signs archives for
    /// TestFlight and the App Store with "production", which lines up with the
    /// DEBUG flag in practice.
    private var environment: String {
        #if DEBUG
        return "sandbox"
        #else
        return "production"
        #endif
    }

    // MARK: - Permission

    /// Called right after a meaningful moment (the first upload, joining a
    /// family) rather than at launch, when the user has no idea yet why a
    /// drawing app wants to notify them. Only the first call ever shows the
    /// system prompt; afterwards this just re-registers or does nothing.
    func requestPermissionAndRegister() async {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        switch settings.authorizationStatus {
        case .notDetermined:
            let granted = (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
            if granted { UIApplication.shared.registerForRemoteNotifications() }
        case .authorized, .provisional, .ephemeral:
            UIApplication.shared.registerForRemoteNotifications()
        default:
            break
        }
    }

    /// Refreshes the token on every signed-in launch without ever prompting.
    /// Apple can rotate tokens (restores, reinstalls), and the server deletes
    /// ones that bounce, so re-sending it is what keeps delivery working.
    func registerIfAuthorized() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        switch settings.authorizationStatus {
        case .authorized, .provisional, .ephemeral:
            UIApplication.shared.registerForRemoteNotifications()
        default:
            break
        }
    }

    // MARK: - Token

    func didRegister(deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02x", $0) }.joined()
        currentToken = token
        Task { await upload(token: token) }
    }

    private func upload(token: String) async {
        let auth = AuthManager.shared
        // A token that arrives before sign-in is uploaded by the next
        // registerIfAuthorized() once MainTabView appears.
        guard auth.isAuthenticated else { return }
        do {
            try await auth.client
                .rpc("register_push_device", params: [
                    "device_token": token,
                    "device_environment": environment,
                ])
                .execute()
        } catch {
            print("Push token upload failed: \(error)")
        }
    }

    /// Called before sign-out, while the session can still delete the row.
    /// Otherwise the next person to sign in on this phone would keep getting
    /// the previous account's family news until they registered.
    func unregisterCurrentDevice(client: SupabaseClient) async {
        guard let token = currentToken else { return }
        _ = try? await client
            .from("push_devices")
            .delete()
            .eq("token", value: token)
            .execute()
    }
}

// MARK: - Presentation and taps

extension PushNotifications: UNUserNotificationCenterDelegate {
    /// Without a delegate iOS drops notifications that arrive while the app is
    /// open. Showing a banner is better than silence, for the family pushes and
    /// for MemoryPrompts' local nudges alike.
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .sound, .list]
    }

    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        // Local MemoryPrompts carry no artworkId; tapping those just opens the
        // app, as before.
        let info = response.notification.request.content.userInfo
        guard let raw = info["artworkId"] as? String, let id = UUID(uuidString: raw) else { return }
        await MainActor.run { self.pendingArtworkID = id }
    }
}

/// SwiftUI has no hook for the APNs token callbacks, so a minimal app delegate
/// forwards them.
final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // Set here, not later: a tap that cold-launches the app is delivered
        // as soon as launching finishes, and is lost if no delegate is set.
        UNUserNotificationCenter.current().delegate = PushNotifications.shared
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        PushNotifications.shared.didRegister(deviceToken: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        // Expected on the simulator without a signed-in Apple ID, and when the
        // aps-environment entitlement is missing from the profile.
        print("Remote notification registration failed: \(error.localizedDescription)")
    }
}
