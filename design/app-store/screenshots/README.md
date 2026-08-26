# App Store Screenshot Provenance

Five unretouched screenshots of the bundled Release application in an
isolated iPhone 17 Pro Max simulator, iOS 26.5, 1320 x 2868 pixels. All are
opaque sRGB PNG files. `manifest.json` records their SHA-256 hashes and
original XCTest attachments. Files were copied byte-for-byte, not composited.

The captures represent candidate `1.0 (20260826214336)`. The simulator and
signed archive contain the same final production code/assets; the screenshots
do not claim to have been captured on physical hardware or in TestFlight.
The on-device model really ran on the selected photograph. No result, model
confidence, weather observation or application UI was injected for marketing.

## Order

1. `01-dzis.png`: native Today entry point and existing felt observer artwork.
2. `02-moje-niebo.png`: saved Cirrus photograph with the real, uncertain model
   hypothesis, kept separate from the observer's own identification.
3. `03-atlas.png`: Cirrus reference monograph with the real photograph.
4. `04-wiatr.png`: interactive apparent-wind teaching tool.
5. `05-taf.png`: pasted KLVM forecast, with distinct FM and PROB30 periods.

## Photograph Credit

The Cirrus photograph visible in screenshots 2 and 3 is **CirrusField-color.jpg**
by **PiccoloNamek at English Wikipedia**, licensed under **CC BY-SA 3.0**.

- Source: https://commons.wikimedia.org/wiki/File:CirrusField-color.jpg
- License: https://creativecommons.org/licenses/by-sa/3.0/
- Display changes: resizing and viewport cropping inside the application;
  saved observation copies are recompressed without source EXIF/GPS.
- The photograph and its adapted photographic portions remain under the
  same license. The credit does not imply the photographer endorses CHMURNIK.

The App Store description includes this attribution, source, license and
changes notice. The atlas also retains its in-app credit. This credit does
not grant rights to unrelated application artwork, fonts or trademarks.

The owner confirmed the existing Romie and Roobert font licenses for app
embedding on 2026-08-26. No private receipts are included in the repository.

## Capture Verification

- Tests 01-03 passed in run 11; the store capture case passed in run 12.
- After refining the test-only scroll gesture, all four cases passed together
  in `build/app-store-ui-13.xcresult` with zero failures.
- Real photographic cloud references are unchanged. Felt illustrations
  explain atmospheric concepts and are never identification evidence.
