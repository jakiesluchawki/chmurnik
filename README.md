# CLOUD RECOGNITION

Polish, source-backed education for learning to identify clouds and understand
the weather from first observation through advanced aviation interpretation.

The application includes:

- adaptive knowledge placement instead of forcing everyone through lesson one;
- a WMO-based encyclopedia with 10 genera and 49 formal taxonomy terms;
- an evidence-based field observer with three transparent hypotheses;
- a differential comparison laboratory for two or three cloud genera;
- nine full lessons with honest time plans, sourced chapters, worked examples,
  chapter-by-chapter mobile focus, active recall, module-specific practice,
  checks, and an adaptive recognition review map;
- aviation weather: METAR/TAF, ceilings, icing, turbulence, convection, and
  thunderstorms;
- an independent laboratory for AGL, MSL, pressure levels, geopotential
  height, and the vertical layers used in Windy;
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

## Publishing

The public application is deployed at:

<https://jakiesluchawki.github.io/cloud-recognition/>

The project is tracked with the Lore Framework under `lore/`.
