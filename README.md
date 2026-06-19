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
- visible sources and confidence notes throughout the learning experience;
- a mobile-first installable web app with offline learning support.

The current version deliberately does not classify photos automatically and
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

## iOS

The iPhone application packages the complete production experience in a native
Capacitor shell. It uses the same Romie/Roobert typography, pink and olive
palette, content, and interactions as the public application; it does not load
the website at runtime.

```sh
npm run ios:assets
npm run ios:build
npm run ios:open
```

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

<https://jakiesluchawki.github.io/cloud-recognition/>

The project is tracked with the Lore Framework under `lore/`.
