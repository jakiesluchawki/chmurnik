# Beginner Walkthrough Follow-up - 2026-09-08

## Implemented

- Three walkthroughs, 11 verified learner actions in total: breeze (3),
  lifted parcel (4), nighttime cooling (4). Beginner mode is the default.
- Each step names a control, states what to watch, exposes only the relevant
  input, and explains the effect after the requested value is reached. An
  exact-value button complements the slider. Next is locked until completion.
- Back reconstructs earlier conditions; restarting resets the guide, not
  saved comparisons. Moving forward scrolls to the new instructions on mobile.
- Independent free exploration, A/B records and four-option assessments remain.
  Pre-attempt comparison records, recap and lesson follow-up stay concealed.
- Fog is a fixed-pressure saturation demonstration. No predicted visibility,
  fog depth, timing or claim of certain real-world fog. The background and
  overlay are illustrative, not photographic identification evidence.
- Pages-only entry links in wind / cloud-process lessons. The origin lesson
  is validated and retained when switching experiments. Existing lesson
  position storage is preserved. Native and custom-domain flags stay off.

## Verification

- 315 local tests pass, including 23 weather-model / tutorial / routing tests.
- All nine full lessons still meet the lesson quality contract.
- Separate weather, Pages and production-regression builds pass.
- Production JavaScript contains no weather-preview destination or simulation
  import. Its conditional lesson-link list is empty; CSS is inert without it.
- Browser: all 11 tutorial actions completed; completion/replay paths checked.
  Fog assessment: wrong prediction, twelve keyboard increments to 6 C, correct
  explanatory feedback. Initial controls and explanation remain locked.
- Local Pages roundtrip: processes lesson chapter 2 -> fog -> same lesson;
  after React restores its saved position, chapter 2 is active again.
- Mobile fixes: scroll to instruction on Next, remove duplicate calm labels,
  move condensation-line text outside the scene, keep the fog explanation
  below the illustration rather than obscuring the visible fog layer.
- Generated overlays preload so the first condensation is not delayed by
  fetching a previously unseen image.

- 320/390/820/1440 px: no horizontal overflow or off-screen controls in cloud
  and fog guides; all artwork loads. Desktop and phone captures are retained.
- Fog comparison A/B saved through keyboard activation at cooling 10 C and
  0 C; both corresponding outputs are shown. The browser connector intermittently
  times out dispatching focus/click events; no host/session restart was used.

## Public Verification

- Local implementation commit: 5d79d79. Scoped public cherry-pick: 8f27230.
- GitHub Pages run 34264573836 passed build, all public tests, lesson audit
  and deployment. No unrelated local native/reviewer work was published.
- Public preview and both new image URLs return HTTP 200. Preview HTML
  includes cloud/fog preloads and `index-DtcJ0btA.js`.
- Public browser: wind lesson chapter 2 -> breeze -> fog -> return to wind
  lesson, with chapter 2 restored. Default guide and all three tabs confirmed.
- Fog A/B entries at cooling 10 C and 0 C survived a full page navigation;
  both reappeared in free exploration, while the default guide stayed uncluttered.
- chmurnik.cloud HTML remains SHA256
  `4c44955a6c159492fb67de3bbaeef204242000aecd8dcd430877c0d3511bfd57`,
  with the same `index-DGckzKHS.js` bundle as before this work.

No physical iPad, native app, VoiceOver or offline-preview acceptance is claimed.
No change was uploaded to chmurnik.cloud, CyberFolks or Apple.

## Scientific Sources

- https://www.weather.gov/safety/fog-radiation
- https://about.metservice.com/learning/radiation-fog-s7gkj
- Existing coastal-circulation and parcel-lifting sources remain in each scene.
  Numerical guide outputs are calculated from the explicit simplified model,
  not copied observations or forecasts.

## Artwork Provenance

Built-in ImageGen, with the existing `weather-preview/public/coast.webp` as
style reference, followed by WebP encoding for delivery. No external API key.
Generated alpha is preserved. Project deliverables:

- `weather-preview/public/valley.webp` (1586 x 992)
- `weather-preview/public/fog.webp` (2172 x 724, alpha)

Valley prompt:

> Use case: scientific-educational. Create a new landscape background for
> CHMURNIK's interactive nighttime cooling experiment. Reference image is STYLE
> ONLY: preserve the beautiful mature wool-felt miniature studio material,
> fine tactile fibers, quiet olive/lavender/pink palette. New scene: sheltered
> grassy shallow valley at blue hour, a few small rounded felt shrubs on the
> outer edges. Clear dry air: NO FOG, NO CLOUDS, NO mist (interactive layer is
> added by software). Upper 65 percent is spacious clear dusky lavender-pink
> sky, ground horizon around 65 percent from top; gently rolling olive meadow
> occupies lower third, darkest olive foreground at bottom. Frontal slightly
> elevated miniature view, softly lit, sophisticated editorial design not
> cartoon. Ground and valley must remain visible. No labels, no text, no diagram
> arrows, no celestial bodies, no UI. Wide landscape 1600x1000-like aspect.
> Match reference craftsmanship and restrained palette.

Fog prompt:

> Create a single isolated low ground-fog layer as a transparent PNG educational
> scene overlay. Reference is STYLE only, same sophisticated soft wool felt
> miniature studio look. The fog is a very long, flat, thin horizontal veil of
> wispy ivory wool fibers, delicate near-transparent fringes and soft edges,
> floating across the ground. Overall width roughly four times thickness,
> full layer fits frame with empty margin. NOT individual cumulus clouds, NOT
> cotton balls, NOT mountains, NOT puffy domes. Think extremely thin teased wool
> gauze spreading horizontally over a meadow, gentle overlapping wisps,
> uniform ivory with very subtle lavender shadows. Only the fog veil, on a
> truly transparent background with actual alpha, no environment, no ground,
> no shadow cast on a backdrop, no text, no frame. Wide landscape asset.
