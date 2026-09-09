# Distinct Weather-Learning Covers

Task: lore-0043. Owner feedback: repeated cloud and landscape thumbnails make
different activities look the same. Scope: catalog art only, Pages preview.

## Art Direction

Eight separate editorial felt scenes replace repeated assets. Different scale,
viewpoint, dominant color and silhouette distinguish adjacent cards. Preserve
the blush/olive/violet/ivory palette and tactile materials, without uniform
pink backdrops or a generic cloud object for unrelated topics.

| Topic | Cover concept |
| --- | --- |
| Front | Layered cold/warm air and frontal lifting |
| Wind | Weather vane with streaming fabric, coastal viewpoint |
| METAR | Observation airfield, instrument shelter and cloud layers |
| Height | Sea and elevated terrain under a common reference thread |
| Sounding | Weather balloon and suspended radiosonde above atmospheric layers |
| Icing | Close-up of frosted wing leading edge |
| Turbulence | Flow ribbons curling downstream of terrain |
| Storm | Vertical cumulonimbus tower, anvil and rain shaft |

The other six covers remain: three unique original experiment illustrations
and three authentic cloud photographs. All fourteen have different source
files. Observation keeps an anonymous photo filename; no hidden answer is
added to alt text. Decorative cover images have empty alt because the card
already names its destination. Generated art is not cloud-identification
evidence, a live input state or a scientific measurement.

## Production

Built-in image generation, one image per concept. Final 1000px WebP exports
live in `weather-preview/public/covers/`; exact prompts and generated-source
paths are recorded in the four companion provenance files. The catalog uses
lazy decoding/loading and a reserved 16:10 frame, without changing lesson
content, navigation, simulation assets, controls or equations.

## Verification

Local browser checks passed at 390px and 1365px: all fourteen images loaded
after scrolling, frames preserve a 16:10 ratio, and the eight new compositions
are distinct. The WebP files total 547,098 bytes. Regression tests require
fourteen unique sources, eight different image hashes, authentic-photo covers,
a bounded download size and separation from live experiment scenes. Publication
is tracked with the accompanying transfer/mobile change in Lore0043.
