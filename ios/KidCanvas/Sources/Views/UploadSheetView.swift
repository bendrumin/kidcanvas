import SwiftUI

struct UploadSheetView: View {
    @EnvironmentObject var authManager: AuthManager
    let image: UIImage
    let onComplete: () -> Void
    
    @State private var title = ""
    @State private var description = ""
    @State private var selectedChild: Child?
    @State private var createdDate = Date()
    @State private var isUploading = false
    @State private var errorMessage: String?
    @State private var showSuccess = false
    
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.98, green: 0.97, blue: 0.95)
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Preview
                        Image(uiImage: image)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(maxHeight: 250)
                            .cornerRadius(16)
                            .shadow(color: .black.opacity(0.1), radius: 10, y: 5)
                        
                        // Form
                        VStack(spacing: 16) {
                            // Title
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Title")
                                    .font(.subheadline.bold())
                                    .foregroundColor(.secondary)
                                
                                TextField("Artwork title", text: $title)
                                    .padding()
                                    .background(Color.white)
                                    .cornerRadius(12)
                            }
                            
                            // Artist (Child)
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Artist")
                                    .font(.subheadline.bold())
                                    .foregroundColor(.secondary)
                                
                                Menu {
                                    ForEach(authManager.children) { child in
                                        Button(child.name) {
                                            selectedChild = child
                                        }
                                    }
                                } label: {
                                    HStack {
                                        if let child = selectedChild {
                                            Circle()
                                                .fill(
                                                    LinearGradient(
                                                        colors: [.pink, .purple],
                                                        startPoint: .topLeading,
                                                        endPoint: .bottomTrailing
                                                    )
                                                )
                                                .frame(width: 28, height: 28)
                                                .overlay {
                                                    Text(child.initial)
                                                        .font(.caption.bold())
                                                        .foregroundColor(.white)
                                                }
                                            
                                            Text(child.name)
                                                .foregroundColor(.primary)
                                        } else {
                                            Text("Select artist")
                                                .foregroundColor(.secondary)
                                        }
                                        
                                        Spacer()
                                        
                                        Image(systemName: "chevron.down")
                                            .foregroundColor(.secondary)
                                    }
                                    .padding()
                                    .background(Color.white)
                                    .cornerRadius(12)
                                }
                            }
                            
                            // Date Created
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Date Created")
                                    .font(.subheadline.bold())
                                    .foregroundColor(.secondary)
                                
                                DatePicker(
                                    "",
                                    selection: $createdDate,
                                    displayedComponents: .date
                                )
                                .datePickerStyle(.compact)
                                .labelsHidden()
                                .padding()
                                .background(Color.white)
                                .cornerRadius(12)
                            }
                            
                            // Description
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Description (optional)")
                                    .font(.subheadline.bold())
                                    .foregroundColor(.secondary)
                                
                                TextField("Notes about this artwork", text: $description, axis: .vertical)
                                    .lineLimit(3...5)
                                    .padding()
                                    .background(Color.white)
                                    .cornerRadius(12)
                            }
                        }
                        .padding(.horizontal)
                        
                        if let error = errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                        
                        // Upload button
                        Button(action: uploadArtwork) {
                            HStack {
                                if isUploading {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Image(systemName: "arrow.up.circle.fill")
                                    Text("Save to Gallery")
                                }
                            }
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(
                                LinearGradient(
                                    colors: canUpload ? [.pink, .purple] : [.gray],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .foregroundColor(.white)
                            .cornerRadius(16)
                            .shadow(color: canUpload ? .pink.opacity(0.4) : .clear, radius: 10, y: 5)
                        }
                        .disabled(!canUpload || isUploading)
                        .padding(.horizontal)
                    }
                    .padding(.vertical)
                }
            }
            .navigationTitle("New Artwork")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .overlay {
                if showSuccess {
                    SuccessOverlay {
                        onComplete()
                    }
                }
            }
        }
    }
    
    private var canUpload: Bool {
        !title.isEmpty && selectedChild != nil
    }
    
    private func uploadArtwork() {
        guard let child = selectedChild else { return }
        
        Task {
            isUploading = true
            errorMessage = nil
            
            do {
                // Convert image to data
                guard let imageData = image.jpegData(compressionQuality: 0.8) else {
                    throw UploadError.invalidImage
                }
                
                // Create form data and upload via API
                let boundary = UUID().uuidString
                var request = URLRequest(url: URL(string: "\(Config.appURL)/api/upload")!)
                request.httpMethod = "POST"
                request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
                
                // Get auth token
                let session = try await authManager.client.auth.session
                request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
                
                var body = Data()
                
                // Add image
                body.append("--\(boundary)\r\n".data(using: .utf8)!)
                body.append("Content-Disposition: form-data; name=\"file\"; filename=\"artwork.jpg\"\r\n".data(using: .utf8)!)
                body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
                body.append(imageData)
                body.append("\r\n".data(using: .utf8)!)
                
                // Add title
                body.append("--\(boundary)\r\n".data(using: .utf8)!)
                body.append("Content-Disposition: form-data; name=\"title\"\r\n\r\n".data(using: .utf8)!)
                body.append("\(title)\r\n".data(using: .utf8)!)
                
                // Add child ID
                body.append("--\(boundary)\r\n".data(using: .utf8)!)
                body.append("Content-Disposition: form-data; name=\"childId\"\r\n\r\n".data(using: .utf8)!)
                body.append("\(child.id.uuidString)\r\n".data(using: .utf8)!)
                
                // Add created date
                let dateFormatter = ISO8601DateFormatter()
                body.append("--\(boundary)\r\n".data(using: .utf8)!)
                body.append("Content-Disposition: form-data; name=\"createdDate\"\r\n\r\n".data(using: .utf8)!)
                body.append("\(dateFormatter.string(from: createdDate))\r\n".data(using: .utf8)!)
                
                // Add description if provided
                if !description.isEmpty {
                    body.append("--\(boundary)\r\n".data(using: .utf8)!)
                    body.append("Content-Disposition: form-data; name=\"description\"\r\n\r\n".data(using: .utf8)!)
                    body.append("\(description)\r\n".data(using: .utf8)!)
                }
                
                body.append("--\(boundary)--\r\n".data(using: .utf8)!)
                
                request.httpBody = body
                
                let (_, response) = try await URLSession.shared.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse,
                      httpResponse.statusCode == 200 else {
                    throw UploadError.serverError
                }
                
                // Success!
                showSuccess = true
                
            } catch {
                errorMessage = error.localizedDescription
            }
            
            isUploading = false
        }
    }
}

enum UploadError: LocalizedError {
    case invalidImage
    case serverError
    
    var errorDescription: String? {
        switch self {
        case .invalidImage:
            return "Could not process image"
        case .serverError:
            return "Upload failed. Please try again."
        }
    }
}

struct SuccessOverlay: View {
    let onDismiss: () -> Void
    @State private var showContent = false
    
    var body: some View {
        ZStack {
            Color.black.opacity(0.4)
                .ignoresSafeArea()
            
            VStack(spacing: 24) {
                ZStack {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 100, height: 100)
                    
                    Image(systemName: "checkmark")
                        .font(.system(size: 50, weight: .bold))
                        .foregroundColor(.white)
                }
                .scaleEffect(showContent ? 1 : 0.5)
                .opacity(showContent ? 1 : 0)
                
                Text("Artwork Saved!")
                    .font(.title2.bold())
                    .foregroundColor(.white)
                    .opacity(showContent ? 1 : 0)
            }
            .padding(40)
            .background(
                RoundedRectangle(cornerRadius: 24)
                    .fill(Color.white.opacity(0.1))
            )
        }
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                showContent = true
            }
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                onDismiss()
            }
        }
    }
}

#Preview {
    UploadSheetView(image: UIImage(systemName: "photo")!) {}
        .environmentObject(AuthManager.shared)
}

