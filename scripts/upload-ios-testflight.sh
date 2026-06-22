#!/bin/sh
set -eu

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
PROJECT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
IOS_PROJECT="$PROJECT_DIR/ios/App/App.xcodeproj"
SCHEME="App"
EXPECTED_TEAM="${CHMURNIK_IOS_TEAM_ID:-78N6WG8P57}"
EXPECTED_BUNDLE_ID="${CHMURNIK_IOS_BUNDLE_ID:-cloud.chmurnik.app}"
RELEASE_ROOT="${CHMURNIK_IOS_TESTFLIGHT_DIR:-$PROJECT_DIR/.local/releases/testflight}"
BUILD_NUMBER="${CHMURNIK_IOS_BUILD_NUMBER:-$(date -u '+%Y%m%d%H%M%S')}"
BUILD_STAMP=$(date '+%Y%m%d-%H%M%S')
WORK_DIR="$RELEASE_ROOT/$BUILD_STAMP"
ARCHIVE_PATH="$WORK_DIR/CHMURNIK.xcarchive"
DERIVED_DATA="$WORK_DIR/DerivedData"
EXPORT_DIR="$WORK_DIR/upload"
EXPORT_OPTIONS="$WORK_DIR/ExportOptions-TestFlight.plist"
ARCHIVE_LOG="$WORK_DIR/archive.log"
UPLOAD_LOG="$WORK_DIR/upload.log"

fail() {
  printf 'CHMURNIK TestFlight upload failed: %s\n' "$1" >&2
  exit 1
}

command -v xcodebuild >/dev/null 2>&1 || fail "Xcode command line tools are unavailable."

KEY_PATH="${CHMURNIK_ASC_KEY_PATH:-}"
KEY_ID="${CHMURNIK_ASC_KEY_ID:-}"
ISSUER_ID="${CHMURNIK_ASC_ISSUER_ID:-}"

if [ -n "$KEY_PATH$KEY_ID$ISSUER_ID" ]; then
  [ -n "$KEY_PATH" ] && [ -n "$KEY_ID" ] && [ -n "$ISSUER_ID" ] \
    || fail "set CHMURNIK_ASC_KEY_PATH, CHMURNIK_ASC_KEY_ID and CHMURNIK_ASC_ISSUER_ID together."
  [ -f "$KEY_PATH" ] || fail "App Store Connect API key does not exist: $KEY_PATH"
fi

mkdir -p "$WORK_DIR" "$EXPORT_DIR" "$DERIVED_DATA"

cat >"$EXPORT_OPTIONS" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>destination</key>
  <string>upload</string>
  <key>manageAppVersionAndBuildNumber</key>
  <false/>
  <key>method</key>
  <string>app-store-connect</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>stripSwiftSymbols</key>
  <true/>
  <key>teamID</key>
  <string>$EXPECTED_TEAM</string>
  <key>uploadSymbols</key>
  <true/>
</dict>
</plist>
EOF

AUTHENTICATION_ARGS=""
if [ -n "$KEY_PATH" ]; then
  AUTHENTICATION_ARGS="-authenticationKeyPath $KEY_PATH -authenticationKeyID $KEY_ID -authenticationKeyIssuerID $ISSUER_ID"
fi

cd "$PROJECT_DIR"
npm run ios:sync

# Word splitting is intentional for the optional three-part authentication args.
# shellcheck disable=SC2086
if ! xcodebuild \
  -project "$IOS_PROJECT" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  -derivedDataPath "$DERIVED_DATA" \
  -allowProvisioningUpdates \
  $AUTHENTICATION_ARGS \
  CURRENT_PROJECT_VERSION="$BUILD_NUMBER" \
  archive >"$ARCHIVE_LOG" 2>&1; then
  tail -n 100 "$ARCHIVE_LOG" >&2
  fail "signed archive did not succeed."
fi

APP_PATH="$ARCHIVE_PATH/Products/Applications/App.app"
[ -d "$APP_PATH" ] || fail "application bundle is missing from the archive."
ACTUAL_BUNDLE_ID=$(/usr/libexec/PlistBuddy -c "Print:CFBundleIdentifier" "$APP_PATH/Info.plist")
ACTUAL_BUILD_NUMBER=$(/usr/libexec/PlistBuddy -c "Print:CFBundleVersion" "$APP_PATH/Info.plist")
[ "$ACTUAL_BUNDLE_ID" = "$EXPECTED_BUNDLE_ID" ] \
  || fail "expected bundle $EXPECTED_BUNDLE_ID, found $ACTUAL_BUNDLE_ID."
[ "$ACTUAL_BUILD_NUMBER" = "$BUILD_NUMBER" ] \
  || fail "expected build $BUILD_NUMBER, found $ACTUAL_BUILD_NUMBER."

# shellcheck disable=SC2086
if ! xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -allowProvisioningUpdates \
  $AUTHENTICATION_ARGS >"$UPLOAD_LOG" 2>&1; then
  tail -n 100 "$UPLOAD_LOG" >&2
  fail "App Store Connect upload did not succeed."
fi

printf '%s\n' "CHMURNIK TestFlight upload: OK"
printf 'Team: %s\n' "$EXPECTED_TEAM"
printf 'Bundle: %s\n' "$ACTUAL_BUNDLE_ID"
printf 'Build: %s\n' "$ACTUAL_BUILD_NUMBER"
printf 'Archive: %s\n' "$ARCHIVE_PATH"
printf '%s\n' "The build can take several minutes to finish processing in App Store Connect."
