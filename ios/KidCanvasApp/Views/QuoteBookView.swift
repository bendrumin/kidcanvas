import SwiftUI

/// "The things Emma said, 2026": a printable book of what a child said about
/// their drawings, one quote per page. Built on the phone with
/// UIGraphicsPDFRenderer and handed to the share sheet, which already knows how
/// to print, AirDrop, and email a PDF.
struct QuoteBookView: View {
    @EnvironmentObject var authManager: AuthManager

    /// "all", "custom", or a four-digit year. A string rather than an enum so the
    /// year list can come straight from the data.
    @State private var period = String(Calendar.current.component(.year, from: Date()))
    @State private var childId: UUID?
    @State private var customFrom = Calendar.current.date(from: DateComponents(
        year: Calendar.current.component(.year, from: Date()), month: 1, day: 1)) ?? Date()
    @State private var customTo = Date()
    @State private var paper: QuoteBookRenderer.Paper = .letter

    @State private var storied: [Artwork] = []
    @State private var isLoading = false
    @State private var loadFailed = false
    @State private var isMaking = false
    @State private var bookURL: URL?
    @State private var errorMessage: String?

    private var service: ArtworkService { ArtworkService(client: authManager.client) }
    private var currentYear: String { String(Calendar.current.component(.year, from: Date())) }

    private var child: Child? {
        authManager.children.first { $0.id == childId } ?? authManager.children.first
    }

    private var years: [String] {
        var set: Set<String> = [currentYear]
        for artwork in QuoteBookRenderer.selectArtworks(storied, from: nil, to: nil) {
            set.insert(String(Calendar.current.component(.year, from: artwork.createdDate)))
        }
        return set.sorted(by: >)
    }

    private var range: (from: Date?, to: Date?) {
        switch period {
        case "all":
            return (nil, nil)
        case "custom":
            return (customFrom, customTo)
        default:
            let cal = Calendar.current
            guard let year = Int(period),
                  let start = cal.date(from: DateComponents(year: year, month: 1, day: 1)),
                  let end = cal.date(from: DateComponents(year: year, month: 12, day: 31)) else {
                return (nil, nil)
            }
            return (start, end)
        }
    }

    private var included: [Artwork] {
        QuoteBookRenderer.selectArtworks(storied, from: range.from, to: range.to)
    }

    private var periodLabel: String {
        switch period {
        case "custom":
            let from = customFrom.formatted(date: .long, time: .omitted)
            let to = customTo.formatted(date: .long, time: .omitted)
            return "\(from) to \(to)"
        case "all":
            let cal = Calendar.current
            guard let first = included.first, let last = included.last else { return "Every story so far" }
            let a = cal.component(.year, from: first.createdDate)
            let b = cal.component(.year, from: last.createdDate)
            return a == b ? String(a) : "\(a) to \(b)"
        default:
            return period
        }
    }

    private var emptyMessage: String {
        let name = child?.name ?? "This artist"
        switch period {
        case "all": return "\(name) has no stories yet. Add one from any artwork."
        case "custom": return "\(name) has no stories from those dates yet. Add one from any artwork."
        default: return "\(name) has no stories yet in \(period). Add one from any artwork."
        }
    }

    private var rangeIsBackwards: Bool {
        period == "custom" && Calendar.current.startOfDay(for: customFrom) > Calendar.current.startOfDay(for: customTo)
    }

    var body: some View {
        ZStack {
            Color.paperBackground.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 20) {
                    header

                    if authManager.children.isEmpty {
                        Text("Add an artist first, then their stories can go in a book.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding()
                    } else {
                        optionsCard
                        summaryCard
                        actionButton

                        if let errorMessage {
                            Text(errorMessage)
                                .font(.caption)
                                .foregroundColor(.red)
                                .multilineTextAlignment(.center)
                        }
                    }
                }
                .padding()
                // Clears the floating tab bar.
                .padding(.bottom, 70)
            }
        }
        .navigationTitle("Quote book")
        .navigationBarTitleDisplayMode(.inline)
        .task(id: child?.id) { await load() }
        // Any change to what's in the book makes an already-built PDF stale.
        .onChange(of: period) { bookURL = nil }
        .onChange(of: childId) { bookURL = nil }
        .onChange(of: paper) { bookURL = nil }
        .onChange(of: customFrom) { bookURL = nil }
        .onChange(of: customTo) { bookURL = nil }
    }

    private var header: some View {
        VStack(spacing: 8) {
            Image(systemName: "quote.opening")
                .font(.system(size: 36, weight: .bold))
                .foregroundStyle(LinearGradient(colors: [.pink, .purple],
                                                startPoint: .topLeading, endPoint: .bottomTrailing))
            Text("The things \(child?.name ?? "they") said")
                .font(.system(.title2, design: .serif).bold())
                .multilineTextAlignment(.center)
            Text("One page for each story, their words set large with the drawing underneath. A lovely gift for grandparents.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 8)
    }

    private var optionsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            if authManager.children.count > 1 {
                LabeledContent("Artist") {
                    Picker("Artist", selection: Binding(
                        get: { child?.id },
                        set: { childId = $0 }
                    )) {
                        ForEach(authManager.children) { c in
                            Text(c.name).tag(Optional(c.id))
                        }
                    }
                    .tint(.pink)
                }
                Divider()
            }

            LabeledContent("Which stories") {
                Picker("Which stories", selection: $period) {
                    ForEach(years, id: \.self) { Text($0).tag($0) }
                    Text("All years").tag("all")
                    Text("Choose dates").tag("custom")
                }
                .tint(.pink)
            }

            if period == "custom" {
                DatePicker("From", selection: $customFrom, displayedComponents: .date)
                DatePicker("To", selection: $customTo, displayedComponents: .date)
            }

            Divider()

            LabeledContent("Paper size") {
                Picker("Paper size", selection: $paper) {
                    ForEach(QuoteBookRenderer.Paper.allCases) { Text($0.label).tag($0) }
                }
                .tint(.pink)
            }
        }
        .font(.subheadline)
        .padding()
        .background(Color.cardSurface)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
    }

    /// Says what will be in the book before anyone waits for it to be made.
    private var summaryCard: some View {
        VStack(alignment: .leading, spacing: 4) {
            if isLoading {
                HStack(spacing: 8) {
                    ProgressView().tint(.pink)
                    Text("Finding \(child.map { "\($0.name)'s" } ?? "the") stories...")
                        .foregroundColor(.secondary)
                }
            } else if loadFailed {
                Text("Couldn't load the stories. Check your connection and try again.")
                    .foregroundColor(.red)
            } else if rangeIsBackwards {
                Text("The start date is after the end date.")
                    .foregroundColor(.secondary)
            } else if included.isEmpty {
                Text(emptyMessage)
                    .foregroundColor(.secondary)
            } else {
                Text("The things \(child?.name ?? "") said, \(periodLabel)")
                    .fontWeight(.semibold)
                Text("\(included.count) \(included.count == 1 ? "story" : "stories"), one per page. Artwork without a story is left out.")
                    .foregroundColor(.secondary)
            }
        }
        .font(.subheadline)
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.cardSurface)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
    }

    @ViewBuilder
    private var actionButton: some View {
        if let bookURL {
            ShareLink(item: bookURL) {
                Label("Share or print", systemImage: "square.and.arrow.up")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .background(LinearGradient(colors: [.pink, .purple],
                                               startPoint: .leading, endPoint: .trailing))
                    .foregroundColor(.white)
                    .cornerRadius(16)
            }
        } else {
            Button(action: make) {
                HStack {
                    if isMaking {
                        ProgressView().tint(.white)
                        Text("Making the book...")
                    } else {
                        Image(systemName: "book.closed")
                        Text("Make the book")
                    }
                }
                .font(.headline)
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(LinearGradient(colors: [.pink, .purple],
                                           startPoint: .leading, endPoint: .trailing))
                .foregroundColor(.white)
                .cornerRadius(16)
                .opacity(canMake ? 1 : 0.5)
            }
            .disabled(!canMake)
        }
    }

    private var canMake: Bool {
        !isMaking && !isLoading && !included.isEmpty && !rangeIsBackwards
    }

    private func load() async {
        guard let child else { return }
        isLoading = true
        loadFailed = false
        do {
            storied = try await service.storiedArtworks(childId: child.id)
        } catch {
            storied = []
            loadFailed = true
        }
        isLoading = false
    }

    private func make() {
        guard let child else { return }
        let artworks = included
        let label = periodLabel
        let paper = paper
        isMaking = true
        errorMessage = nil
        Task {
            let pages = await QuoteBookRenderer.loadPages(for: artworks)
            // Rendering a long book takes a moment; keep it off the main thread.
            let data = await Task.detached(priority: .userInitiated) {
                QuoteBookRenderer.render(pages: pages, childName: child.name, birthDate: child.birthDate,
                                         periodLabel: label, paper: paper)
            }.value
            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent(QuoteBookRenderer.fileName(childName: child.name, periodLabel: label))
            do {
                try data.write(to: url, options: .atomic)
                bookURL = url
            } catch {
                errorMessage = "Couldn't save the book. Try again."
            }
            isMaking = false
        }
    }
}

#Preview {
    NavigationStack {
        QuoteBookView()
            .environmentObject(AuthManager.shared)
    }
}
