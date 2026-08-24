import SwiftUI

/// App settings, reached from the gear on the Profile tab.
///
/// Profile had accumulated everything -- links, sign out, account deletion --
/// with no room for actual preferences. This screen holds the toggles and the
/// destructive actions, so Profile can stay about the family itself.
struct SettingsView: View {
    @EnvironmentObject var authManager: AuthManager

    /// "system" | "light" | "dark", applied at the app root.
    @AppStorage("appearance") private var appearance = "system"
    /// Local notification nudges (MemoryPrompts). Off by default: notifications
    /// are opt-in, and the toggle is what asks for permission.
    @AppStorage("memoryPromptsEnabled") private var memoryPromptsEnabled = false

    @State private var showSignOutAlert = false
    @State private var showRenameFamily = false
    @State private var newFamilyName = ""
    @State private var showDeleteFamily = false
    @State private var familyActionError: String?
    @State private var myRole: String?

    private var isOwner: Bool { myRole == "owner" }

    var body: some View {
        List {
            Section("Appearance") {
                Picker("Theme", selection: $appearance) {
                    Text("System").tag("system")
                    Text("Light").tag("light")
                    Text("Dark").tag("dark")
                }
                .pickerStyle(.segmented)
            }

            Section {
                Toggle("Memory prompts", isOn: $memoryPromptsEnabled)
                    .onChange(of: memoryPromptsEnabled) { _, enabled in
                        Task {
                            if enabled {
                                // Passing nil anchors the "quiet spell" nudge a
                                // week from now; the birthday nudges come from
                                // the child profiles.
                                await MemoryPrompts.reschedule(
                                    lastUpload: nil,
                                    children: authManager.children
                                )
                            } else {
                                MemoryPrompts.cancelAll()
                            }
                        }
                    }
            } header: {
                Text("Reminders")
            } footer: {
                Text("A nudge if it's been a week since the last artwork, and one before each child's birthday. Scheduled on this device — nothing leaves your phone.")
            }

            if let family = authManager.currentFamily {
                Section {
                    // Not LabeledContent: its value renders secondary-gray and
                    // shares one row with the label, so a real family name came
                    // out cramped and hard to read.
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Family name")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(family.name)
                            .font(.body.weight(.semibold))
                            .foregroundColor(.primary)
                    }
                    .padding(.vertical, 2)

                    if isOwner {
                        Button("Rename family") {
                            newFamilyName = family.name
                            showRenameFamily = true
                        }

                        Button("Delete family…", role: .destructive) {
                            showDeleteFamily = true
                        }
                    }
                } header: {
                    Text("Family")
                } footer: {
                    if isOwner {
                        Text("Deleting the family permanently removes every child profile, artwork, story, and comment for everyone in it. Your account stays; a fresh empty family is created.")
                    } else {
                        Text("Only the family owner can rename or delete the family.")
                    }
                }
            }

            Section("Support") {
                Link(destination: Config.privacyPolicyURL) {
                    SettingsRow(icon: "lock.fill", title: "Privacy Policy", color: .blue)
                }
                Link(destination: Config.supportURL) {
                    SettingsRow(icon: "questionmark.circle.fill", title: "Help & Support", color: .green)
                }
            }

            Section("Account") {
                Button {
                    showSignOutAlert = true
                } label: {
                    SettingsRow(icon: "rectangle.portrait.and.arrow.right", title: "Sign Out", color: .orange)
                }

                DeleteAccountSection(authManager: authManager)
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
            }
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
        .scrollContentBackground(.hidden)
        .background(Color.paperBackground.ignoresSafeArea())
        .task {
            if let family = authManager.currentFamily {
                myRole = await ArtworkService(client: authManager.client)
                    .familyRole(familyId: family.id)
            }
        }
        .alert("Sign Out", isPresented: $showSignOutAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Sign Out", role: .destructive) {
                Task { try? await authManager.signOut() }
            }
        } message: {
            Text("You can sign back in anytime.")
        }
        .alert("Rename family", isPresented: $showRenameFamily) {
            TextField("Family name", text: $newFamilyName)
            Button("Cancel", role: .cancel) {}
            Button("Save") {
                let name = newFamilyName.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !name.isEmpty else { return }
                Task {
                    do { try await authManager.renameFamily(name) }
                    catch { familyActionError = error.localizedDescription }
                }
            }
        }
        .alert("Delete this family?", isPresented: $showDeleteFamily) {
            Button("Cancel", role: .cancel) {}
            Button("Delete Everything", role: .destructive) {
                Task {
                    do { try await authManager.deleteFamily() }
                    catch { familyActionError = error.localizedDescription }
                }
            }
        } message: {
            Text("Every child profile, artwork, story, comment, and member is permanently removed — for everyone in the family. This cannot be undone.")
        }
        .alert("Couldn't do that",
               isPresented: .constant(familyActionError != nil),
               actions: { Button("OK") { familyActionError = nil } },
               message: { Text(familyActionError ?? "") })
    }
}

#Preview {
    NavigationStack {
        SettingsView()
            .environmentObject(AuthManager.shared)
    }
}
