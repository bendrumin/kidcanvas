# KidCanvas for Android

Kotlin + Compose, talking to the same Supabase project as iOS and the web:
straight to Postgres with row-level security deciding what each query returns.
There is no API server in between, so Android needed no backend changes at all.
Every query is a port of one in `ios/KidCanvasApp/Managers/ArtworkService.swift`
or `AuthManager.swift`, with the same tables, filters and ordering.

## Build

```bash
cp supabase.properties.example supabase.properties   # fill in the two public values
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
./gradlew :app:assembleDebug --console=plain          # app/build/outputs/apk/debug/app-debug.apk
./gradlew :app:bundleRelease --console=plain          # app/build/outputs/bundle/release/app-release.aab
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` can also come from the environment.

JDK 21, not 26: Android Gradle Plugin 8.13 does not accept 26. The dependency
versions are pinned to the newest line that still compiles against SDK 36,
because the command-line SDK here has no platform 37.

The release build runs R8 (minify and resource shrinking), which takes several
minutes. It prints about 900 "error occurred when parsing kotlin metadata"
warnings: Kotlin 2.3.21 is newer than the R8 inside AGP 8.13. Pinning R8
8.13.24 or 9.0.53 did not silence them. They are harmless here because the app
uses no kotlin-reflect, and the minified build was installed and run on the
emulator (feed, detail, add, profile all loaded live data). Moving to AGP 9
removes them.

### Release signing

Nothing secret is in this repo, and no keystore is. `bundleRelease` signs only
when all four of these are set, as Gradle properties (put them in
`~/.gradle/gradle.properties`, never in this directory) or environment
variables:

```properties
KIDCANVAS_UPLOAD_STORE_FILE=/absolute/path/to/kidcanvas-upload.jks
KIDCANVAS_UPLOAD_STORE_PASSWORD=...
KIDCANVAS_UPLOAD_KEY_ALIAS=upload
KIDCANVAS_UPLOAD_KEY_PASSWORD=...
```

Without them the bundle still builds, **unsigned**, and Gradle prints
`WARNING: KidCanvas release is UNSIGNED`. Play Console rejects an unsigned
bundle, so that warning is the signal to stop.

Create the upload key once, and back it up somewhere other than this laptop
(a password manager's file attachment works):

```bash
keytool -genkeypair -v -keystore ~/keys/kidcanvas-upload.jks \
  -alias upload -keyalg RSA -keysize 4096 -validity 10000
```

With Play App Signing (the default for new apps), Google holds the key that
signs what users install. This one only proves uploads come from you, and a
lost upload key can be reset through Play support.

## Run on the emulator

```bash
export PATH=/opt/homebrew/share/android-commandlinetools/platform-tools:$PATH
adb -s emulator-5554 install -r app/build/outputs/apk/debug/app-debug.apk
adb -s emulator-5554 shell am start -n app.kidcanvas/.MainActivity
```

`adb shell input text` silently drops `!`, so a password containing one has to
be typed in parts with `input keycombination 59 8` for that character.

## What is here

| | |
|---|---|
| `data/SupabaseModule.kt` | the shared client (auth, postgrest, storage) |
| `data/Models.kt` | Artwork, Child, Family, FamilyMember, comments, the five reactions |
| `data/KidCanvasRepository.kt` | every query, ported from iOS |
| `data/StoryTemplates.kt` | the 18 story prompts, same ids and openers as iOS |
| `data/ImageEncoding.kt` | full image under 10MB plus a 500px thumbnail, same ladder as iOS |
| `ui/SessionViewModel.kt` | current family, role, artists; the iOS loadFamily self-heal |
| `ui/auth/` | sign in, sign up (name and family name, as iOS) |
| `ui/feed/` | "Recently": newest first, the story leads each post, reactions |
| `ui/gallery/` | grid of everything, with an all/favorites filter |
| `ui/artwork/` | detail: story, date, age, favorite, reactions, comments, add a story |
| `ui/add/` | ML Kit scanner or photo picker, then title, artist, date, story, upload |
| `ui/family/` | invite codes, join by code, members and removal, add artist |
| `ui/profile/` | account, artists, family switcher, privacy, sign out, delete account |
| `fastlane/metadata/android/en-US/` | Play listing draft |
| `DATA_SAFETY.md` | answers for Play's Data safety form |

Storage paths match iOS and the web: `{familyId}/{artworkId}.jpg` and
`{familyId}/{artworkId}_thumb.jpg`, lowercase, in the public `artworks` bucket.

The scanner is ML Kit's document scanner in base-with-filter mode. It runs on
the device inside Google Play services and only finds the page, crops and
straightens it. There is no cloud AI and no ML "clean up" of the drawing.

### Where Android deliberately differs from iOS

- Favorite, story and comment-delete writes ask for the row back. PostgREST
  reports a write that RLS refused as success with zero rows, so iOS can show
  a change that did not happen; Android reverts and says why.
- Account deletion removes storage files only for families the user **owns**.
  iOS clears the current family's folder whatever the role, so a grandparent
  deleting their account would erase images from a family they only belong to.
  Worth fixing on iOS.
- The chosen family is remembered, and joining by code switches to the family
  just joined. iOS takes the first membership, which is unpredictable for
  someone in two families.
- Leaving a family reloads into another one instead of signing out.
- The story nudge's "Growth moment" opener has no em dash (house style).
- Comments can be reported (opens an email to support with the ids), for
  Play's user-generated content policy.

## Still to port from iOS

Search, story nudges (WorkManager rather than UNUserNotificationCenter),
deleting artwork, renaming or deleting a family, and onboarding.

## Play Console checklist (owner)

Nothing below has been done; every step needs your Google account.

1. **Developer account.** Sign up at play.google.com/console ($25 one-time).
   Choose a personal or organization account; organization needs a D-U-N-S
   number. Complete identity verification, which can take a few days.
   New personal accounts must run a closed test with at least 12 testers for
   14 days before production access; internal testing has no such wait.
2. **Create the app.** All apps, Create app: name `KidCanvas: Kids Art
   Stories`, default language English (United States), App, Free. Accept the
   declarations.
3. **Upload key.** Generate it (see Release signing), set the four properties,
   run `./gradlew :app:bundleRelease --console=plain`, and confirm there is no
   UNSIGNED warning.
4. **Internal testing.** Testing, Internal testing, Create new release. Accept
   Play App Signing. Upload `app/build/outputs/bundle/release/app-release.aab`.
   Release notes: `fastlane/metadata/android/en-US/changelogs/1.txt`. Add a
   tester email list, save, roll out, and open the opt-in link on a phone.
5. **Store listing.** Paste `title.txt`, `short_description.txt` and
   `full_description.txt`. App icon: `images/icon.png` (512 x 512). Still
   needed: a **feature graphic** (1024 x 500 PNG or JPEG) and at least **two
   phone screenshots** (take them from a signed-in debug build). Category:
   Parenting. Contact email: support@kidcanvas.app. Website: kidcanvas.app.
6. **App content** (Policy, App content):
   - Privacy policy: `https://kidcanvas.app/privacy`. Check that it mentions
     the Android app and Google ML Kit's diagnostics.
   - Ads: No.
   - App access: some features are restricted. Give reviewers the existing
     review account's email and password, and say invites need an owner.
   - Target audience: 18 and over (see `DATA_SAFETY.md` for why).
   - Content rating: fill in the questionnaire; users interact and share
     content inside invite-only family groups.
   - Data safety: answer from `DATA_SAFETY.md`, including the ML Kit rows.
   - Account deletion: Play wants a **web URL** that explains how to delete an
     account without the app. `kidcanvas.app/dashboard/settings` requires
     sign-in, so add a public page (for example `kidcanvas.app/delete-account`)
     that explains in-app deletion, web deletion, and emailing support.
   - Government apps, financial features, health: No.
7. **Countries.** Select where it is available.
8. **Every later upload:** raise `versionCode` in `app/build.gradle.kts`
   (and `versionName`), rebuild, upload. Play refuses a repeated versionCode,
   even to internal testing.
