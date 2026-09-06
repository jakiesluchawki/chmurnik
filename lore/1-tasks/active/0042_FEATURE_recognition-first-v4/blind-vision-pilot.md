# General Vision Model Comparison, September 6

The owner asked to defer involving a meteorologist and first compare recognition
in separate model sessions, following feedback that a separate ChatGPT chat gave
a better result. The owner separately approved placing the existing 33-photo
review ZIP in the connected Google Drive. Its metadata confirms owner-only
access; it has not been sent to a reviewer. No human assessment is assumed.

## Predeclared Pilot

Frozen before requesting model predictions:

- Use V2 manifest and its matching measured `baseline-v3-native-imgw.json`.
- SHA256 seed `20260906-vision-pilot-1`, two distinct test groups per source
  category, 22 images. Selection uses IDs/labels/grouping, never predictions.
  Shuffle presentation independently. Never replace a missing/failed image.
- Arm A sees EXIF-oriented full-frame RGB PNGs; arm B sees the 90.2% center
  square reproduced by the existing PIL geometry. Retain available resolution.
  This isolates available framing, not pixel-exact UIKit/Vision resize parity.
- Preserve image hashes and source/baseline mapping outside the two blinded
  image folders. No source names, previous results or conversation context
  go into either inference prompt. Use identical prompts and inherited Astra
  in two fresh sessions. Do not label model opinion as expert ground truth.
- The available browser ChatGPT session is logged out and cannot accept photos
  without login. The initial executable comparison is Astra in separate Codex
  sessions, not Arvin's unknown ChatGPT model/settings. Report this distinction.
- Request best guess (including inability to identify), single/mixed/uncertain/
  clear/unusable status, visible genera versus alternatives, short Polish
  visual evidence, limits and useful next action. No invented numerical
  certainty, hidden altitude, forecasts or flight/sailing advice.
- Compare top-1 agreement with original source labels, non-answer rate and
  disagreements with the actual stored app baseline. Review explanation
  usefulness separately. A small balanced, previously exposed test subset is
  neither a fresh field benchmark nor prevalence-weighted overall accuracy.
  Mixed frames and noisy source labels remain unresolved, not automatic losses
  or corrected training examples. Do not change acceptance gates or weights.
- This is a paired framing pilot, not a controlled replicate/repeatability
  study: independent sessions and stochastic response may also cause changes.

The original dark feedback attachment is absent at its supplied temporary path
after the host restart. Do not reconstruct it from a screenshot or claim this
pilot reproduces that exact comparison. No private messages, videos or people
are used in this pilot. No production cloud-upload feature is authorized by
this diagnostic exercise; on-device app privacy remains unchanged.

## Completed Pilot

Both fresh sessions returned all 22 observations. No prior conversation was
forked and no source labels or app outputs appeared in either prompt. Raw
answers, identical prompt, image receipts, source mapping and comparison are
preserved under `.local/v4/blind-vision-pilot-20260906/`. Both agents were closed
after preserving their responses. No ChatGPT website submission was made.

| System/input | Leading hypothesis matches source label | No leading identification |
| --- | ---: | ---: |
| Existing measured native ensemble | 8/22 | 0/22 raw top-1 |
| Fresh Astra session, full frame | 3/22 | 2/22 |
| Fresh Astra session, center frame | 4/22 | 2/22 |

These are source-label agreement counts, not demonstrated true accuracy. Only
two native predictions pass the existing native acceptance policy: both source
clear-sky examples. Both VLM sessions mark those dark/featureless inputs
unusable. Penalizing every such refusal as an incorrect genus is not a fair
comparison of practical usefulness, but these cases remain in the denominator
and the raw agreement counts above; do not hide unfavorable results.

Leading hypotheses agree between sessions on 17/22 inputs, including the two
unknowns. They differ on P003/P008/P009/P018/P021. Full-frame output labels six
photos mixed; center-frame output labels four mixed. These are model judgments,
not newly verified multi-label annotations. Because each arm ran only once,
framing and stochastic/batch-context effects cannot be separated causally.

Inspected full photos P001, P009, P012, P020 and P022, plus center P009:

- P012: source Ac and native Ac versus both VLMs Cu with Cb as an alternative.
  The photo visibly contains large modeled protrusions; the source's single
  label warrants review rather than automatic acceptance or replacement.
- P020: source Ci, native Cu, both VLMs Cb plus Cu. The visible scene contains
  several structures and a partly obscured, laterally extended bright crown.
  The Cb interpretation remains a hypothesis, not an expert determination.
- P022: source St and native St versus both VLMs Sc. Broad textured elements
  and gaps are visible. Agreement between related model sessions is still not
  independent meteorological ground truth.
- P009: one session describes oblong clouds near the horizon, the other focuses
  on thin upper streaks. Both structures remain visible in both input variants.
  This does not prove the crop alone caused the change. A single whole-frame
  genus has an ambiguous target; selecting and naming the examined region is
  a distinct requirement from choosing a more capable model.

The VLM explanations include concrete visual features, image-specific limits,
and comparison actions. No independent usefulness rating or controlled trial
against rendered app copy occurred, so do not turn that inspection into a UX
score. The pilot does not establish that a general VLM is a more accurate
replacement, and does not establish the reverse from noisy source labels.
It does justify continuing a region-specific, context-aware comparison before
training another single-label classifier. Owner-requested human review remains
deferred; answers are not human annotations and no training label was changed.

Reproducible tooling: `build_blind_vision_pilot.py` and
`compare_blind_vision_pilot.py`; five focused tests pass. Full source pixels are
checked against the frozen manifest; baseline provenance, group selection,
blinding, input IDs and non-overwriting outputs are checked. No native build,
model conversion, distribution artifact or Apple upload occurred.

SHA256 receipts:

- Frozen comparison key: `6716333cf29d960fcc694d426ffacacd23a53919a5f2450fd2f66218a65bcb38`
- Full-frame response: `d82b37e9b6b840caa7b8debab178e1d52a97c43cac78799b8d3d56dde7a2e3b6`
- Center-frame response: `c2184474a46278484ccfbda80c4144e633b4919dc33effec1c210d21338dcac4`
