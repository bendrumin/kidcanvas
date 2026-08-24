# KidCanvas iOS

The native SwiftUI app for scanning and managing children's artwork. As of
August 2026 this is the **primary KidCanvas product** — the web app is offline.

Open `KidCanvas.xcodeproj` in Xcode. The Supabase Swift SDK resolves
automatically via Swift Package Manager.

## Structure

```
ios/
├── KidCanvas.xcodeproj      # Real Xcode project (buildable folder layout)
├── Info.plist               # Extra Info.plist keys merged at build time
└── KidCanvasApp/
    ├── KidCanvasApp.swift   # App entry + auth routing
    ├── Config.swift         # Supabase URL + anon key (fill in per project)
    ├── Managers/AuthManager.swift
    ├── Models/Models.swift
    └── Views/               # Auth, Gallery, Scanner, Upload, Favorites, Profile
```

## Backend setup (fresh Supabase project)

1. Create a project at supabase.com.
2. In the SQL Editor, run `supabase/schema_baseline.sql` from the repo root —
   it creates all tables, RLS policies, helper functions, and the event trigger
   that auto-enables RLS on new tables. Do not run anything in
   `supabase/archive/`; see `supabase/README.md` for why. You will also need to
   create the public `artworks` storage bucket. There is **no AI processing**
   in this schema.
3. (Recommended) Authentication → Providers → Email → turn OFF
   "Confirm email", so sign-up works instantly in the app.
4. Copy Project Settings → API → URL and anon key into
   `KidCanvasApp/Config.swift`.

## Notes

- Artwork images upload to Supabase Storage (`artworks` bucket, public URLs);
  the old Cloudflare R2 + web-API upload path is gone.
- Uploads write a full-size JPEG plus a 500px thumbnail.
- The document scanner (VisionKit) requires a real device — the simulator has
  no camera. The photo-picker path works everywhere.
