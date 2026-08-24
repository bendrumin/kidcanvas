#!/usr/bin/env bash
# Runs the Maestro flows from a genuinely clean slate.
#
# `clearState: true` wipes the app container but NOT the Keychain, and Supabase
# keeps its session there -- so a rerun can start already signed in and the very
# first assertion ("Welcome Back!") fails for reasons that have nothing to do
# with the app. Uninstalling clears both.
set -euo pipefail

DEVICE="${DEVICE:-iPhone 17}"
BUNDLE=Siegel.KidCanvas
DD="${DD:-/tmp/kidcanvas-dd}"

cd "$(dirname "$0")/.."
export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home)}"

UDID=$(xcrun simctl list devices available | grep "$DEVICE (" | head -1 | grep -oE '[0-9A-F-]{36}')
[ -n "$UDID" ] || { echo "no available simulator named '$DEVICE'"; exit 1; }
xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl bootstatus "$UDID" -b >/dev/null

# Derived data goes OUTSIDE the repo on purpose: building into ios/build writes
# ~17,000 files, which once pushed a `vercel --prod` upload past its file limit.
xcodebuild -project KidCanvas.xcodeproj -scheme KidCanvas \
  -destination "platform=iOS Simulator,name=$DEVICE" \
  -derivedDataPath "$DD" build >/dev/null

# Delete the accounts previous runs created. This is what actually makes the
# flows deterministic: uninstall and `simctl keychain reset` both leave the
# Supabase session behind, so the app relaunches signed in as the last throwaway
# account. Removing the account server-side invalidates that session, so the app
# falls back to the sign-in screen where every flow expects to start.
#
# Scoped to maestro-*@example.com so it can never touch a real account.
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if command -v supabase >/dev/null 2>&1; then
  echo "Removing accounts from previous runs..."
  # Run from the repo root: `--linked` reads supabase/.temp, which is not
  # reachable from ios/ where the rest of this script works.
  (cd "$REPO_ROOT" && supabase db query --linked "
    delete from family_members where user_id in
      (select id from auth.users where email like 'maestro-%');
    delete from families where id not in (select family_id from family_members)
      and created_by in (select id from auth.users where email like 'maestro-%');
    delete from auth.users where email like 'maestro-%';
  ") >/dev/null 2>&1 || echo "  (cleanup skipped -- run 'supabase login' to enable)"
fi

xcrun simctl uninstall "$UDID" "$BUNDLE" 2>/dev/null || true
xcrun simctl keychain "$UDID" reset 2>/dev/null || true
xcrun simctl install "$UDID" "$DD/Build/Products/Debug-iphonesimulator/KidCanvas.app"

maestro test "${1:-.maestro}"
