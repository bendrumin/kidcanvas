# KidCanvas iOS App

A SwiftUI iOS app for scanning and managing children's artwork.

## Setup Instructions

### 1. Create Xcode Project

1. Open Xcode
2. File → New → Project
3. Choose **App** (iOS)
4. Settings:
   - Product Name: `KidCanvas`
   - Team: Your team
   - Organization Identifier: `com.yourname` (e.g., `com.kidcanvas`)
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Storage: **None**
5. Save to: `/Users/bensiegel/KidCanvas/ios/`

### 2. Add Swift Packages

In Xcode: File → Add Package Dependencies

Add these packages:
- `https://github.com/supabase/supabase-swift` (2.5.1+)

**Important**: Add these products to your **KidCanvas** target:
- ✅ Supabase
- ✅ Auth
- ✅ PostgREST
- ✅ Storage
- ✅ Realtime
- ✅ Functions

**If you see package errors**, see `FIX_PACKAGE_DEPENDENCIES.md` for troubleshooting steps.

### 3. Copy Source Files

Copy all `.swift` files from `ios/KidCanvas/Sources/` into your Xcode project.

### 4. Configure Info.plist

Add these keys for camera/photo access:
```xml
<key>NSCameraUsageDescription</key>
<string>KidCanvas needs camera access to scan artwork</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>KidCanvas needs photo library access to import artwork</string>
```

### 5. Add Environment Variables

Create a `Config.swift` file with your credentials (already provided in Sources/).

## Features

- 📷 VisionKit document scanning
- 🔐 Supabase authentication  
- 👨‍👩‍👧‍👦 Family & children management
- 🎨 Artwork gallery with favorites
- ☁️ Cloud sync via R2 storage

