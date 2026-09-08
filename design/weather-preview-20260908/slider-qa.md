# Illustrated Slider Alignment - 2026-09-08

Scope: shared controls in the new GitHub Pages weather preview only.
The owner approved subtle focus shadows; preserve them and older screens.

## Cause and Fix

The public height slider used a 49px image inside an implicit grid in a 40px
bordered handle. DOM measurement found the image centre 5.5 CSS pixels right
of the handle centre. Smaller 29px moon/drop SVGs fitted the existing track.
The cloud now has explicit absolute centring. Press scaling uses the same
translate/scale transform, not an individual scale that moves that centre.
Original idle shadows, artwork drop shadows and focus halos are retained.

WebKit appearance is explicitly reset on the input and native thumb. Native
thumb paint is transparent with zero opacity/shadow in WebKit and Firefox;
the native 44px hit target and labelled keyboard semantics remain intact.
This guards against the extra system-style disk in the iPhone screenshot.
Its exact Safari cause/version has not been independently reproduced.

## Verification

- 327 Node tests pass, including a CSS structure regression for centring,
  pressed transform, focus styling and native thumb painting/hit size.
- All nine lesson audits, weather preview and production builds pass.
- In-app browser: 320x740, 390x844 and 1440x900; no horizontal overflow.
- Height at 0, 2100 and 3000 m: image/handle centre delta is 0px on both axes.
  Home/End work; pointer drag moves the height from 0 to 2100 m.
- Temperature, humidity and cooling SVGs also have 0px centre offsets on
  narrow and desktop layouts. Focus shadow remains present.
- Pressed transform is covered by the CSS regression; no separate screenshot
  was captured while holding the pointer down.
- Screenshot: `slider-alignment-390.png`.

These are responsive in-app browser checks, not physical Safari/Android QA.
No image assets, physics, lesson content, native navigation or ML changed.
Pages publication verification is recorded in the active Lore task.
