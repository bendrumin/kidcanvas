import SwiftUI

/// Grandparents are the second audience: they get a code, not an account setup
/// walkthrough. One code, single use, expires in a week (enforced by the schema).
struct FamilyInviteView: View {
    @EnvironmentObject var authManager: AuthManager
    @Environment(\.dismiss) private var dismiss

    @State private var code: String?
    @State private var isWorking = false
    @State private var errorMessage: String?
    @State private var joinCode = ""
    @State private var joinMessage: String?

    private var service: ArtworkService {
        ArtworkService(client: authManager.client)
    }

    var body: some View {
        ZStack {
            Color.paperBackground.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 20) {
                    InviteHeader()

                    if let code {
                        InviteCodeCard(code: code, familyName: authManager.currentFamily?.name)
                    } else {
                        Button(action: generate) {
                            HStack {
                                if isWorking {
                                    ProgressView().tint(.white)
                                } else {
                                    Image(systemName: "person.badge.plus")
                                    Text("Create an invite code")
                                }
                            }
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .background(
                                LinearGradient(colors: [.pink, .purple],
                                               startPoint: .leading, endPoint: .trailing)
                            )
                            .foregroundColor(.white)
                            .cornerRadius(16)
                        }
                        .disabled(isWorking)
                    }

                    if let errorMessage {
                        Text(errorMessage)
                            .font(.caption)
                            .foregroundColor(.red)
                            .multilineTextAlignment(.center)
                    }

                    Divider().padding(.vertical, 4)

                    JoinFamilySection(
                        joinCode: $joinCode,
                        message: joinMessage,
                        isWorking: isWorking,
                        onJoin: join
                    )
                }
                .padding()
                .padding(.bottom, 80)
            }
        }
        .navigationTitle("Family")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func generate() {
        guard let familyId = authManager.currentFamily?.id else { return }
        isWorking = true
        errorMessage = nil
        Task {
            do {
                code = try await service.createInvite(familyId: familyId)
            } catch {
                errorMessage = error.localizedDescription
            }
            isWorking = false
        }
    }

    private func join() {
        let trimmed = joinCode.trimmed
        guard !trimmed.isEmpty else { return }
        isWorking = true
        joinMessage = nil
        Task {
            do {
                try await service.redeemInvite(code: trimmed)
                await authManager.loadFamily()
                joinMessage = "You're in! Pull down on the gallery to refresh."
                joinCode = ""
            } catch {
                joinMessage = error.localizedDescription
            }
            isWorking = false
        }
    }
}

struct InviteHeader: View {
    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: "figure.2.and.child.holdinghands")
                .font(.system(size: 44))
                .foregroundStyle(
                    LinearGradient(colors: [.pink, .purple],
                                   startPoint: .topLeading, endPoint: .bottomTrailing)
                )
            Text("Invite the grandparents")
                .font(.title3.bold())
            Text("Share a code and they'll see every new drawing — no more texting photos one at a time.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 8)
    }
}

struct InviteCodeCard: View {
    let code: String
    let familyName: String?

    var body: some View {
        VStack(spacing: 12) {
            Text("Their code")
                .font(.caption)
                .foregroundColor(.secondary)
            Text(code)
                .font(.system(.title, design: .monospaced))
                .fontWeight(.bold)
                .tracking(4)
                .accessibilityLabel("Invite code: \(code.map(String.init).joined(separator: " "))")

            ShareLink(item: shareText) {
                Label("Share code", systemImage: "square.and.arrow.up")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
            }
            .buttonStyle(.bordered)

            Text("Single use, expires in 7 days.")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .background(Color.cardSurface)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.06), radius: 10, y: 4)
    }

    private var shareText: String {
        let family = familyName ?? "our family"
        return "Join \(family) on KidCanvas to see the kids' artwork. Download the app and enter code \(code)."
    }
}

struct JoinFamilySection: View {
    @Binding var joinCode: String
    let message: String?
    let isWorking: Bool
    let onJoin: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Have a code?")
                .font(.subheadline.bold())
                .foregroundColor(.secondary)

            HStack(spacing: 8) {
                TextField("Enter code", text: $joinCode)
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()
                    .font(.system(.body, design: .monospaced))
                    .padding()
                    .background(Color.cardSurface)
                    .cornerRadius(12)

                Button("Join", action: onJoin)
                    .buttonStyle(.borderedProminent)
                    .tint(.pink)
                    .disabled(joinCode.trimmed.isEmpty || isWorking)
            }

            if let message {
                Text(message)
                    .font(.caption)
                    .foregroundColor(message.hasPrefix("You're in") ? .green : .red)
            }
        }
    }
}
