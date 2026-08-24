import SwiftUI

/// First-run guide, shown once when a family has no artists yet.
///
/// A brand-new account previously landed on an empty gallery with no explanation.
/// Worse, the upload sheet's Save button requires a selected artist, and with no
/// artists the picker is empty -- so someone could scan a drawing, type a title
/// and a story, and find Save permanently greyed out with nothing telling them
/// why. This explains the three steps and sends them at the one thing that has to
/// happen first.
struct OnboardingView: View {
    @EnvironmentObject var authManager: AuthManager
    @Environment(\.dismiss) private var dismiss
    @State private var showAddChild = false

    var body: some View {
        ScrollView {
            VStack(spacing: 28) {
                VStack(spacing: 12) {
                    Image(systemName: "paintpalette.fill")
                        .font(.system(size: 52))
                        .foregroundStyle(
                            LinearGradient(colors: [.pink, .purple],
                                           startPoint: .topLeading,
                                           endPoint: .bottomTrailing)
                        )

                    Text("Welcome to KidCanvas")
                        .font(.title.bold())
                        .multilineTextAlignment(.center)

                    Text("Their art grows up fast. Here's how to keep it.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 32)

                VStack(alignment: .leading, spacing: 20) {
                    OnboardingStep(
                        number: 1,
                        icon: "person.crop.circle.badge.plus",
                        title: "Add an artist",
                        detail: "A name, and a birthday if you'd like ages on each piece. Kids never need an account of their own."
                    )
                    OnboardingStep(
                        number: 2,
                        icon: "camera.fill",
                        title: "Scan the artwork",
                        detail: "The scanner finds the page and squares it up. Or pick a photo you already took."
                    )
                    OnboardingStep(
                        number: 3,
                        icon: "text.bubble.fill",
                        title: "Write down what they said",
                        detail: "\"It's a rainbow that ate a dinosaur.\" That's the part you'll forget by next week, and the part you'll want back."
                    )
                }
                .padding(.horizontal, 4)

                VStack(spacing: 12) {
                    Button {
                        showAddChild = true
                    } label: {
                        Text("Add your first artist")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .background(
                                LinearGradient(colors: [.pink, .purple],
                                               startPoint: .leading,
                                               endPoint: .trailing)
                            )
                            .cornerRadius(16)
                    }

                    Button("I'll do this later") { dismiss() }
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            .padding(24)
        }
        .background(Color.paperBackground.ignoresSafeArea())
        .sheet(isPresented: $showAddChild) {
            AddChildView()
                .environmentObject(authManager)
        }
        // Once they have an artist the guide has done its job.
        .onChange(of: authManager.children.count) { _, count in
            if count > 0 { dismiss() }
        }
    }
}

private struct OnboardingStep: View {
    let number: Int
    let icon: String
    let title: String
    let detail: String

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            ZStack {
                Circle()
                    .fill(Color.subtleFill)
                    .frame(width: 40, height: 40)
                Image(systemName: icon)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.pink)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("\(number). \(title)")
                    .font(.subheadline.bold())
                Text(detail)
                    .font(.footnote)
                    .foregroundColor(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

#Preview {
    OnboardingView()
        .environmentObject(AuthManager.shared)
}
