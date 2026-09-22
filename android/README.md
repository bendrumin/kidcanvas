# KidCanvas for Android

Kotlin + Compose, talking to the same Supabase project as iOS and the web:
straight to Postgres with row-level security deciding what each query returns.
There is no API server in between, so Android needed no backend changes at all.

## Build

```bash
cp supabase.properties.example supabase.properties   # fill in the two public values
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
  ./gradlew :app:assembleDebug
```

JDK 21, not 26: Android Gradle Plugin 8.13 does not accept 26. The dependency
versions are pinned to the newest line that still compiles against SDK 36,
because the command-line SDK here has no platform 37 (same constraint ChoreStar
documented).

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
| `data/Models.kt` | Artwork, Child, Family, mirroring the Postgres columns |
| `data/KidCanvasRepository.kt` | queries; no family filter, because RLS already scopes them |
| `ui/auth/` | sign in and sign up |
| `ui/gallery/` | the gallery, with the story shown on each piece |

## Still to port from iOS

Scanner (ML Kit document scanner is the VisionKit equivalent), upload, the
family feed, reactions and comments, invites, settings, and story nudges
(WorkManager rather than UNUserNotificationCenter).
