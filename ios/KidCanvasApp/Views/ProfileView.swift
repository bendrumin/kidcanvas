import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var showSignOutAlert = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color.paperBackground
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Profile Header
                        VStack(spacing: 16) {
                            ZStack {
                                Circle()
                                    .fill(
                                        LinearGradient(
                                            colors: [.pink, .purple],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .frame(width: 100, height: 100)
                                
                                Text(authManager.currentUser?.fullName.prefix(1).uppercased() ?? "?")
                                    .font(.system(size: 40, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            
                            VStack(spacing: 4) {
                                Text(authManager.currentUser?.fullName ?? "User")
                                    .font(.title2.bold())
                                
                                Text(authManager.currentUser?.email ?? "")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical)
                        
                        // Family Section
                        if let family = authManager.currentFamily {
                            VStack(alignment: .leading, spacing: 16) {
                                HStack {
                                    Image(systemName: "house.fill")
                                        .foregroundColor(.pink)
                                    Text(family.name)
                                        .font(.headline)
                                    Spacer()
                                }
                                
                                Divider()
                                
                                Text("Children")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                
                                if authManager.children.isEmpty {
                                    Text("No children added yet")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                        .italic()
                                } else {
                                    ForEach(authManager.children) { child in
                                        ChildRow(child: child)
                                    }
                                }
                                
                                NavigationLink(destination: AddChildView()) {
                                    HStack {
                                        Image(systemName: "plus.circle.fill")
                                        Text("Add Child")
                                    }
                                    .font(.subheadline.bold())
                                    .foregroundColor(.pink)
                                }

                                Divider()

                                NavigationLink(destination: FamilyInviteView()) {
                                    HStack {
                                        Image(systemName: "person.2.badge.plus")
                                        Text("Invite family")
                                        Spacer()
                                        Image(systemName: "chevron.right")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                    .font(.subheadline.bold())
                                    .foregroundColor(.pink)
                                }
                            }
                            .padding()
                            .background(Color.cardSurface)
                            .cornerRadius(16)
                            .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
                        }
                        
                        if let family = authManager.currentFamily {
                            FamilyMembersCard(familyId: family.id, authManager: authManager)
                        }

                        SettingsLinksCard()

                        // Sign Out
                        Button(action: { showSignOutAlert = true }) {
                            HStack {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                Text("Sign Out")
                            }
                            .font(.headline)
                            .foregroundColor(.red)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(Color.cardSurface)
                            .cornerRadius(16)
                            .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
                        }
                        
                        DeleteAccountSection(authManager: authManager)

                        Text("KidCanvas v1.0")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(.top)
                    }
                    .padding()
                    // Clears the floating tab bar so Sign Out stays tappable.
                    .padding(.bottom, 70)
                }
            }
            .navigationTitle("Profile")
            .alert("Sign Out", isPresented: $showSignOutAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Sign Out", role: .destructive) {
                    Task {
                        try? await authManager.signOut()
                    }
                }
            } message: {
                Text("Are you sure you want to sign out?")
            }
        }
    }
}

struct ChildRow: View {
    let child: Child
    
    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(
                    LinearGradient(
                        colors: [.pink, .purple],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 40, height: 40)
                .overlay {
                    Text(child.initial)
                        .font(.headline.bold())
                        .foregroundColor(.white)
                }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(child.name)
                    .font(.subheadline.bold())
                
                if let birthDate = child.birthDate {
                    Text(ageString(from: birthDate))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
        }
    }
    
    private func ageString(from birthDate: Date) -> String {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month], from: birthDate, to: Date())
        
        if let years = components.year, years > 0 {
            return "\(years) year\(years == 1 ? "" : "s") old"
        } else if let months = components.month {
            return "\(months) month\(months == 1 ? "" : "s") old"
        }
        return ""
    }
}

struct SettingsLinksCard: View {
    var body: some View {
        VStack(spacing: 0) {
            Link(destination: Config.privacyPolicyURL) {
                SettingsRow(icon: "lock.fill", title: "Privacy Policy", color: .blue)
            }
            Divider().padding(.leading, 52)
            Link(destination: Config.supportURL) {
                SettingsRow(icon: "questionmark.circle.fill", title: "Help & Support", color: .green)
            }
        }
        .background(Color.cardSurface)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
    }
}

/// Required by App Store Guideline 5.1.1(v): an in-app way to permanently
/// delete the account, not just sign out.
struct DeleteAccountSection: View {
    let authManager: AuthManager

    @State private var showConfirm = false
    @State private var isDeleting = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 10) {
            Button(role: .destructive) {
                showConfirm = true
            } label: {
                HStack {
                    if isDeleting {
                        ProgressView().tint(.red)
                    } else {
                        Image(systemName: "trash")
                        Text("Delete Account")
                    }
                }
                .font(.subheadline.bold())
                .foregroundColor(.red)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Color.cardSurface)
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
            }
            .disabled(isDeleting)

            Text("Permanently deletes your account, your family's gallery, and every artwork you've saved.")
                .font(.caption2)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundColor(.red)
                    .multilineTextAlignment(.center)
            }
        }
        .alert("Delete Account?", isPresented: $showConfirm) {
            Button("Cancel", role: .cancel) {}
            Button("Delete Everything", role: .destructive) {
                deleteAccount()
            }
        } message: {
            Text("This permanently deletes your account, your family, every child profile, and all saved artwork. This cannot be undone.")
        }
    }

    private func deleteAccount() {
        Task {
            isDeleting = true
            errorMessage = nil
            do {
                try await authManager.deleteAccount()
            } catch {
                errorMessage = error.localizedDescription
            }
            isDeleting = false
        }
    }
}

struct SettingsRow: View {
    let icon: String
    let title: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(color.opacity(0.15))
                    .frame(width: 36, height: 36)
                
                Image(systemName: icon)
                    .foregroundColor(color)
            }
            
            Text(title)
                .font(.subheadline)
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
    }
}

#Preview {
    ProfileView()
        .environmentObject(AuthManager.shared)
}

/// Who else is in this family, and a way to remove them.
///
/// App Store Guideline 1.2 asks a user-generated-content app for a way to deal
/// with an abusive person, not only their individual posts. Comments can be
/// deleted from the artwork detail view; this is the other half. RLS already
/// allowed owners and parents to remove members and allowed anyone to remove
/// themselves -- there was simply no screen for it.
struct FamilyMembersCard: View {
    let familyId: UUID
    @ObservedObject var authManager: AuthManager

    @State private var members: [FamilyMember] = []
    @State private var myRole: String?
    @State private var pendingRemoval: FamilyMember?
    @State private var errorMessage: String?

    private var service: ArtworkService { ArtworkService(client: authManager.client) }
    private var canRemoveOthers: Bool { myRole == "owner" || myRole == "parent" }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Family members", systemImage: "person.2")
                .font(.headline)

            if members.isEmpty {
                Text("Just you so far. Share an invite code to add a grandparent or co-parent.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            ForEach(members) { member in
                HStack(spacing: 12) {
                    Circle()
                        .fill(Color.subtleFill)
                        .frame(width: 36, height: 36)
                        .overlay(Text(initials(for: member)).font(.caption.bold()))

                    VStack(alignment: .leading, spacing: 2) {
                        Text(displayName(for: member))
                            .font(.subheadline.weight(.medium))
                        Text(member.userId == authManager.currentUser?.id
                             ? "\(member.role.capitalized) · you"
                             : member.role.capitalized)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    if canRemove(member) {
                        Button {
                            pendingRemoval = member
                        } label: {
                            Image(systemName: "person.fill.xmark")
                                .foregroundColor(.red)
                        }
                        .accessibilityLabel(
                            member.userId == authManager.currentUser?.id
                                ? "Leave family"
                                : "Remove \(displayName(for: member))"
                        )
                    }
                }
                .padding(.vertical, 4)
            }
        }
        .padding()
        .background(Color.cardSurface)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
        .task(id: familyId) { await load() }
        .alert("Remove from family?", isPresented: .constant(pendingRemoval != nil)) {
            Button("Cancel", role: .cancel) { pendingRemoval = nil }
            Button("Remove", role: .destructive) {
                if let member = pendingRemoval { remove(member) }
            }
        } message: {
            Text(pendingRemoval?.userId == authManager.currentUser?.id
                 ? "You'll lose access to this family's gallery."
                 : "They'll lose access to this family's gallery. Artwork and comments stay.")
        }
        .alert("Couldn't remove them",
               isPresented: .constant(errorMessage != nil),
               actions: { Button("OK") { errorMessage = nil } },
               message: { Text(errorMessage ?? "") })
    }

    /// The owner cannot be removed -- a family with no owner has nobody who can
    /// manage it. Everyone can remove themselves, which is how you leave.
    private func canRemove(_ member: FamilyMember) -> Bool {
        if member.role == "owner" { return false }
        return canRemoveOthers || member.userId == authManager.currentUser?.id
    }

    private func displayName(for member: FamilyMember) -> String {
        if let nickname = member.nickname, !nickname.isEmpty { return nickname }
        return member.userId == authManager.currentUser?.id ? "You" : "Family member"
    }

    private func initials(for member: FamilyMember) -> String {
        let name = displayName(for: member)
        return String(name.prefix(1)).uppercased()
    }

    private func load() async {
        members = (try? await service.familyMembers(familyId: familyId)) ?? []
        myRole = await service.familyRole(familyId: familyId)
    }

    private func remove(_ member: FamilyMember) {
        let isSelf = member.userId == authManager.currentUser?.id
        pendingRemoval = nil
        Task {
            do {
                try await service.removeMember(id: member.id)
                if isSelf {
                    try? await authManager.signOut()
                } else {
                    await load()
                }
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
