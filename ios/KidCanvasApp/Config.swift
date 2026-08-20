import Foundation

enum Config {
    // Fill these in from your Supabase project: Settings → API.
    // The anon key is safe to ship in the app; Row Level Security protects the data.
    static let supabaseURL = URL(string: "https://YOUR-PROJECT-REF.supabase.co")!
    static let supabaseAnonKey = "YOUR-ANON-KEY"

    /// Public storage bucket that artwork images upload into.
    static let artworkBucket = "artworks"
}
