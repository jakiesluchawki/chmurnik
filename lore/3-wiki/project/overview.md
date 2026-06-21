# Project Overview

Cloud Recognition is a public Polish React and Vite progressive web
application for learning cloud identification and vertical weather analysis.

## Current Product

- Adaptive five-question placement or an explicit beginner start.
- Nine learning modules from visual observation to aviation hazards and WMO
  expert classification.
- Complete ten-genus WMO atlas plus 49 formal terms covering species,
  varieties, supplementary features, accessory clouds, mother-cloud notation,
  special clouds, and upper-atmosphere classes. One ranked search presents
  genus monographs and formal terms as distinct classification levels.
- Professional genus monographs explain formation, microphysics, weather,
  aviation significance, evolution, optics, look-alikes, and field procedure.
- Visual decision key, difficult cases, global adaptive four-choice image
  practice, local progress, and a private local observation journal.
- The iOS application includes an experimental, fully on-device photo
  assistant. It leads with an aggregated cloud family, preserves three genus
  hypotheses, exposes uncertainty, and sends no photograph to a server.
- Interactive AGL/MSL and pressure-level laboratory plus METAR/TAF, icing,
  turbulence, convection, CAPE, Skew-T, and cloud-motion wind interpretation.
- Practical Windy layer decoder covering pressure-level wind, temperature,
  humidity, cloud bands, cloud base, cloud tops, rain and thunderstorms, and
  CAPE. It generates a complete interpretation sentence from pressure,
  terrain, and cloud-band controls and pairs every field with a four-choice
  reasoning check.
- Contextual source drawers anchored in WMO, FAA, EASA, NOAA AWC, Windy
  interface documentation, and Wikimedia Commons file records.

## Architecture

- React 19, Vite 6, static hash routes, and no backend.
- Local Romie and Roobert fonts plus Phosphor icons.
- Local storage for learner profile, progress, and journal entries.
- Web manifest and service worker for installable and runtime offline use.
- GitHub Actions test/build pipeline and GitHub Pages deployment from `main`.
- Daily external-link monitoring checks registered sources and photograph
  provenance for HTTP errors, soft 404 pages, and semantically wrong redirects.

## Public Release

- Application: <https://chmurnik.cloud/>
- Repository: <https://github.com/jakiesluchawki/chmurnik>
- Legacy application address: <https://jakiesluchawki.github.io/cloud-recognition/>
- Visual QA: `design-qa.md` with `final result: passed`.

Recognition research, model provenance, benchmarks, and implementation notes
are tracked in active task 0002.
