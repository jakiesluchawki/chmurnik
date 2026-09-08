# Continuous Weather Interaction

September 8 owner feedback: remove abrupt fog/cloud switches, make all three
experiments respond fluidly, replace system-looking slider knobs with meaningful
cloud/sun/moon handles. Scope remains the isolated Pages preview.

## Scientific Boundary

- [NWS radiation fog](https://www.weather.gov/safety/fog-radiation) describes
  saturation through cooling and subsequent thickening. This supports a gradual
  illustration, not a calibrated relation between temperature and visibility.
- Fog opacity is zero through the model saturation threshold, then grows with
  additional cooling. The exponential scale (1.5 degrees) is art direction, not
  a microphysics parameter. No pre-saturation haze is invented.
- Cloud opacity is zero through LCL, then increases over further lifting. The
  220 m opacity and 650 m size scales are illustrative, not cloud thickness.
- Breeze circulation fades to zero at the existing calm boundary; phase speed
  has the model's direction and qualitative strength, never units of m/s.
- Day/night lighting is a smooth illustrative cycle, not a local solar forecast.
- Existing thermodynamic equations and v1 trial storage remain unchanged.

## Interaction

The scene eases toward the exact control settings over a short, bounded period.
Each frame recalculates both the diagram and its local readouts from the same
intermediate inputs, without overshooting. Controls, guide completion and saved
trials use exact requested inputs, not in-flight animation frames.

Fog/cloud remain mounted with continuous opacity; the parcel ring fades as the
cloud becomes visible. Breeze dash phase is integrated, avoiding phase jumps
when speed changes. It moves during input response/playback, then stops.
Midnight does not animate backwards through an entire day. Hidden documents
stop frame requests; reduced motion and comparison thumbnails bypass easing.

Native labelled range inputs remain underneath decorative, pointer-transparent
handles: reused felt cloud, Phosphor sun/moon/drop/thermometer. The custom filled
track, 40 px artwork, focus ring, keyboard fine steps and coarser +/- buttons
preserve precision. No paid API, asset generation, new dependency or audio.

## Verification

- 321 local Node tests pass, including six new motion/presentation regressions.
- All nine lesson audits pass. Preview, Pages and production builds succeed.
- In-app browser: all 11 walkthrough actions completed; cloud/fog guide Back,
  free mode, breeze assessment concealment, persisted v1 comparisons checked.
- Real pointer drag of moon from 0 to 8 degrees: opacity 0.772136. Drag back
  to 5.5: zero opacity. Keyboard increment to 5.6: opacity 0.0295056. At 6:
  0.247308. These are rendering values, not a fog probability/visibility score.
- Cloud uniesienie 1500 m: opacity about 0.70; 3000 m remains within the scene.
  Dry / wet walkthrough switches settle correctly. Low-contrast breeze fades.
- Phone 390 px and desktop 1440 px screenshots inspected; 320 and 820 px
  overflow checked. No browser console errors observed.
- Reduced-motion / hidden-document paths reviewed and statically tested; no
  claim of a physical-device VoiceOver or OS reduced-motion acceptance test.
- Only preview assets/code and scoped development notes change. No main-app
  navigation, native Apple package, CyberFolks upload or social post is changed.

Screenshots: `motion-fog-desktop.png`, `motion-cloud-mobile.png`.
Publication verification is recorded in the task after Pages completes.
