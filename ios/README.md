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

## Subscriptions (StoreKit 2)

How it fits together:

- `Managers/StoreManager.swift` loads the products, buys and restores, listens
  to `Transaction.updates`, and sends every signed transaction to
  `https://kidcanvas.app/api/app-store/verify`. Purchases carry
  `appAccountToken` = the Supabase user id, so server notifications map back
  to the account.
- The plan comes from `get_user_plan()` (migration `014`), the same function
  the web's `lib/subscription.ts` reads. A web (Stripe) subscriber is
  recognized in the app, and an App Store subscriber on the web.
- Limits match the web: free is 50 artworks and 1 artist per family, and 1
  family. Only new additions are blocked; nothing already saved is touched.
- `Views/PaywallView.swift` shows StoreKit's own prices for the storefront.
  The yearly "Save N%" is computed from those prices.

### Owner checklist

Nothing below has been done yet. None of it can be done from the repo.

1. **Small Business Program.** Enroll at
   developer.apple.com/app-store/small-business-program before selling
   anything. Without it Apple takes 30% of a subscription in its first year
   (15% after); enrolled, it is 15% from the start.
2. **Paid Apps agreement.** App Store Connect > Business: accept the Paid
   Apps agreement and fill in banking and tax. Products stay "Missing
   Metadata" and cannot be bought, even in sandbox, until this is done.
3. **Subscription group.** App Store Connect > KidCanvas > Subscriptions >
   create a group named `KidCanvas`. Add four auto-renewable subscriptions
   with exactly these product ids, prices (US storefront; let Apple derive
   the others or set them by hand) and levels. Pro is level 1 so moving from
   Family to Pro is an immediate upgrade:

   | Product id                 | Duration | Price   | Level |
   |----------------------------|----------|---------|-------|
   | `kidcanvas.pro.monthly`    | 1 month  | $11.99  | 1     |
   | `kidcanvas.pro.yearly`     | 1 year   | $119.99 | 1     |
   | `kidcanvas.family.monthly` | 1 month  | $5.99   | 2     |
   | `kidcanvas.family.yearly`  | 1 year   | $59.99  | 2     |

   Each needs a display name, a description, and a review screenshot of the
   paywall. Leave Family Sharing off (see the decision below).
4. **Server notifications.** App Store Connect > App Information > App Store
   Server Notifications: set **both** the Production and Sandbox URL to
   `https://kidcanvas.app/api/app-store/notifications`, Version 2. Then use
   "Request a Test Notification" and check the Vercel logs for
   `nothing to apply [TEST ...]`.
5. **Migration 014.** Apply `supabase/migrations/014_app_store_subscriptions.sql`
   to the live project (SQL Editor, or `supabase db query --linked -f ...`),
   then confirm it took:

   ```bash
   supabase db query --linked "
     select p.proname, r.rolname
     from pg_proc p, aclexplode(p.proacl) a join pg_roles r on r.oid = a.grantee
     where p.proname in ('get_user_plan', 'apply_app_store_transaction')
     order by 1, 2;"
   # expect apply_app_store_transaction granted to service_role (and postgres)
   # only, and get_user_plan to authenticated and service_role
   supabase db query --linked "select count(*) from app_store_subscriptions;"
   ```

   Until it is applied, the web and the app both treat everyone as free.
6. **Deploy the web app** so `/api/app-store/verify` and
   `/api/app-store/notifications` exist at kidcanvas.app. No new env vars are
   required: the routes use the existing `NEXT_PUBLIC_SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY`. `APP_STORE_BUNDLE_ID` is optional and defaults
   to `Siegel.KidCanvas`.
7. **Test in sandbox** with a Sandbox Apple Account (Settings > Developer on
   the device): buy, restore on a second device, cancel, and let a monthly
   renew (sandbox months last minutes). After each step, check the row in
   `app_store_subscriptions` and the plan on the web billing page.
8. **App Review notes.** Say where the paywall appears (Settings > Plan >
   See plans, or on reaching 50 artworks) and that Restore is on the same
   sheet.

### Local testing

The shared `KidCanvas` scheme's Run action uses `ios/KidCanvas.storekit`
(Edit Scheme > Run > Options > StoreKit Configuration should show it). Those
purchases are signed by Xcode's local certificate, not Apple's, so
`/api/app-store/verify` correctly refuses them: the app honors them on the
device, but the server row and the web will not change. Use sandbox (step 7)
to test the server side. `npm run test:app-store-jws` checks that the server's
signature verification fails closed.

## Notes

- Artwork images upload to Supabase Storage (`artworks` bucket, public URLs);
  the old Cloudflare R2 + web-API upload path is gone.
- Uploads write a full-size JPEG plus a 500px thumbnail.
- The document scanner (VisionKit) requires a real device — the simulator has
  no camera. The photo-picker path works everywhere.
