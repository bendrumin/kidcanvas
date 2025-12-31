import SwiftUI

struct AddChildView: View {
    @EnvironmentObject var authManager: AuthManager
    @Environment(\.dismiss) private var dismiss
    
    @State private var name = ""
    @State private var birthDate = Date()
    @State private var hasBirthDate = false
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        ZStack {
            Color(red: 0.98, green: 0.97, blue: 0.95)
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 24) {
                    // Avatar Preview
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
                        
                        Text(name.isEmpty ? "?" : String(name.prefix(1)).uppercased())
                            .font(.system(size: 44, weight: .bold))
                            .foregroundColor(.white)
                    }
                    .padding(.top)
                    
                    // Form
                    VStack(spacing: 16) {
                        // Name
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Name")
                                .font(.subheadline.bold())
                                .foregroundColor(.secondary)
                            
                            TextField("Child's name", text: $name)
                                .padding()
                                .background(Color.white)
                                .cornerRadius(12)
                        }
                        
                        // Birth Date
                        VStack(alignment: .leading, spacing: 8) {
                            Toggle(isOn: $hasBirthDate) {
                                Text("Add birth date")
                                    .font(.subheadline.bold())
                                    .foregroundColor(.secondary)
                            }
                            .tint(.pink)
                            
                            if hasBirthDate {
                                DatePicker(
                                    "Birth Date",
                                    selection: $birthDate,
                                    displayedComponents: .date
                                )
                                .datePickerStyle(.graphical)
                                .padding()
                                .background(Color.white)
                                .cornerRadius(12)
                            }
                        }
                    }
                    .padding(.horizontal)
                    
                    if let error = errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                    
                    Spacer()
                    
                    // Save Button
                    Button(action: saveChild) {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Image(systemName: "plus.circle.fill")
                                Text("Add Child")
                            }
                        }
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(
                            LinearGradient(
                                colors: name.isEmpty ? [.gray] : [.pink, .purple],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .foregroundColor(.white)
                        .cornerRadius(16)
                        .shadow(color: name.isEmpty ? .clear : .pink.opacity(0.4), radius: 10, y: 5)
                    }
                    .disabled(name.isEmpty || isLoading)
                    .padding(.horizontal)
                    .padding(.bottom)
                }
            }
        }
        .navigationTitle("Add Child")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private func saveChild() {
        guard let familyId = authManager.currentFamily?.id else { return }
        
        Task {
            isLoading = true
            errorMessage = nil
            
            do {
                var childData: [String: Any] = [
                    "family_id": familyId.uuidString,
                    "name": name
                ]
                
                if hasBirthDate {
                    let formatter = ISO8601DateFormatter()
                    formatter.formatOptions = [.withFullDate]
                    childData["birth_date"] = formatter.string(from: birthDate)
                }
                
                try await authManager.client
                    .from("children")
                    .insert(childData)
                    .execute()
                
                // Reload children
                await authManager.loadChildren(familyId: familyId)
                
                dismiss()
                
            } catch {
                errorMessage = error.localizedDescription
            }
            
            isLoading = false
        }
    }
}

#Preview {
    NavigationStack {
        AddChildView()
            .environmentObject(AuthManager.shared)
    }
}

