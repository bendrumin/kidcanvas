# Maestro flows

UI tests that drive the real app on a simulator. Playwright covers the web app;
these cover iOS. **Both flows pass.**

## Running

```bash
./.maestro/run.sh                    # cleanup, build, clean install, run all
./.maestro/run.sh .maestro/01-launch.yaml
```

Needs a JDK (`brew install --cask temurin`) and, for the account cleanup,
a `supabase login`.

## What each flow proves

| Flow | Guards against |
|---|---|
| `01-launch` | crash on cold start; sign-in screen renders |
| `02-onboarding` | a new account landing on an empty gallery with no guidance — signs up a real throwaway account, asserts the first-run guide appears, and that its CTA leads to Add Child |

## Hard-won facts about this setup

- **Flow order is not guaranteed.** Each flow must tolerate the state the others
  leave behind. Both start by dismissing onboarding and signing out if needed.
- **`clearState` does not clear the Keychain**, where Supabase keeps its session.
  `run.sh` deletes previous runs' accounts server-side (scoped to
  `maestro-%@example.com`), which invalidates those sessions properly — and the
  app now verifies sessions with the server on launch, so a deleted account falls
  back to sign-in instead of ghosting. That app fix came out of this suite.
- **iOS offers to save the password after signup**; the system dialog covers
  everything, so `02` dismisses it conditionally.
- `assertVisible` takes no `timeout` — use `extendedWaitUntil`.
- `hideKeyboard` does not work against these inputs. The app now chains focus so
  Return advances through the sign-up form — also a real fix, since the keyboard
  covered the Email and Password fields with no way to reach them.
- Maestro matches whole strings: a step rendered "1. Add an artist" needs
  `".*Add an artist.*"`. "Create Account" and "Sign Out" each appear twice, so
  those taps use an index.

## Accounts

`02-onboarding` generates `maestro-<timestamp>@example.com` per run; `run.sh`
deletes them at the start of the next run. They live in the production Supabase
project — a dedicated test project would be better before running this in CI.

Do not use the App Review demo account: it is pre-seeded with children, so the
first-run guide will not appear.

## Build note

`run.sh` builds to `/tmp/kidcanvas-dd`, deliberately outside the repo. Building
into `ios/build` writes ~17,000 files, which once pushed a `vercel --prod`
upload past its 15,000-file limit.
