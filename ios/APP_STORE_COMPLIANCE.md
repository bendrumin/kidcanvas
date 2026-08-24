# KidCanvas — App Store compliance checklist

Status as of 2026-08-20, for version 1.0 (build 14).

## Done in the app / repo

| Requirement | Guideline | State |
|---|---|---|
| In-app account deletion (full delete, not deactivate) | 5.1.1(v) | ✅ Profile → Delete Account, with confirmation. Removes family, children, artworks, stored image files, and the auth user via the `delete_my_account()` RPC. |
| Privacy policy reachable in-app | 5.1.1 / 5.1.2 | ✅ Profile → Privacy Policy → kidcanvas.app/privacy |
| Support reachable in-app | 1.5 | ✅ Profile → Help & Support |
| Sign out | — | ✅ Profile → Sign Out |
| No non-functional UI | 2.1 | ✅ The old dead "Notifications" row was removed; Privacy and Help rows now open real pages. |
| Camera usage string | 5.1.1 | ✅ `NSCameraUsageDescription` (scanning artwork) |
| Export compliance declared | — | ✅ `ITSAppUsesNonExemptEncryption = false` in Info.plist |
| Demo account for review | 2.1 | ✅ `kidcanvas.appreview@gmail.com` / `ReviewDemo!2026`, pre-seeded with 2 children + 2 artworks. Delivered via fastlane review_information. |
| Review notes explaining the app + where deletion lives | 2.1 | ✅ fastlane/metadata/review_information/notes.txt |
| No third-party ads/analytics/tracking SDKs | 5.1.2 | ✅ Only dependency is the Supabase SDK. |

## Deliberate product decisions

- **Not in the Kids Category.** Categories are Lifestyle + Photo & Video, and the
  app is marketed to parents. This avoids the Kids Category rules (parental
  gates, no third-party analytics, stricter data handling) that would otherwise
  apply. Children never create accounts or sign in.
- **No public sharing in the iOS app**, so no user-generated-content moderation
  or reporting flow is required (1.2). The web app's share links are not
  implemented here.

## Still to do in App Store Connect (browser only)

1. **App Privacy** (Data collection) — answer as:
   - *Contact Info → Email Address*: Collected · Linked to the user · App Functionality
   - *User Content → Photos or Videos*: Collected · Linked to the user · App Functionality
   - *User Content → Other User Content* (artwork titles/descriptions, child names): Collected · Linked to the user · App Functionality
   - *Identifiers → User ID*: Collected · Linked to the user · App Functionality
   - **Used for tracking: No** for every item. No data used for advertising.
2. **Age rating** — 4+ (no objectionable content in any category).
3. **Pricing** — free while in beta.
4. **Attach build 14** to the 1.0 version, then Submit for Review.

## Backend prerequisite

The Delete Account button calls the `delete_my_account()` RPC. Verified live:
the function exists and is `SECURITY DEFINER`, so this prerequisite is met. Its
definition is in `supabase/schema_baseline.sql`.
