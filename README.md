# CHMURNIK

Polish, source-backed education for learning to identify clouds and understand
the weather from first observation through advanced aviation interpretation.

The application includes:

- adaptive knowledge placement instead of forcing everyone through lesson one;
- a WMO-based encyclopedia with 10 genera, 49 formal taxonomy terms, and one
  ranked search across names, codes, Polish aliases, morphology, diagnostic
  clues, and classification levels;
- an interactive WMO nomenclature workshop that constructs complete names,
  catches contradictory varieties, and separates visible morphology from
  origin claims requiring observation history;
- a three-frame diagnostic gallery in every genus monograph, with observation
  before explanation and complete photograph provenance;
- an evidence-based field observer with three transparent hypotheses;
- a differential comparison laboratory for two or three cloud genera;
- nine full lessons with honest time plans, sourced chapters, worked examples,
  chapter-by-chapter mobile focus, active recall, module-specific practice,
  checks, and an adaptive recognition review map;
- aviation weather: complete METAR anatomy, active METAR/TAF decoding,
  three-station briefings, transparent local spaced review, ceilings, icing,
  turbulence, convection, and thunderstorms;
- an independent laboratory for AGL, MSL, pressure levels, geopotential
  height, and the vertical layers used in Windy;
- a practical Windy decoder for eight common overlays, with reference frames,
  comparison fields, interpretation traps, and four-choice reasoning checks;
- an interactive Skew-T laboratory with four contrasting vertical profiles,
  log-pressure projection, parcel paths, cloud layers, wind, aviation readings,
  uncertainty notes, and interpretation checks;
- an experimental private, on-device Apple-platform photo assistant that presents
  evidence-led cloud families and uncertain genus hypotheses;
- visible sources and confidence notes throughout the learning experience;
- a mobile-first installable web app with offline learning support.

Photo analysis is available only in the native app, never uploads an
image, and is never presented as an authoritative diagnosis. The application
includes no voice or audio system.

## Development

```sh
npm install
npm run dev
```

## Quality gate

```sh
npm test
npm run check:lessons
npm run check:links
npm run build
```

The versioned `build-quality-lesson` skill under `.codex/skills/` defines the
content contract for every new or revised lesson.

## iPhone And iPad

The universal iPhone/iPad application packages the complete experience in a native
Capacitor shell. It uses the same Romie/Roobert typography, pink and olive
palette, content, and interactions as the public application; it does not load
the website at runtime.

iPhone stays portrait-first. iPad supports both orientations, resizable windows,
and a two-column home screen; wide windows gain persistent navigation. The
collection remains local to each installation, with explicit backup/import,
not automatic synchronization between devices.

```sh
npm run ios:assets
npm run ios:build
npm run ios:open
```

An iOS Simulator build cannot be installed on a physical iPad. Signing,
device acceptance and a new TestFlight/App Store build remain separate release
steps; enabling iPad support in source does not publish an App Store update.

## macOS (Mac Catalyst)

```sh
npm run macos:build
open build/macos/Build/Products/Debug-maccatalyst/App.app
```

Requires macOS, Xcode with the iOS SDK, Node dependencies, and network access
for the first dependency checkout. The script pins official Capacitor 8.4.1
source because its binary Swift package does not contain a Catalyst slice.
It builds local Capacitor/Cordova frameworks and generates `build/mac-app`
without patching the iOS package graph or `node_modules`. On a Capacitor upgrade,
review the pinned source revision before changing it.

The resulting `.app` is an ad-hoc signed **local development build**, not a
notarized download or Mac App Store submission. The Mac app uses a system file
picker instead of requiring a camera or Photos library access. Selected images
are limited to 30 MB, downsampled and analyzed locally. The sandbox permits
user-selected files and outgoing connections for explicitly opened map sources.
Backup export uses the Mac Save panel. Import uses a native JSON picker with
the existing 50 MB limit and non-overwriting merge validation.

In the native app, Command-1 through Command-7 open Today, My Sky, Atlas,
Lessons, METAR/TAF, Wind and Layers. Shortcuts do not run inside text fields or
while a modal is open. The Mac window has a 760 x 600 minimum size; the persistent
sidebar appears from 1100 px. Its local collection is independent of iPhone/iPad.

### Distribution

The release target is `cloud.chmurnik.app`, version `1.0`, for Apple team
`78N6WG8P57`. A TestFlight release requires either an Apple Account with App
Store Connect access in Xcode or all three App Store Connect API variables:

```sh
CHMURNIK_ASC_KEY_PATH=/path/to/AuthKey_ABC123.p8 \
CHMURNIK_ASC_KEY_ID=ABC123 \
CHMURNIK_ASC_ISSUER_ID=00000000-0000-0000-0000-000000000000 \
npm run release:ios:testflight
```

## Publishing

The public application is deployed at:

<https://chmurnik.cloud/>

The earlier project address remains available at:

<https://jakiesluchawki.github.io/chmurnik/>

Prepare both web targets with one local command:

```sh
npm run release:web
```

The command runs the automated checks, creates the Cyber_Folks package at
`release/chmurnik-cyberfolks.zip`, and verifies the GitHub Pages subpath build.
Upload the ZIP contents only to the isolated
`domains/chmurnik.cloud/public_html` document root.

The project is tracked with the Lore Framework under `lore/`.
