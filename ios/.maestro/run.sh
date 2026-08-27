#!/usr/bin/env bash
# Runs the Maestro flows from a genuinely clean slate.
#
# `clearState: true` wipes the app container but NOT the Keychain, and Supabase
# keeps its session there -- so a rerun can start already signed in and the very
# first assertion ("Welcome Back!") fails for reasons that have nothing to do
# with the app. Uninstalling clears both.
set -euo pipefail

# A simulator dedicated to these runs. Maestro drives the UI through Apple's
# XCTAutomationSupport, which segfaults SpringBoard intermittently on this
# OS/Xcode pairing (the app is never in the stack). Two things keep that from
# hurting: it happens on a device nobody uses by hand, and every run starts from
# a fresh boot, since the crash gets more likely the longer a simulator has been
# up under automation.
DEVICE="${DEVICE:-KidCanvas Tests}"
DEVICE_TYPE="com.apple.CoreSimulator.SimDeviceType.iPhone-17"
BUNDLE=Siegel.KidCanvas
DD="${DD:-/tmp/kidcanvas-dd}"

cd "$(dirname "$0")/.."
export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home)}"

UDID=$(xcrun simctl list devices -j | python3 -c "
import json,sys
for devs in json.load(sys.stdin)['devices'].values():
    for d in devs:
        if d['name']=='$DEVICE' and d.get('isAvailable'): print(d['udid']); sys.exit()
")
if [ -z "$UDID" ]; then
  # Pinned on purpose. Both the current and the beta iOS runtimes ship a full
  # device set, so "the runtime the stock iPhone 17 uses" is ambiguous and once
  # picked the beta, where the flows fail for beta-UI reasons. Override with
  # IOS_RUNTIME=... when the app moves forward.
  RUNTIME="${IOS_RUNTIME:-com.apple.CoreSimulator.SimRuntime.iOS-26-5}"
  xcrun simctl list runtimes | grep -q "$RUNTIME" || { echo "runtime $RUNTIME not installed"; exit 1; }
  echo "Creating simulator '$DEVICE' ($RUNTIME)..."
  UDID=$(xcrun simctl create "$DEVICE" "$DEVICE_TYPE" "$RUNTIME")
fi
xcrun simctl shutdown "$UDID" 2>/dev/null || true
xcrun simctl boot "$UDID"
xcrun simctl bootstatus "$UDID" -b >/dev/null

# Derived data goes OUTSIDE the repo on purpose: building into ios/build writes
# ~17,000 files, which once pushed a `vercel --prod` upload past its file limit.
xcodebuild -project KidCanvas.xcodeproj -scheme KidCanvas \
  -destination "id=$UDID" \
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

maestro --device "$UDID" test "${1:-.maestro}"
