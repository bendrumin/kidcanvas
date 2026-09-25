import SwiftUI
import VisionKit
import PhotosUI

struct ScannerView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var store: StoreManager
    @State private var showScanner = false
    @State private var pendingArtwork: PendingArtwork?
    @State private var selectedItem: PhotosPickerItem?
    /// Checked when the tab appears, so someone at the free limit learns it
    /// before scanning and writing a story, not after.
    @State private var limitBlock: LimitBlock?
    @State private var paywallBlock: LimitBlock?

    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                LinearGradient(
                    colors: Color.paperGradientStops,
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
                        if let block = limitBlock {
                            LimitNotice(block: block) { paywallBlock = block }
                        }

                        Button(action: {
                            if let block = limitBlock {
                                paywallBlock = block
                            } else {
                                showScanner = true
                            }
                        }) {
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
                        
                        // PhotosPicker opens on tap with no hook to intercept,
                        // so at the limit it is swapped for a plain button.
                        if let block = limitBlock {
                            Button { paywallBlock = block } label: { photosLabel }
                        } else {
                            PhotosPicker(selection: $selectedItem, matching: .images) {
                                photosLabel
                            }
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
                    pendingArtwork = PendingArtwork(image: image)
                }
            }
            .onChange(of: selectedItem) {
                guard let item = selectedItem else { return }
                Task {
                    if let data = try? await item.loadTransferable(type: Data.self),
                       let image = UIImage(data: data) {
                        pendingArtwork = PendingArtwork(image: image)
                    }
                    // Clearing the selection lets the same photo be picked again
                    // later; without this the binding never changes and nothing
                    // happens on a re-pick.
                    selectedItem = nil
                }
            }
            // sheet(item:) rather than sheet(isPresented:) — the presented image
            // travels with the identity, so the sheet can't build before the
            // image is set and come up blank.
            .sheet(item: $pendingArtwork) { pending in
                UploadSheetView(image: pending.image) {
                    pendingArtwork = nil
                }
            }
            .sheet(item: $paywallBlock) { block in
                PaywallView(block: block)
            }
            .task(id: store.effectiveTier) { await checkLimit() }
            .onChange(of: pendingArtwork == nil) { _, closed in
                // A save just finished; the count may have reached the limit.
                if closed { Task { await checkLimit() } }
            }
        }
    }

    private var photosLabel: some View {
        HStack {
            Image(systemName: "photo.on.rectangle")
            Text("Choose from Photos")
        }
        .font(.headline)
        .frame(maxWidth: .infinity)
        .frame(height: 56)
        .background(Color.cardSurface)
        .foregroundColor(.pink)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.08), radius: 8, y: 4)
    }

    private func checkLimit() async {
        limitBlock = await store.limitBlock(for: .artwork, familyId: authManager.currentFamily?.id)
    }
}

/// Inline explanation of a reached limit, with the way forward. Shown where the
/// blocked action lives, so nobody has to guess why a button does nothing.
struct LimitNotice: View {
    let block: LimitBlock
    let onUpgrade: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(block.title)
                .font(.subheadline.bold())
            Text(block.message)
                .font(.footnote)
                .foregroundColor(.secondary)
            Button("See plans", action: onUpgrade)
                .font(.subheadline.bold())
                .foregroundColor(.pink)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.cardSurface)
        .cornerRadius(16)
    }
}

struct PendingArtwork: Identifiable {
    let id = UUID()
    let image: UIImage
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
        .environmentObject(StoreManager.shared)
}

