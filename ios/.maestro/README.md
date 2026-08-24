# Maestro flows — WORK IN PROGRESS

Playwright covers the web app and is green (46 tests). These iOS flows are **not
finished**: `01-launch` passes on a clean device, `02-onboarding` gets as far as
proving the first-run guide appears and then trips over test-fixture problems
rather than app bugs.

Treat this directory as scaffolding, not as a passing suite. Do not wire it into
CI until the state problem below is solved.

## Running

```bash
./.maestro/run.sh                    # build, clean install, run everything
./.maestro/run.sh .maestro/01-launch.yaml
```

Needs a JDK (`brew install --cask temurin`).

## The unsolved problem

Getting a genuinely fresh device. `clearState: true` wipes the app container but
not the Keychain, and Supabase keeps its session there, so a rerun starts already
signed in as whatever throwaway account the previous run created — and the first
assertion fails for reasons unrelated to the app. `run.sh` already tries
`simctl uninstall` followed by `simctl keychain reset` and that is still not
enough.

Next thing to try: `xcrun simctl erase` on a simulator dedicated to testing, or a
dedicated test Supabase project so accounts can be torn down between runs.

## What was learned building these (worth keeping)

- `assertVisible` takes no `timeout`; use `extendedWaitUntil`.
- `hideKeyboard` does not work against this app's inputs.
- Tapping a field that sits under the keyboard silently lands on the keyboard,
  and the text goes into whichever field still had focus. The whole signup ended
  up concatenated into Family Name. **This was a real app problem too** — there
  was no way to advance or dismiss, so `AuthView` now chains focus and Return
  moves between fields.
- Maestro matches the full string, so a step rendered as "1. Add an artist" needs
  `".*Add an artist.*"`.
- "Create Account" and "Sign Out" each label two elements, so those taps need an
  index. Worth considering accessibility identifiers instead.

## Accounts

`02-onboarding` signs up a throwaway account with a generated address. Those
accumulate in the production Supabase project — delete them, and consider
pointing these flows at a separate project before running them often.

Do not use the App Review demo account: it is pre-seeded with children, so the
first-run guide will not appear.

## Build note

`run.sh` builds to `/tmp/kidcanvas-dd`, deliberately outside the repo. Building
into `ios/build` writes ~17,000 files, which pushed a `vercel --prod` upload past
its 15,000-file limit.
