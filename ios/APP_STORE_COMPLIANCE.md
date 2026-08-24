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

## Guideline 1.2 (user-generated content)

The app has comments and reactions, so 1.2 applies. Two of the three legs are now
in place:

| Leg | State |
|---|---|
| Remove objectionable content | ✅ Long-press a comment → Delete. `ArtworkService.deleteComment` was implemented but no view called it; it is now wired into `CommentsSection`. |
| Moderation by a responsible adult | ✅ Migration 011 adds a DELETE policy letting family owners and parents remove *any* comment in their family, matching how artwork deletion works. Authors keep the ability to delete their own regardless of role. |
| Block an abusive user | ❌ **Still open.** The `family_members` DELETE policy for owners/parents already exists, but iOS has no member list UI at all, so there is no way to remove someone from a family in the app. |

Mitigating for the open leg: a family is invite-only via an 8-character code,
there is no public feed, and no route to another family's content — so the
worst case is a person the parent themselves invited, and the parent can now
delete anything that person writes. Apple applies 1.2 most strictly to open
networks.

Remaining work: a members list on the Profile tab with a remove action.

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
