#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
RELEASE_DIR="$ROOT/release"
CYBERFOLKS_ZIP="$RELEASE_DIR/chmurnik-cyberfolks.zip"

cd "$ROOT"
npm test
npm run check:lessons
npm run check:links

rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

npm run build
(
  cd dist
  zip -q -r "$CYBERFOLKS_ZIP" .
)

npm run build:pages

printf '\nReady:\n  Cyber_Folks: %s\n  GitHub Pages build: %s\n' \
  "$CYBERFOLKS_ZIP" \
  "$ROOT/dist"
