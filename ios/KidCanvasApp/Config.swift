import Foundation

enum Config {
    // Fill these in from your Supabase project: Settings → API.
    // The anon key is safe to ship in the app; Row Level Security protects the data.
    static let supabaseURL = URL(string: "https://tibsjyoztamsrumshdkx.supabase.co")!
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpYnNqeW96dGFtc3J1bXNoZGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNTY2NDIsImV4cCI6MjEwMjgzMjY0Mn0.n_6UnVZroZxP73ahF-d2UDh5RkdWElOitVq5p2YcNWs"

    /// Public storage bucket that artwork images upload into.
    static let artworkBucket = "artworks"

    /// The Next.js app. The app calls it only to hand StoreKit transactions to
    /// /api/app-store/verify, where Apple's signature is checked server side.
    static let apiBaseURL = URL(string: "https://kidcanvas.app")!

    static let privacyPolicyURL = URL(string: "https://kidcanvas.app/privacy")!
    /// Linked from the paywall; App Review 3.1.2 requires Terms of Use there.
    static let termsURL = URL(string: "https://kidcanvas.app/terms")!
    static let supportURL = URL(string: "https://kidcanvas.app/support")!
}
