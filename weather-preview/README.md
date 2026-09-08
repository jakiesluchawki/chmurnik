# Weather playground: review-only prototype

Separate React/Vite entry. The normal production build and native sync never
import it. `npm run weather:build` writes only `build/weather-preview`;
`npm run weather:preview` serves that build. The Pages workflow adds it at
`/chmurnik/pogoda-preview/`. No new production navigation item is introduced.

## Educational contract

This is a two-experiment workshop prototype, not a newly advertised full lesson.
No lesson-duration claim is made. Full source-backed lessons remain accessible
via the existing `#/learn/wiatr` and `#/learn/procesy` routes.

Observable outcomes: compare land/water temperatures; identify the surface and
return branches of the local breeze; compare condensation height at fixed
initial temperature and different humidity; retain and replay exact A/B inputs.
Guided practice includes four plausible choices, an actual condition-change
gate, concealed explanatory feedback, replay and four-point recaps. Prediction
mode does not render saved comparisons or further-reading links that could
reveal the answer. No completion score is granted merely for moving controls.

## Model assumptions

- Breeze: prescribed smooth daily temperatures about 20 C with land amplitude
  10 C and water amplitude 1.5 C, peak hours 14 and 17. The contrast control
  scales both amplitudes. This is an illustrative cycle, NOT a fitted or
  numerical surface energy-budget model. Flow direction follows the sign of
  land minus water temperature; differences below 0.3 C are a display deadband.
  No physical wind-speed output. Ignore external wind, terrain and rotation.
- Parcel: Magnus dew point (17.625 / 243.04 coefficients); approximate LCL
  125*(T-Td) metres AGL. Below LCL, parcel T cools at9.8 K/km and Td at1.8 K/km.
  Above LCL use an explicitly simplified6 K/km saturated lapse rate. The real
  moist rate varies with state. Keep LCL outside the3000m scene as unknown there,
  never clamp a high base to the top edge. Artificial lifting does not establish
  natural buoyancy, a cloud-top height, genus, rainfall or thunderstorm risk.
- Generated felt images are explanatory artwork, never classification photos.
- Controls operate locally. No weather API, photo upload, microphone, tracking
  endpoint or account. Versioned localStorage key is exclusive to this preview;
  failed writes are reported, inputs are validated, outputs are recalculated.
- The calculations work without network once loaded; this preview does not
  install a service worker or promise offline reload/installability.

## Sources

- NWS, Lake Shadow/Breeze: https://www.weather.gov/bgm/WeatherInActionLakeShadowBreeze
- Met Office, Convection: https://weather.metoffice.gov.uk/learn-about/weather/how-weather-works/what-is-convection
- Forecasters Reference Book (NWS-hosted): https://www.weather.gov/media/zhu/ZHU_Training_Page/Met_Tutorials/Forecasters_Reference_Book_1997.pdf

## Visual source

Existing CHMURNIK fonts, wordmark and pink/olive/violet palette. New generated
felt coast plate and alpha cloud asset; scientific overlays are deterministic
data graphics. Motion can be paused; reduced-motion preference disables smooth
transitions and flow animation. Narrow layouts keep the scene visible while
the user reaches the controls. Arrow/plus/minus buttons supplement sliders.

## Publishing boundary

Owner approval is required before integration with chmurnik.cloud or Apple.
Do not mix this feature with pending native hotfix0042 or classifier research.
