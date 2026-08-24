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

