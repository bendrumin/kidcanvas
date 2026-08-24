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

xcrun simctl uninstall "$UDID" "$BUNDLE" 2>/dev/null || true
# Uninstalling does not remove Keychain items on the simulator, and that is where
# Supabase stores the session -- so without this the app relaunches already
# signed in as whatever throwaway account the last run created.
xcrun simctl keychain "$UDID" reset 2>/dev/null || true
xcrun simctl install "$UDID" "$DD/Build/Products/Debug-iphonesimulator/KidCanvas.app"

maestro test "${1:-.maestro}"
