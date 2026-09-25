import SwiftUI
import StoreKit

/// Plans sheet, shown when a free limit is hit and from Settings.
///
/// Written to App Review 3.1.2: every option shows its name, length and the
/// price StoreKit reports for this storefront (never a hardcoded or web price),
/// the auto-renew terms sit above the button, and Restore, Terms of Use and the
/// Privacy Policy are all on the sheet. Nothing is preselected to the most
/// expensive option, there is no countdown, and Close is always visible.
struct PaywallView: View {
    @EnvironmentObject var store: StoreManager
    @Environment(\.dismiss) private var dismiss

    /// The limit that brought the person here, if any.
    var block: LimitBlock?

    @State private var selectedID: String?
    @State private var isRestoring = false

    private var selected: Product? {
        store.products.first { $0.id == selectedID }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    header

                    if store.products.isEmpty {
                        loadingOrError
                    } else {
                        ForEach([PlanTier.family, .pro], id: \.self) { tier in
                            tierCard(tier)
                        }

                        if let error = store.lastError {
                            Text(error)
                                .font(.footnote)
                                .foregroundColor(.red)
                                .multilineTextAlignment(.center)
                        }

                        subscribeButton
                        renewalTerms
                    }

                    footerLinks
                }
                .padding()
            }
            .background(Color.paperBackground.ignoresSafeArea())
            .navigationTitle("Plans")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }
                }
            }
        }
        .task {
            store.lastError = nil
            if store.products.isEmpty { await store.loadProducts() }
            if selectedID == nil {
                // Family monthly: the cheapest paid option, and enough for
                // every limit the free plan has except a second family.
                let preferredTier: PlanTier = block?.kind == .family ? .pro : .family
                selectedID = options(for: preferredTier).first?.id
            }
        }
        .onChange(of: store.effectiveTier) { _, tier in
            // Purchase or restore went through; nothing left to decide here.
            if tier > .free { dismiss() }
        }
    }

    // MARK: - Sections

    private var header: some View {
        VStack(spacing: 10) {
            Image(systemName: "paintpalette.fill")
                .font(.system(size: 44))
                .foregroundStyle(
                    LinearGradient(colors: [.pink, .purple], startPoint: .leading, endPoint: .trailing)
                )
            Text(block?.title ?? "Keep every masterpiece")
                .font(.title2.bold())
                .multilineTextAlignment(.center)
            Text(block?.message ?? "The free plan holds 50 artworks and 1 artist. A plan removes those limits.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 8)
    }

    @ViewBuilder
    private var loadingOrError: some View {
        // Spin only while a request is genuinely in flight. StoreKit returns an
        // empty array rather than throwing for product ids the store does not
        // know, so "no products and no error" used to spin forever.
        if store.isLoadingProducts && store.lastError == nil {
            VStack(spacing: 12) {
                ProgressView()
                Text("Loading plans\u{2026}")
                    .font(.footnote)
                    .foregroundColor(.secondary)
            }
            .padding(.vertical, 24)
        } else if let error = store.lastError {
            VStack(spacing: 12) {
                Text(error)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                Button("Try again") {
                    Task {
                        store.lastError = nil
                        await store.loadProducts()
                    }
                }
            }
            .padding(.vertical, 24)
        } else {
            VStack(spacing: 12) {
                Text("No plans are available right now. Please try again in a moment.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                Button("Try again") {
                    Task { await store.loadProducts() }
                }
            }
            .padding(.vertical, 24)
        }
    }

    private func tierCard(_ tier: PlanTier) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(tier.displayName)
                .font(.headline)
            // Same wording as PLANS in lib/stripe.ts, so the two platforms
            // describe the plans identically.
            ForEach(features(for: tier), id: \.self) { feature in
                Label(feature, systemImage: "checkmark")
                    .font(.subheadline)
                    .foregroundColor(.primary)
            }
            ForEach(options(for: tier), id: \.id) { product in
                optionRow(product, tier: tier)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.cardSurface)
        .cornerRadius(16)
    }

    private func optionRow(_ product: Product, tier: PlanTier) -> some View {
        let isSelected = product.id == selectedID
        return Button {
            selectedID = product.id
        } label: {
            HStack {
                Image(systemName: isSelected ? "largecircle.fill.circle" : "circle")
                    .foregroundColor(isSelected ? .pink : .secondary)
                VStack(alignment: .leading, spacing: 2) {
                    Text(periodName(product))
                        .font(.subheadline.bold())
                    Text("\(product.displayPrice) per \(periodUnit(product))")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                Spacer()
                if let savings = yearlySavings(product, tier: tier) {
                    Text("Save \(savings)%")
                        .font(.caption.bold())
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.pink.opacity(0.15))
                        .foregroundColor(.pink)
                        .cornerRadius(8)
                }
            }
            .padding(12)
            .background(isSelected ? Color.pink.opacity(0.08) : Color.subtleFill)
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }

    private var subscribeButton: some View {
        Button {
            guard let product = selected else { return }
            Task { await store.purchase(product) }
        } label: {
            HStack {
                if store.isPurchasing {
                    ProgressView().tint(.white)
                } else if let product = selected {
                    Text("Subscribe for \(product.displayPrice) per \(periodUnit(product))")
                } else {
                    Text("Choose a plan")
                }
            }
            .font(.headline)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(
                LinearGradient(
                    colors: selected == nil ? [.gray] : [.pink, .purple],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .foregroundColor(.white)
            .cornerRadius(16)
        }
        .disabled(selected == nil || store.isPurchasing)
    }

    private var renewalTerms: some View {
        Text("Payment is charged to your Apple ID when you confirm. The subscription renews automatically at the same price and length unless you cancel at least 24 hours before the current period ends. You can manage or cancel it anytime in your App Store account settings. Your saved artwork stays yours if you cancel.")
            .font(.caption)
            .foregroundColor(.secondary)
            .multilineTextAlignment(.center)
    }

    private var footerLinks: some View {
        VStack(spacing: 12) {
            Button {
                Task {
                    isRestoring = true
                    await store.restore()
                    isRestoring = false
                }
            } label: {
                if isRestoring {
                    ProgressView()
                } else {
                    Text("Restore purchases")
                }
            }
            .font(.subheadline.bold())
            .disabled(isRestoring)

            HStack(spacing: 20) {
                Link("Terms of Use", destination: Config.termsURL)
                Link("Privacy Policy", destination: Config.privacyPolicyURL)
            }
            .font(.footnote)
        }
        .padding(.bottom, 8)
    }

    // MARK: - Helpers

    private func options(for tier: PlanTier) -> [Product] {
        store.products
            .filter { StoreManager.tier(forProductID: $0.id) == tier }
            .sorted { periodMonths($0) < periodMonths($1) }
    }

    private func features(for tier: PlanTier) -> [String] {
        switch tier {
        case .free: return ["50 artworks", "1 artist profile", "1 family"]
        case .family: return ["Unlimited artworks", "Unlimited artist profiles", "1 family"]
        case .pro: return ["Unlimited artworks", "Unlimited artist profiles", "Unlimited families, so grandparents and caregivers get their own"]
        }
    }

    private func periodMonths(_ product: Product) -> Int {
        guard let period = product.subscription?.subscriptionPeriod else { return 0 }
        switch period.unit {
        case .year: return 12 * period.value
        case .month: return period.value
        default: return 0
        }
    }

    private func periodName(_ product: Product) -> String {
        switch periodMonths(product) {
        case 12: return "Yearly"
        case 1: return "Monthly"
        default: return product.displayName
        }
    }

    private func periodUnit(_ product: Product) -> String {
        switch periodMonths(product) {
        case 12: return "year"
        case 1: return "month"
        default: return "period"
        }
    }

    /// Percent saved by paying yearly, computed from the two StoreKit prices
    /// in this storefront. Rounded down so the badge never overstates it.
    private func yearlySavings(_ product: Product, tier: PlanTier) -> Int? {
        guard periodMonths(product) == 12,
              let monthly = options(for: tier).first(where: { periodMonths($0) == 1 }) else { return nil }
        let twelveMonths = NSDecimalNumber(decimal: monthly.price * 12).doubleValue
        let yearly = NSDecimalNumber(decimal: product.price).doubleValue
        guard twelveMonths > 0 else { return nil }
        let percent = Int(((twelveMonths - yearly) / twelveMonths * 100).rounded(.down))
        return percent > 0 ? percent : nil
    }
}

#Preview {
    PaywallView(block: LimitBlock(kind: .artwork, limit: 50, current: 50))
        .environmentObject(StoreManager.shared)
}
