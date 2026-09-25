import Foundation
import StoreKit
import Supabase

/// The plan tiers, mirroring `PlanId` in lib/stripe.ts.
enum PlanTier: String, Codable, Comparable {
    case free, family, pro

    private var rank: Int {
        switch self {
        case .free: return 0
        case .family: return 1
        case .pro: return 2
        }
    }

    static func < (lhs: PlanTier, rhs: PlanTier) -> Bool { lhs.rank < rhs.rank }

    var displayName: String {
        switch self {
        case .free: return "Free"
        case .family: return "Family"
        case .pro: return "Pro"
        }
    }

    /// Limits per tier, -1 meaning unlimited. Used only when the server's answer
    /// is unavailable or older than a purchase this device just made; the
    /// server (get_user_plan) is the source of truth and returns the same
    /// numbers as lib/stripe.ts PLANS.
    var fallbackLimits: PlanLimits {
        switch self {
        case .free: return PlanLimits(artworks: 50, children: 1, families: 1)
        case .family: return PlanLimits(artworks: -1, children: -1, families: 1)
        case .pro: return PlanLimits(artworks: -1, children: -1, families: -1)
        }
    }
}

struct PlanLimits: Equatable {
    let artworks: Int
    let children: Int
    let families: Int
}

/// One row of `get_user_plan(target_user_id)`, migration 014. The web's
/// lib/subscription.ts reads the same function, so both platforms agree.
struct ServerPlan: Decodable {
    let planId: String
    /// "stripe", "app_store", or "none".
    let source: String
    let status: String
    let expiresAt: Date?
    let artworkLimit: Int
    let familyLimit: Int
    let childrenLimit: Int

    enum CodingKeys: String, CodingKey {
        case planId = "plan_id"
        case source
        case status
        case expiresAt = "expires_at"
        case artworkLimit = "artwork_limit"
        case familyLimit = "family_limit"
        case childrenLimit = "children_limit"
    }

    var tier: PlanTier { PlanTier(rawValue: planId) ?? .free }
}

enum LimitKind {
    case artwork, child, family
}

/// A free-plan limit that stops a new addition. Existing data is never touched:
/// only the next artwork, child, or family is blocked, the same as the web.
struct LimitBlock: Identifiable, Equatable {
    let kind: LimitKind
    let limit: Int
    let current: Int

    var id: String { "\(kind)-\(limit)-\(current)" }

    var title: String {
        switch kind {
        case .artwork: return "Your gallery is full on the free plan"
        case .child: return "The free plan has room for \(limit) artist"
        case .family: return "The free plan includes \(limit) family"
        }
    }

    var message: String {
        switch kind {
        case .artwork:
            return "You've saved \(current) of \(limit) artworks. Everything you've saved stays. Upgrade to keep adding new ones."
        case .child:
            return "Upgrade to add more artist profiles. The ones you have stay as they are."
        case .family:
            return "Upgrade to Pro to create more families. You can still join families you're invited to."
        }
    }
}

/// StoreKit 2 purchases, plus the account's plan and limits.
///
/// The plan a person is on comes from the server, so a Stripe subscriber on the
/// web is recognized here and an App Store subscriber is recognized on the web.
/// Every transaction StoreKit hands us (purchase, restore, renewal delivered
/// through Transaction.updates) is sent to /api/app-store/verify as the signed
/// JWS, where Apple's signature is checked and the entitlement recorded.
@MainActor
final class StoreManager: ObservableObject {
    static let shared = StoreManager()

    /// Keep in sync with lib/app-store/entitlements.ts and KidCanvas.storekit.
    static let productIDs: [String] = [
        "kidcanvas.family.monthly",
        "kidcanvas.family.yearly",
        "kidcanvas.pro.monthly",
        "kidcanvas.pro.yearly",
    ]

    static func tier(forProductID id: String) -> PlanTier? {
        if id.hasPrefix("kidcanvas.family.") { return .family }
        if id.hasPrefix("kidcanvas.pro.") { return .pro }
        return nil
    }

    @Published private(set) var products: [Product] = []
    @Published private(set) var serverPlan: ServerPlan?
    /// Best plan this device holds a verified StoreKit entitlement for, for the
    /// signed-in user.
    @Published private(set) var storeKitTier: PlanTier = .free
    @Published private(set) var isPurchasing = false
    @Published var lastError: String?

    private var updatesTask: Task<Void, Never>?
    private var syncedUserID: UUID?

    private init() {
        // Started at launch, before sign-in, as Apple recommends: a renewal or
        // Ask to Buy approval can arrive at any moment and is otherwise missed.
        updatesTask = Task { [weak self] in
            for await update in Transaction.updates {
                await self?.handle(update)
            }
        }
    }

    deinit { updatesTask?.cancel() }

    private var auth: AuthManager { AuthManager.shared }

    // MARK: - Plan

    /// The plan limits apply at: the better of what the server says and what
    /// StoreKit on this device says. StoreKit counts so that a purchase made a
    /// moment ago, or while the server was unreachable, is honored right away;
    /// the server copy catches up on the next verify.
    var effectiveTier: PlanTier { max(serverPlan?.tier ?? .free, storeKitTier) }

    var effectiveLimits: PlanLimits {
        if let plan = serverPlan, plan.tier >= storeKitTier {
            return PlanLimits(
                artworks: plan.artworkLimit,
                children: plan.childrenLimit,
                families: plan.familyLimit
            )
        }
        return effectiveTier.fallbackLimits
    }

    /// Where the current plan is billed, for the Settings row.
    var billedByStripe: Bool {
        serverPlan?.source == "stripe" && (serverPlan?.tier ?? .free) >= storeKitTier
    }

    /// Call after sign-in. Loads products, re-sends this device's entitlements
    /// to the server once per signed-in user (repairing any verify call that
    /// failed earlier), then reads the plan.
    func start() async {
        guard let userID = auth.currentUser?.id else { return }
        if products.isEmpty { await loadProducts() }
        if syncedUserID != userID {
            syncedUserID = userID
            await syncEntitlements()
        }
        await refreshPlan()
    }

    func reset() {
        serverPlan = nil
        storeKitTier = .free
        syncedUserID = nil
    }

    func refreshPlan() async {
        guard let userID = auth.currentUser?.id else { return }
        do {
            let rows: [ServerPlan] = try await auth.client
                .rpc("get_user_plan", params: ["target_user_id": userID.uuidString])
                .execute()
                .value
            serverPlan = rows.first
        } catch {
            // Keep the last known plan. Before migration 014 is applied this
            // fails every time, and the app behaves as free plus StoreKit.
            print("get_user_plan failed: \(error)")
        }
    }

    /// Nil when the addition is allowed; otherwise what to tell the person.
    /// Counts the same way lib/subscription.ts does: artworks and children per
    /// family, families as the memberships this user holds.
    func limitBlock(for kind: LimitKind, familyId: UUID?) async -> LimitBlock? {
        await refreshPlan()
        let limits = effectiveLimits
        let limit: Int
        switch kind {
        case .artwork: limit = limits.artworks
        case .child: limit = limits.children
        case .family: limit = limits.families
        }
        if limit < 0 { return nil }

        do {
            let current: Int
            switch kind {
            case .artwork:
                guard let familyId else { return nil }
                current = try await auth.client
                    .from("artworks")
                    .select("id", head: true, count: .exact)
                    .eq("family_id", value: familyId.uuidString)
                    .execute()
                    .count ?? 0
            case .child:
                guard let familyId else { return nil }
                current = try await auth.client
                    .from("children")
                    .select("id", head: true, count: .exact)
                    .eq("family_id", value: familyId.uuidString)
                    .execute()
                    .count ?? 0
            case .family:
                guard let userID = auth.currentUser?.id else { return nil }
                current = try await auth.client
                    .from("family_members")
                    .select("id", head: true, count: .exact)
                    .eq("user_id", value: userID.uuidString)
                    .execute()
                    .count ?? 0
            }
            return current < limit ? nil : LimitBlock(kind: kind, limit: limit, current: current)
        } catch {
            // A failed count lets the addition through. Blocking a parent
            // because of a network blip is worse than one extra artwork.
            print("Limit count failed: \(error)")
            return nil
        }
    }

    // MARK: - StoreKit

    func loadProducts() async {
        do {
            let loaded = try await Product.products(for: Self.productIDs)
            // Family before Pro, monthly before yearly.
            products = loaded.sorted { a, b in
                let ta = Self.tier(forProductID: a.id) ?? .free
                let tb = Self.tier(forProductID: b.id) ?? .free
                if ta != tb { return ta < tb }
                return a.price < b.price
            }
        } catch {
            lastError = "Couldn't load plans from the App Store. Check your connection and try again."
        }
    }

    func purchase(_ product: Product) async {
        guard let userID = auth.currentUser?.id else { return }
        isPurchasing = true
        lastError = nil
        defer { isPurchasing = false }

        do {
            // appAccountToken ties the purchase to this KidCanvas account, so
            // App Store Server Notifications (renewals, refunds) map back to it
            // even when the app is closed.
            let result = try await product.purchase(options: [.appAccountToken(userID)])
            switch result {
            case .success(let verification):
                await handle(verification)
            case .pending:
                // Ask to Buy or a bank check. The approval arrives later on
                // Transaction.updates.
                lastError = "Your purchase is waiting for approval. It will apply as soon as it goes through."
            case .userCancelled:
                break
            @unknown default:
                break
            }
        } catch {
            lastError = error.localizedDescription
        }
    }

    /// Restore: required by App Review, and how someone gets their plan back
    /// on a new device.
    func restore() async {
        lastError = nil
        do {
            try await AppStore.sync()
        } catch {
            lastError = "Couldn't reach the App Store to restore. Try again in a moment."
            return
        }
        await syncEntitlements()
        await refreshPlan()
        if effectiveTier == .free && lastError == nil {
            lastError = "No active subscription was found for this Apple ID."
        }
    }

    /// Sends every current entitlement to the server and recomputes the local
    /// tier.
    private func syncEntitlements() async {
        for await result in Transaction.currentEntitlements {
            await verifyWithServer(result)
        }
        await recomputeStoreKitTier()
    }

    private func handle(_ result: VerificationResult<Transaction>) async {
        guard case .verified(let transaction) = result else {
            // StoreKit could not verify it on device either. Leave it
            // unfinished and grant nothing.
            return
        }
        guard auth.currentUser != nil else {
            // Nobody signed in to attach it to. Unfinished transactions are
            // delivered again on the next launch.
            return
        }
        await verifyWithServer(result)
        await transaction.finish()
        // Recount rather than max() in the new tier: a refund or revocation
        // arrives here too, and has to be able to lower the tier.
        await recomputeStoreKitTier()
        await refreshPlan()
    }

    /// The best tier among this device's current entitlements that belong to
    /// the signed-in user. Local only; no server calls.
    private func recomputeStoreKitTier() async {
        guard let userID = auth.currentUser?.id else {
            storeKitTier = .free
            return
        }
        var best: PlanTier = .free
        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result,
                  transaction.revocationDate == nil,
                  transaction.appAccountToken == nil || transaction.appAccountToken == userID,
                  let tier = Self.tier(forProductID: transaction.productID) else { continue }
            best = max(best, tier)
        }
        storeKitTier = best
    }

    /// Posts the signed transaction to the server, which checks Apple's
    /// signature and records the entitlement (or the refund, or the expiry).
    private func verifyWithServer(_ result: VerificationResult<Transaction>) async {
        guard case .verified(let transaction) = result,
              let userID = auth.currentUser?.id,
              Self.tier(forProductID: transaction.productID) != nil else { return }

        // A subscription bought while signed in to another KidCanvas account
        // is that account's. The server refuses it, and
        // recomputeStoreKitTier() skips it locally, so one Apple ID cannot
        // unlock every account on the device.
        if let token = transaction.appAccountToken, token != userID {
            lastError = "This App Store subscription belongs to a different KidCanvas account. Sign in with that account to use it."
            return
        }

        do {
            var request = URLRequest(url: Config.apiBaseURL.appendingPathComponent("api/app-store/verify"))
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            let token = try await auth.client.auth.session.accessToken
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            request.httpBody = try JSONEncoder().encode(["signedTransaction": result.jwsRepresentation])
            let (_, response) = try await URLSession.shared.data(for: request)
            if let http = response as? HTTPURLResponse, http.statusCode == 409 {
                lastError = "This App Store subscription belongs to a different KidCanvas account. Sign in with that account to use it."
            }
        } catch {
            // The server copy is repaired on the next start(); StoreKit's own
            // verification still counts locally in the meantime.
            print("App Store verify failed: \(error)")
        }
    }
}
