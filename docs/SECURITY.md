# KidCanvas security notes

State as of 2026-08-20, after the iOS rebuild and the move off Cloudflare R2.
Supersedes the archived audit docs, which describe code that no longer exists.

## Open — needs a person

- **Rotate the old Cloudflare R2 API token.** The secret was committed in
  plaintext (in the old `ios/.../Config.swift` and in an archived audit doc), so
  it is permanently in this repo's public history. Nothing uses R2 any more, so
  deleting the token in Cloudflare breaks nothing.
- **Run the SQL addenda** on the Supabase project: `ios_addendum.sql`,
  `web_addendum.sql`, `account_deletion.sql`, `security_addendum.sql`. Account
  deletion in particular is an App Store requirement that App Review tests.
- **Confirm `NEXT_PUBLIC_APP_URL`** in Vercel matches the deployed origin, or
  CSRF protection will reject legitimate form posts.

## Fixed

- **Hardcoded storage credentials in the iOS app.** Gone with the rebuild; the
  app now ships only the Supabase anon key, which is safe by design because
  row-level security does the enforcement.
- **iOS uploads bypassing every server-side check.** The app writes straight to
  Storage, so the web app's 10MB cap, MIME check, and membership check never
  ran. Now enforced *at the bucket*: a 10MB `file_size_limit`, an
  `allowed_mime_types` allow-list, and insert/delete policies that confine each
  client to folders named after a family it belongs to. The app also compresses
  down to fit the cap before uploading.
- **Any signed-in user could write anywhere in the bucket.** Same policy fix.
- **Deletes were scoped to the uploader**, so a co-parent removing artwork left
  the file orphaned. Deletes now follow family membership.

  These three were written in `security_addendum.sql` and listed here as fixed
  for weeks, but querying the live database showed that file had never been run:
  `file_size_limit` and `allowed_mime_types` were both NULL, INSERT was still
  the blanket `WITH CHECK (bucket_id = 'artworks')`, and DELETE was still
  uploader-scoped. Anyone who signed up could write any file of any size into
  any family's folder. `migrations/009_apply_storage_hardening.sql` actually
  applied them, and the result was verified by query afterwards. Writing a
  policy in this repo is not the same as it being live -- check
  `pg_policies` and `storage.buckets`, not the file list.
- **A live AI route still spending an Anthropic key.** `app/api/ai-tag` is
  deleted along with the button that called it, since AI was removed from the
  product.
- **Stale Cloudflare hosts** in the CSP and in `next/image` remote patterns —
  the latter would have broken every Supabase-hosted image on the web app.
  Both now point at Supabase.
- Web app hardening from the earlier audit is real and present: rate limiting,
  CSRF protection, zod validation, and HSTS/CSP headers.

## Known limitation, by choice

**Both storage buckets are public-read.** Anyone holding an object URL can fetch
the file without authenticating. For a children's photo app, a private bucket
with signed URLs is the stronger posture; it requires signing logic in both
clients and on the public `/share/[code]` page, so it's a deliberate follow-up
rather than something done quietly.

The earlier version of this note claimed the two random UUIDs in each path made
those URLs unguessable. That was wrong, and it was load-bearing: the storage
policies read `FOR SELECT USING (bucket_id = '...')` with no role restriction,
which granted the `anon` role row visibility on `storage.objects` -- exactly what
`POST /storage/v1/object/list` reads. Holding only the anon key that ships inside
the iOS app, an anonymous caller could list every family folder, list the artwork
filenames inside it, and then fetch the images. Nothing needed guessing.

`migrations/008_storage_no_anonymous_enumeration.sql` closes that: both buckets'
SELECT policies are now `TO authenticated` plus a family-membership check.
Verified afterwards that anonymous listing returns `[]` at both the bucket root
and inside a known family folder, and that `/object/public/...` still serves, so
the shipped iOS build and the unauthenticated share page were not regressed.
Direct fetch of a known URL is still possible by design -- that is what signed
URLs would fix.

Also worth knowing: the web app's rate limiting is in-memory, which doesn't
hold across serverless instances. It's a speed bump, not a control, until it's
backed by something shared.

## Not applicable any more

The archived `IOS_SECURITY_ISSUES.md` findings about missing API endpoints,
form-data user spoofing, and R2 credentials are either fixed or describe code
that was deleted. The audit "scores" in the archived docs are marketing, not
measurements.
