import Foundation
import UserNotifications

/// Local nudges to add artwork, scheduled on the device — no server, no push
/// certificates, and nothing leaves the phone.
enum MemoryPrompts {
    private static let quietSpellID = "kidcanvas.quiet-spell"
    private static let birthdayPrefix = "kidcanvas.birthday."

    static func requestAuthorizationIfNeeded() async -> Bool {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        switch settings.authorizationStatus {
        case .notDetermined:
            return (try? await center.requestAuthorization(options: [.alert, .sound])) ?? false
        case .authorized, .provisional, .ephemeral:
            return true
        default:
            return false
        }
    }

    /// Re-schedules everything from scratch. Cheap, and avoids reasoning about
    /// what's already pending.
    static func reschedule(lastUpload: Date?, children: [Child]) async {
        let center = UNUserNotificationCenter.current()
        guard await requestAuthorizationIfNeeded() else { return }

        center.removePendingNotificationRequests(
            withIdentifiers: [quietSpellID] + children.map { birthdayPrefix + $0.id.uuidString }
        )

        scheduleQuietSpell(after: lastUpload, center: center)
        for child in children {
            scheduleBirthday(for: child, center: center)
        }
    }

    /// One nudge a week after the most recent upload — the point is "it's been
    /// a while", not a daily habit loop.
    private static func scheduleQuietSpell(after lastUpload: Date?, center: UNUserNotificationCenter) {
        let anchor = lastUpload ?? Date()
        guard let fireDate = Calendar.current.date(byAdding: .day, value: 7, to: anchor),
              fireDate > Date() else { return }

        let content = UNMutableNotificationContent()
        content.title = "Anything new on the fridge?"
        content.body = "It's been a week. Scan one drawing and write down what they said about it."
        content.sound = .default

        let components = Calendar.current.dateComponents([.year, .month, .day, .hour], from: fireDate)
        center.add(UNNotificationRequest(
            identifier: quietSpellID,
            content: content,
            trigger: UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        ))
    }

    /// A week before each child's birthday — a natural moment to look back.
    private static func scheduleBirthday(for child: Child, center: UNUserNotificationCenter) {
        guard let birthDate = child.birthDate else { return }
        let calendar = Calendar.current
        let birthComponents = calendar.dateComponents([.month, .day], from: birthDate)
        guard let month = birthComponents.month, let day = birthComponents.day else { return }

        var next = DateComponents()
        next.month = month
        next.day = day
        next.year = calendar.component(.year, from: Date())
        guard let thisYear = calendar.date(from: next) else { return }
        let target = thisYear > Date()
            ? thisYear
            : calendar.date(byAdding: .year, value: 1, to: thisYear) ?? thisYear
        guard let fireDate = calendar.date(byAdding: .day, value: -7, to: target) else { return }

        let content = UNMutableNotificationContent()
        content.title = "\(child.name)'s birthday is coming up"
        content.body = "Look back at a year of their artwork — or add the newest piece."
        content.sound = .default

        var fire = calendar.dateComponents([.year, .month, .day], from: fireDate)
        fire.hour = 10
        center.add(UNNotificationRequest(
            identifier: birthdayPrefix + child.id.uuidString,
            content: content,
            trigger: UNCalendarNotificationTrigger(dateMatching: fire, repeats: false)
        ))
    }

    static func cancelAll() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
    }
}
