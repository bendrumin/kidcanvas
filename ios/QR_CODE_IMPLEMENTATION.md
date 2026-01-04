# iOS QR Code Implementation Guide

QR codes are an excellent feature for iOS! They allow easy sharing with grandparents, can be printed and displayed with artwork, and work seamlessly with iOS's native QR code scanning.

## Implementation Approach

### 1. Install QR Code Library

Add a Swift QR code generation library to your iOS project:

```swift
// In Package.swift or via Xcode Package Manager
dependencies: [
    .package(url: "https://github.com/apple/swift-qrcode-generator.git", from: "1.0.0")
]
```

Or use a popular library like `EFQRCode`:
```swift
.package(url: "https://github.com/EFPrefix/EFQRCode.git", from: "6.0.0")
```

### 2. QR Code View Component

Create a SwiftUI view for displaying QR codes:

```swift
// QRCodeView.swift
import SwiftUI
import EFQRCode

struct QRCodeView: View {
    let shareUrl: String
    let artworkTitle: String
    let childName: String?
    
    @State private var qrImage: UIImage?
    @State private var showShareSheet = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // QR Code Display
                if let qrImage = qrImage {
                    Image(uiImage: qrImage)
                        .resizable()
                        .interpolation(.none)
                        .scaledToFit()
                        .frame(width: 250, height: 250)
                        .padding()
                        .background(Color.white)
                        .cornerRadius(12)
                        .shadow(radius: 8)
                } else {
                    ProgressView()
                }
                
                // Share URL
                VStack(alignment: .leading, spacing: 8) {
                    Text("Share Link")
                        .font(.headline)
                    HStack {
                        Text(shareUrl)
                            .font(.system(.caption, design: .monospaced))
                            .lineLimit(1)
                            .truncationMode(.middle)
                        
                        Button(action: {
                            UIPasteboard.general.string = shareUrl
                            // Show toast
                        }) {
                            Image(systemName: "doc.on.doc")
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                }
                .padding(.horizontal)
                
                // Actions
                VStack(spacing: 12) {
                    Button(action: {
                        saveQRCodeToPhotos()
                    }) {
                        HStack {
                            Image(systemName: "square.and.arrow.down")
                            Text("Save to Photos")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.pink)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    
                    Button(action: {
                        showShareSheet = true
                    }) {
                        HStack {
                            Image(systemName: "square.and.arrow.up")
                            Text("Share QR Code")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                }
                .padding(.horizontal)
                
                Spacer()
                
                // Instructions
                VStack(alignment: .leading, spacing: 8) {
                    Text("💡 Ways to use:")
                        .font(.headline)
                    Text("• Print and display with artwork")
                    Text("• Share with grandparents")
                    Text("• Include in photo albums")
                    Text("• Email or text to family")
                }
                .font(.caption)
                .foregroundColor(.secondary)
                .padding()
            }
            .padding()
            .navigationTitle("QR Code")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                generateQRCode()
            }
            .sheet(isPresented: $showShareSheet) {
                if let qrImage = qrImage {
                    ShareSheet(activityItems: [qrImage])
                }
            }
        }
    }
    
    private func generateQRCode() {
        // Generate QR code using EFQRCode or native CoreImage
        guard let ciImage = generateQRCodeImage(from: shareUrl) else { return }
        
        let context = CIContext()
        guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else { return }
        
        qrImage = UIImage(cgImage: cgImage)
    }
    
    private func generateQRCodeImage(from string: String) -> CIImage? {
        let data = string.data(using: String.Encoding.ascii)
        guard let filter = CIFilter(name: "CIQRCodeGenerator") else { return nil }
        
        filter.setValue(data, forKey: "inputMessage")
        let transform = CGAffineTransform(scaleX: 10, y: 10)
        
        return filter.outputImage?.transformed(by: transform)
    }
    
    private func saveQRCodeToPhotos() {
        guard let qrImage = qrImage else { return }
        UIImageWriteToSavedPhotosAlbum(qrImage, nil, nil, nil)
        // Show success message
    }
}

// Share Sheet helper
struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
```

### 3. Integration with Artwork Detail View

Add a QR code button to your artwork detail view:

```swift
// In ArtworkDetailView.swift
@State private var showQRCode = false
@State private var shareUrl: String?

// Add button next to share button
Button(action: {
    // First create share link if needed
    if shareUrl == nil {
        createShareLink { url in
            shareUrl = url
            showQRCode = true
        }
    } else {
        showQRCode = true
    }
}) {
    HStack {
        Image(systemName: "qrcode")
        Text("QR Code")
    }
}

// Sheet presentation
.sheet(isPresented: $showQRCode) {
    if let url = shareUrl {
        QRCodeView(
            shareUrl: url,
            artworkTitle: artwork.title,
            childName: artwork.child?.name
        )
    }
}
```

### 4. API Integration

The share link API is already set up in `/api/share/route.ts`. You can call it from iOS:

```swift
func createShareLink(artworkId: UUID, completion: @escaping (String?) -> Void) {
    guard let token = authManager.session?.accessToken else {
        completion(nil)
        return
    }
    
    var request = URLRequest(url: URL(string: "\(baseURL)/api/share")!)
    request.httpMethod = "POST"
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body = ["artworkId": artworkId.uuidString]
    request.httpBody = try? JSONSerialization.data(withJSONObject: body)
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        guard let data = data,
              let json = try? JSONDecoder().decode(ShareResponse.self, from: data),
              let url = json.url else {
            completion(nil)
            return
        }
        completion(url)
    }.resume()
}

struct ShareResponse: Codable {
    let code: String?
    let url: String?
}
```

## Benefits for iOS Users

1. **Native Integration**: iOS has built-in QR code scanning in Camera app
2. **Easy Sharing**: Share QR code images via Messages, Mail, AirDrop
3. **Print Integration**: Save to Photos, then print directly from iOS
4. **Accessibility**: Grandparents can scan with any phone camera
5. **Physical Display**: Print and frame with artwork

## Testing Checklist

- [ ] QR code generates correctly from share URL
- [ ] QR code scans properly with iOS Camera app
- [ ] Saving to Photos works
- [ ] Sharing via Share Sheet works
- [ ] QR code displays correctly on different screen sizes
- [ ] Share link creation works with authenticated requests

## Notes

- QR codes should be at least 200x200 points for good scanability
- Consider adding error correction level 'H' for better reliability
- Test with printed QR codes to ensure they scan well
- Consider adding a border/margin around QR code for better scanning

