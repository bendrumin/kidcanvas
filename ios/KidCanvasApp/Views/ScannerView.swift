import SwiftUI
import VisionKit
import PhotosUI

struct ScannerView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var showScanner = false
    @State private var showPhotoPicker = false
    @State private var scannedImage: UIImage?
    @State private var selectedItem: PhotosPickerItem?
    @State private var showUploadSheet = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                LinearGradient(
                    colors: [
                        Color(red: 0.98, green: 0.97, blue: 0.95),
                        Color(red: 1.0, green: 0.95, blue: 0.93)
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
                
                VStack(spacing: 32) {
                    Spacer()
                    
                    // Hero illustration
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [.pink.opacity(0.2), .purple.opacity(0.2)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 200, height: 200)
                        
                        Image(systemName: "doc.viewfinder.fill")
                            .font(.system(size: 80))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [.pink, .purple],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                    }
                    
                    VStack(spacing: 8) {
                        Text("Scan Artwork")
                            .font(.title.bold())
                        
                        Text("Use your camera to capture and preserve\nyour child's masterpieces")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    
                    Spacer()
                    
                    // Action buttons
                    VStack(spacing: 16) {
                        Button(action: { showScanner = true }) {
                            HStack {
                                Image(systemName: "camera.fill")
                                Text("Scan Document")
                            }
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
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
                        
                        PhotosPicker(selection: $selectedItem, matching: .images) {
                            HStack {
                                Image(systemName: "photo.on.rectangle")
                                Text("Choose from Photos")
                            }
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(Color.white)
                            .foregroundColor(.pink)
                            .cornerRadius(16)
                            .shadow(color: .black.opacity(0.08), radius: 8, y: 4)
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("Scan")
            .navigationBarTitleDisplayMode(.inline)
            .fullScreenCover(isPresented: $showScanner) {
                DocumentScannerView { image in
                    scannedImage = image
                    showUploadSheet = true
                }
            }
            .onChange(of: selectedItem) {
                Task {
                    if let data = try? await selectedItem?.loadTransferable(type: Data.self),
                       let image = UIImage(data: data) {
                        scannedImage = image
                        showUploadSheet = true
                    }
                }
            }
            .sheet(isPresented: $showUploadSheet) {
                if let image = scannedImage {
                    UploadSheetView(image: image) {
                        scannedImage = nil
                        showUploadSheet = false
                    }
                }
            }
        }
    }
}

struct DocumentScannerView: UIViewControllerRepresentable {
    let onScan: (UIImage) -> Void
    @Environment(\.dismiss) private var dismiss
    
    func makeUIViewController(context: Context) -> VNDocumentCameraViewController {
        let scanner = VNDocumentCameraViewController()
        scanner.delegate = context.coordinator
        return scanner
    }
    
    func updateUIViewController(_ uiViewController: VNDocumentCameraViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(onScan: onScan, dismiss: dismiss)
    }
    
    class Coordinator: NSObject, VNDocumentCameraViewControllerDelegate {
        let onScan: (UIImage) -> Void
        let dismiss: DismissAction
        
        init(onScan: @escaping (UIImage) -> Void, dismiss: DismissAction) {
            self.onScan = onScan
            self.dismiss = dismiss
        }
        
        func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFinishWith scan: VNDocumentCameraScan) {
            // Get the first scanned page
            if scan.pageCount > 0 {
                let image = scan.imageOfPage(at: 0)
                onScan(image)
            }
            dismiss()
        }
        
        func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
            dismiss()
        }
        
        func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFailWithError error: Error) {
            print("Scanner failed: \(error)")
            dismiss()
        }
    }
}

#Preview {
    ScannerView()
        .environmentObject(AuthManager.shared)
}

