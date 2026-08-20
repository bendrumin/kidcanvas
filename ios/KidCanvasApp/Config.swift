import Foundation

enum Config {
    // Fill these in from your Supabase project: Settings → API.
    // The anon key is safe to ship in the app; Row Level Security protects the data.
    static let supabaseURL = URL(string: "https://tibsjyoztamsrumshdkx.supabase.co")!
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpYnNqeW96dGFtc3J1bXNoZGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNTY2NDIsImV4cCI6MjEwMjgzMjY0Mn0.n_6UnVZroZxP73ahF-d2UDh5RkdWElOitVq5p2YcNWs"

    /// Public storage bucket that artwork images upload into.
    static let artworkBucket = "artworks"
}
