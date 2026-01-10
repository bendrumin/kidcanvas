# KidCanvas iOS App Store Submission Guide

## Prerequisites

Before submitting, ensure you have:
- [ ] Apple Developer account ($99/year)
- [ ] App ID registered in Apple Developer Portal
- [ ] Provisioning profiles for distribution
- [ ] App icon (1024x1024 PNG, no alpha/transparency)
- [ ] Screenshots for all required device sizes

---

## 1. App Icon

### Requirements
- **Size**: 1024x1024 pixels
- **Format**: PNG
- **No transparency** (alpha channel)
- **No rounded corners** (iOS adds them automatically)

### Design Suggestion for KidCanvas
Create an icon with:
- Gradient background: Pink (#EC4899) → Purple (#A855F7)
- White paint palette or crayon icon
- Clean, simple design

### Generate Icons
```bash
cd ios/AppIcon
chmod +x generate-icons.sh
# Place your 1024x1024 icon as AppIcon-1024.png
./generate-icons.sh
```

---

## 2. Screenshots

### Required Sizes (minimum)
1. **6.7" iPhone** (iPhone 15 Pro Max): 1290 x 2796 px
2. **6.5" iPhone** (iPhone 14 Plus): 1284 x 2778 px
3. **5.5" iPhone** (iPhone 8 Plus): 1242 x 2208 px
4. **12.9" iPad Pro**: 2048 x 2732 px

### Suggested Screenshots
1. Gallery view with artwork displayed (cork board design)
2. Scanning artwork with VisionKit camera
3. Artwork detail page with age tracking
4. Favorites view
5. Profile/Family settings

---

## 3. App Store Connect Metadata

### App Information
- **App Name**: KidCanvas
- **Subtitle**: Preserve Your Kids' Art
- **Category**: Photo & Video (Primary), Lifestyle (Secondary)
- **Content Rating**: 4+ (no objectionable content)

### Description (4000 chars max)
```
Preserve your children's precious artwork forever with KidCanvas – the family art gallery app designed for parents and grandparents.

📸 SCAN & DIGITIZE
Use your iPhone's camera with advanced edge detection to perfectly capture artwork. Our VisionKit-powered scanner automatically detects paper edges for clean, professional scans.

👨‍👩‍👧‍👦 FAMILY GALLERY
Organize artwork by child and see their artistic growth over time. Track their age at each creation for a beautiful timeline of their development.

❤️ FAVORITES
Star your favorite pieces to quickly find your most treasured artwork.

☁️ SECURE CLOUD STORAGE
Your artwork is securely stored in the cloud. Access your gallery from any device, anytime.

FEATURES:
• VisionKit document scanning with edge detection
• Organize by child with age tracking
• Favorites collection
• Beautiful post-it note gallery design
• Multi-family support
• Dark mode
• Works on iPhone and iPad

SUBSCRIPTION PLANS:
• Free: 50 artworks, 1 child
• Family ($4.99/mo): Unlimited artworks & children

Every scribble tells a story. Start preserving them today.
```

### Keywords (100 chars max)
```
kids art,artwork,scanner,family,gallery,children,photos,keepsake,memories,organize
```

### Promotional Text (170 chars, can update anytime)
```
🎨 Scan and preserve your children's artwork with VisionKit edge detection. Beautiful cork board gallery design!
```

### What's New (Release Notes)
```
Welcome to KidCanvas 1.0! 🎉

• Scan artwork with VisionKit edge detection
• Beautiful post-it note cork board gallery
• Organize artwork by child with age tracking
• Favorites to save your best pieces
• Multi-family support
• Dark mode
• Works on iPhone and iPad
```

---

## 4. Privacy Policy & Support URLs

### Privacy Policy (Required)
Host at: `https://kidcanvas.app/privacy`

Create a privacy policy page covering:
- Data collected (email, photos, children's names)
- How data is stored (Supabase, Cloudflare R2)
- Third-party services (Stripe for payments)
- Data retention and deletion
- Contact information

### Support URL (Required)
`https://kidcanvas.app/support`

### Marketing URL (Optional)
`https://kidcanvas.app`

---

## 5. In-App Purchases Setup

### Current Implementation
The iOS app currently uses **web checkout via Stripe**. Users are directed to the web app for subscription management.

**Important:** When users hit subscription limits (e.g., artwork upload limit), the app shows an alert directing them to upgrade via the website at `kidcanvas.app/dashboard/billing`. The iOS app does not support in-app purchases - all subscription management happens on the web.

### If You Want Native IAP (Optional)
To add native Apple In-App Purchases, you would need to:
1. Integrate StoreKit 2
2. Create products in App Store Connect:
   - **KidCanvas Family Monthly**: $4.99
   - **KidCanvas Family Yearly**: $49.99

> Note: Apple takes 15-30% commission on IAP. Web checkout via Stripe has lower fees but requires users to leave the app.

---

## 6. Build & Submit

### 1. Archive the App
```
1. In Xcode: Product → Archive
2. Wait for build to complete
3. Organizer window opens automatically
```

### 2. Validate the Archive
```
1. Select archive in Organizer
2. Click "Validate App"
3. Fix any issues
```

### 3. Upload to App Store Connect
```
1. Click "Distribute App"
2. Select "App Store Connect"
3. Upload
```

### 4. Submit for Review
```
1. Go to App Store Connect
2. Select your app
3. Fill in all metadata
4. Add screenshots
5. Submit for review
```

---

## 7. Common Rejection Reasons & Fixes

### Guideline 2.1 - App Completeness
- Ensure all features work
- Test login/signup flow
- Test camera permissions

### Guideline 4.2 - Minimum Functionality
- App must do more than a website
- VisionKit scanning is unique value

### Guideline 5.1.1 - Data Collection
- Clearly state why you collect data
- Provide privacy policy link

### Guideline 3.1.1 - In-App Purchase
- If offering subscriptions, must use Apple IAP for digital content
- Web checkout via Stripe is OK for "reader" apps

---

## 8. Checklist Before Submission

### Code
- [ ] All API keys removed from source (use Config.swift)
- [ ] Debug logs removed
- [ ] Minimum iOS version set (17.0)
- [ ] All entitlements correct

### Assets
- [ ] App icon added (1024x1024, no transparency)
- [ ] Launch screen configured
- [ ] All required screenshots

### App Store Connect
- [ ] App description written
- [ ] Keywords added
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Category selected
- [ ] Age rating completed
- [ ] Price/subscription configured

### Testing
- [ ] Tested on real device
- [ ] Tested on multiple iOS versions
- [ ] Camera permissions work
- [ ] Photo library permissions work
- [ ] Login/signup works
- [ ] Upload works
- [ ] All screens accessible

---

## Need Help?

- Apple Developer Documentation: https://developer.apple.com/documentation/
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/

Good luck with your submission! 🚀

