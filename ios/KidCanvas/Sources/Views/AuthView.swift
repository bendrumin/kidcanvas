import SwiftUI

struct AuthView: View {
    @State private var isLogin = true
    @State private var email = ""
    @State private var password = ""
    @State private var fullName = ""
    @State private var familyName = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    @EnvironmentObject var authManager: AuthManager
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [
                    Color(red: 1.0, green: 0.97, blue: 0.93),
                    Color(red: 1.0, green: 0.94, blue: 0.90),
                    Color(red: 1.0, green: 0.93, blue: 0.93)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 32) {
                    // Logo
                    VStack(spacing: 12) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 20)
                                .fill(
                                    LinearGradient(
                                        colors: [.pink, .purple],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 80, height: 80)
                                .shadow(color: .pink.opacity(0.4), radius: 20, y: 10)
                            
                            Image(systemName: "paintpalette.fill")
                                .font(.system(size: 40))
                                .foregroundColor(.white)
                        }
                        
                        Text("KidCanvas")
                            .font(.system(size: 36, weight: .bold, design: .rounded))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [.pink, .purple],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                    }
                    .padding(.top, 60)
                    
                    // Form Card
                    VStack(spacing: 24) {
                        Text(isLogin ? "Welcome Back!" : "Create Account")
                            .font(.title2.bold())
                        
                        Text(isLogin ? "Sign in to your family gallery" : "Start preserving memories")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        VStack(spacing: 16) {
                            if !isLogin {
                                AuthTextField(
                                    icon: "person.fill",
                                    placeholder: "Full Name",
                                    text: $fullName
                                )
                                
                                AuthTextField(
                                    icon: "house.fill",
                                    placeholder: "Family Name",
                                    text: $familyName
                                )
                            }
                            
                            AuthTextField(
                                icon: "envelope.fill",
                                placeholder: "Email",
                                text: $email,
                                keyboardType: .emailAddress
                            )
                            
                            AuthTextField(
                                icon: "lock.fill",
                                placeholder: "Password",
                                text: $password,
                                isSecure: true
                            )
                        }
                        
                        if let error = errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.red)
                                .multilineTextAlignment(.center)
                        }
                        
                        Button(action: handleSubmit) {
                            HStack {
                                if isLoading {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Text(isLogin ? "Sign In" : "Create Account")
                                        .fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .background(
                                LinearGradient(
                                    colors: [.pink, .purple],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .foregroundColor(.white)
                            .cornerRadius(16)
                            .shadow(color: .pink.opacity(0.4), radius: 10, y: 5)
                        }
                        .disabled(isLoading)
                        
                        Button(action: { withAnimation { isLogin.toggle() } }) {
                            HStack(spacing: 4) {
                                Text(isLogin ? "Don't have an account?" : "Already have an account?")
                                    .foregroundColor(.secondary)
                                Text(isLogin ? "Sign Up" : "Sign In")
                                    .fontWeight(.semibold)
                                    .foregroundColor(.pink)
                            }
                            .font(.subheadline)
                        }
                    }
                    .padding(32)
                    .background(Color.white)
                    .cornerRadius(24)
                    .shadow(color: .black.opacity(0.08), radius: 20, y: 10)
                    .padding(.horizontal, 24)
                }
                .padding(.bottom, 40)
            }
        }
    }
    
    private func handleSubmit() {
        Task {
            isLoading = true
            errorMessage = nil
            
            do {
                if isLogin {
                    try await authManager.signIn(email: email, password: password)
                } else {
                    try await authManager.signUp(
                        email: email,
                        password: password,
                        fullName: fullName,
                        familyName: familyName.isEmpty ? "\(fullName)'s Family" : familyName
                    )
                }
            } catch {
                errorMessage = error.localizedDescription
            }
            
            isLoading = false
        }
    }
}

struct AuthTextField: View {
    let icon: String
    let placeholder: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default
    var isSecure: Bool = false
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.gray)
                .frame(width: 24)
            
            if isSecure {
                SecureField(placeholder, text: $text)
            } else {
                TextField(placeholder, text: $text)
                    .keyboardType(keyboardType)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}

#Preview {
    AuthView()
        .environmentObject(AuthManager.shared)
}

