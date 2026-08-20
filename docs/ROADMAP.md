# KidCanvas roadmap

Distilled from the 45 planning documents now in `docs/archive/`, filtered to
what is true of the product today: **iOS-first, free while in beta, no AI, no
paywall**. Ordered by value per unit of work.

## The positioning to build toward

The archived brand work lands on one thesis, and it is worth holding onto:

> "The artwork is just the artifact. The story is what makes it precious."

The pivot was **storage → storytelling**: from "never lose a piece" to
"remember the moment." The enemy isn't a lost file, it's lost context — your
kid says the drawing is a rainbow that ate a dinosaur, and by next week nobody
remembers. Every feature below is stronger when it serves that.

Worth knowing: the current App Store copy ("Save every little masterpiece")
still sells preservation. See `COPY_BANK.md` for story-first alternatives.

## Next up on iOS

Items 1–5 all ride on schema that already exists in
`supabase/migrations/004_storytelling_features.sql`, so applying
`supabase/web_addendum.sql` unblocks them together.

1. **Story field on upload.** A required free-text "what did they say about it?"
   field (the web app requires 20+ characters) promoted above the title. The
   `story` column already exists. This *is* the product thesis, and it's one
   `TextEditor` plus a field mapping.
2. **Story templates.** ~21 prompts in 6 categories already written in
   `lib/story-templates.ts` — port as a Swift array. Kills the blank-page
   problem with zero backend work.
3. **Moment photo.** An optional second photo of the child holding the artwork
   (`moment_photo_url` exists). The photo picker is already in the app. This is
   the emotional payload no competitor has.
4. **Reactions.** Five fixed emoji (❤️ 😍 🎨 👏 🌟), with the table, RLS, and
   count RPCs already written. Pure client work.
5. **Comments.** 1–500 characters, table and policies already written.
6. **Family invites.** Grandparents are the second persona and the real
   retention loop; the web app's `app/api/invite` is the reference. Note this
   makes the app multi-user-facing — re-check App Review's UGC expectations
   before shipping public *share links* (see `ios/APP_STORE_COMPLIANCE.md`).
7. **Search and sort.** `.searchable()` over title/child/tags is ~10 lines and
   the gallery has neither today.
8. **Memory prompts.** Local notifications (no server): nudge after 7+ days
   without an upload, count down to a birthday, seasonal hooks.

## Quick wins worth doing alongside

- **Accessibility labels.** The iOS app currently has *zero* — icon-only
  buttons and artwork thumbnails read as nothing under VoiceOver. Add
  `.accessibilityLabel("\(title) by \(child)")` on cards and labels on every
  icon button. Cheapest credibility win available.
- **Real empty states** via `ContentUnavailableView`, and error messages that
  say what failed instead of failing silently.
- **Haptics** (`.sensoryFeedback`) on save and favorite; **swipe actions** for
  favorite/delete in the gallery.
- **Detail view polish:** the hero image is aspect-fill and crops the drawing;
  the back button floats over the art with no scrim; card titles truncate at
  one line.

## Deliberately not doing

- **AI anything.** Removed from the product; the old auto-tagging route burned
  CPU for little value.
- **Voice-note transcription.** Dropped — it was only ever a doc, never code.
  (Voice *recording* itself is a maybe-later: the web app can play notes but
  was never able to record one, and iOS would be a from-scratch
  `AVAudioRecorder` build.)
- **Collections, PDF art books, print marketplace, referrals, analytics
  dashboards.** All spec'd in the archive, none close to worth it yet.
- **Teacher/classroom product.** The outreach materials are genuinely good (10
  cold-email templates, 13 named Facebook groups, a 30-day plan) but no
  classroom product was ever built and no outreach was ever sent — the tracker
  contains only fabricated example rows. Park it as a *second market* to
  revisit, not a second product.
- **QR share codes.** Implemented on web, never on iOS, and adding sharing
  re-opens moderation questions we currently sidestep.

## Monetization, when the time comes

The code of record (`003_update_free_tier_limits.sql`) sets the free tier at
**50 artworks, 1 child, 1 family** — the older docs claiming 100 artworks and 3
children are superseded and misleading. Paid tiers were designed as **Family
$4.99/mo or $49.99/yr** and **Pro $9.99/mo or $99.99/yr**. Physical-goods math
existed too (photo book at $34.99 on ~$15.50 cost).

Nothing enforces any limit in the iOS app today, and the app ships free during
beta, so this is a decision to make later — not a thing to half-build now.
