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

## Source Archive Check And Predeclared Atlas Follow-Up

Compared all 20 CCSN photos in the pilot directly with entries in the preserved
`CCSN.zip`, without extracting or changing them. Every SHA256 matches the
previously frozen source bytes, including the disputed category paths. This
rules out a local copy/path substitution for these photos, not incorrect
meteorological source labels or a general error elsewhere in the dataset.
The two clear-sky photos come from another source and are not covered by this
archive check. The labels.py mapping and train_ccsn.collect use the category
folder code to select the canonical genus index; no remapping fix follows.

Before requesting further predictions, freeze a separate diagnostic comparison
on **all 30 atlas photos**, not examples selected by earlier successes/failures.
Use the same V2 manifest and measured native baseline, verify source pixels,
preserve all three examples of each of the ten atlas genera, and exclude the
nine project-outlier rows that also have diagnostic split. This is an existing,
curated product diagnostic set, not independent confirmation or a replacement
for the unfavorable CCSN comparison. Atlas labels also are not infallible.

Reuse the full-frame inference prompt and schema. Shuffle all 30 IDs using the
fixed seed's atlas-presentation stage. Divide into three successive ten-photo
batches, each in a fresh, label-blind session with no history/source names or
other model outputs. Evaluate only full-frame input in this follow-up; generated
center-frame artifacts are retained but not evaluated or counted as a replicate.
Preserve each raw batch before combining by photo_id. Missing responses fail
comparison instead of disappearing from the denominator. No training labels,
model weights, calibration or release gates change.

### Complete Atlas Result

All 30 full-frame responses were returned, validated and retained. Three fresh
ten-photo sessions used the inherited parent model without a model override;
they did not use the ChatGPT website or reproduce the feedback author's model
and settings. No history, source labels or native answers were passed. All
three agents were closed after receiving their raw outputs. Private artifacts,
prompts, hashes and session receipts are in
`.local/v4/blind-atlas-pilot-20260906/`.

| Existing atlas label | Photos | Native leading match | Blind VLM leading match |
|---|---:|---:|---:|
| Ac | 3 | 3 | 3 |
| As | 3 | 0 | 1 |
| Cc | 3 | 2 | 1 |
| Cs | 3 | 3 | 1 |
| Ci | 3 | 3 | 3 |
| Cb | 3 | 2 | 2 |
| Cu | 3 | 3 | 3 |
| Ns | 3 | 2 | 1 |
| Sc | 3 | 0 | 2 |
| St | 3 | 1 | 2 |
| Total | 30 | 19 | 19 |

The VLM matches four labels where native does not (P007/P018/P020/P024) and
disagrees with four that native matches (P001/P009/P016/P019). One response
has unknown as its leading guess; seven are uncertain, seven mixed and sixteen
single-genus. P009 and P029 include the atlas label among co-occurring genera,
but not as the leading guess. This is a target-selection ambiguity worth
reviewing, not permission to change the predeclared primary score or count
alternative guesses as correct identifications.

The seven qualitative-high VLM answers all agree with their atlas labels;
the native acceptance rule selects four photos, three matching their labels.
These small, differently selected subsets do not establish calibrated precision
or comparable operating coverage. The VLM often describes visible features and
missing context explicitly, but useful wording is not measured classification
improvement and was not independently rated for learner comprehension.

Conclusion: this complete diagnostic does not demonstrate a leading-label
advantage for the VLM. It also does not erase the unfavorable 22-photo result.
Retain the current on-device privacy boundary and do not swap models, relabel
training data or weaken release gates on this evidence. The exact original
field example and feedback author's session remain unreproduced.

Seven focused pack/comparator tests pass, including complete-atlas selection,
missing-row rejection and a single-arm result without a fabricated replicate.

SHA256 receipts:

- Frozen key: `3b9ea3345110e9c0e1cb2b7bbb4dd87bf0b23281bc3cb32548f2954085031965`
- Combined response: `f6376078eb3aa4aec93d541c345860c909e51e1d241231ee77e26846c1cde72b`
- Batch 1: `347b96d18e11342cebe5e44e7e77e18c111e6ae09634ebc3500ae4adf926add4`
- Batch 2: `a7f2fd84cb90dc823fac617e1c6671438eec1d586100f3cf2ad61c1cdaab9f89`
- Batch 3: `203059aaf3d30d9237459cb5a9223726fba70efa87ac31a21b4e66750d9f08f0`
