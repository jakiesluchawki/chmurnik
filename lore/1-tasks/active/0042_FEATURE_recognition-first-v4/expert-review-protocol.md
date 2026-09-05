# Blinded Development-Label Audit V1

Declared before selecting or viewing the sample. This is a small review of
label suitability, not a new accuracy benchmark or a replacement for model
release gates. No reviewer has agreed or returned annotations yet.

## Fixed Selection

- Use only `imgw-2024-samples` rows already assigned to `train` in the frozen
  V2 manifest, SHA256
  `d5b0ca33e0867bbb0d0fd25dbd08fc20cfeea316a89299e53f63a6bee5d0ea1c`.
- Select three observations per original class, 33 total, without using model
  predictions. SHA256 seed 9042 determines candidate and final presentation
  order. Process classes with fewer eligible capture days first. Use distinct
  duplicate groups and capture-day groups across the entire sample; fail rather
  than silently relax uniqueness or sample from validation/calibration/test.
- Verify each selected stored JPEG against its frozen artifact hash. Copies
  retain the existing full-frame, EXIF-oriented, max-640px JPEG preparation;
  no additional crops, enhancements or transformations. This resolution may
  itself prevent confident assessment. Permit and record that response.
- Source labels, original filenames, local paths, selection seed and class
  counts stay in a separate local key, outside the reviewer ZIP. The reviewer
  sees neutral IDs, photos, blank answers and source/license attribution.
- No private user photos, correspondence or videos are included.

## Reviewer Instructions

Assess the visible frame independently, without an assistant/model, source
folder names or the old label. Prefer two independent qualified reviewers
before adjudicating ambiguous or conflicting cases. Record visible evidence,
not a forced guess. The current package is a pilot; it is not enough to make
a general statement about the whole dataset's label accuracy.

Allowed outcomes are single genus, several visibly present genera, uncertain,
clear sky, and unusable. Keep possible alternative identifications separate
from genera judged present. Include a short reason and any limits of framing,
light or resolution. An empty row means not reviewed, never clear sky.

Source-label disagreement alone is not proof that the reviewer is correct.
Preserve original and independent annotations. Expert labels must not be
overwritten with model labels or silently reduced to one genus. Uncertain and
mixed frames cannot become ordinary single-class training rows by default.
Resolve disagreements with independent review, or retain unresolved status.
No script in this checkpoint imports returned reviews into training.

## Attribution and Handling

The official IMGW repository was checked on September 5, 2026. It identifies
the source as CC BY 4.0 and names Szymon Kopec, Grzegorz Duniec, Bogdan Bochenek
and Mariusz Figurski, DOI `10.1002/qj.4865`. Preserve source link, authors,
license link and the image-preparation disclosure in the reviewer package.

Source: <https://danepubliczne.imgw.pl/en/repository/Artificial-neural-networks-in-automatic-image-classifications-of-cloud-from-ground-based-observations-using-deep-learning-models>.

Build locally only. Do not upload the review ZIP or send it to a third party
without the owner's instruction. No external review or response is assumed.
Existing test sets remain exposed regression sets; reviewing training photos
does not create a fresh, independent confirmation set.

## Built Pilot

The deterministic build completed with 33 distinct capture days and duplicate
groups. It remains local at `.local/v4/expert-review-v1/`. The reviewer ZIP
contains exactly 37 files: 33 unchanged prepared JPEGs, instructions, a blank
CSV, an offline HTML index and the label-free image manifest. The original
label/key JSON is outside the ZIP. All image hashes and index links validate;
`unzip -t` reports no errors. Five unit/integration tests cover selection,
cross-role leakage rejection, blinding, preservation and annotation validation.
The initial HTML had not yet been visually verified at this checkpoint.

- ZIP SHA256: `8fb113e8c2debc220961e4e0f2d4f93e464a5d99d9e715f1b7b7dab30df4ae10`.
- Public manifest SHA256: `464e1318aaf914bb221ec53b3d211a64f83fdb21ee45c7b353d0f86bf162b799`.

No expert rating exists, no pack has been sent and no label has been changed.

## Layout-Only Revision and Browser Verification

An isolated local Playwright browser made visual verification possible without
using the unavailable CUA service or connecting to the owner's browser. The
initial package overflowed horizontally at 320px because of a long URL in the
instructions. Added wrapping to the instruction block, with no content or
selection changes. Preserve the original package; the current revision is
`.local/v4/expert-review-v1-layout2/CHMURNIK-OCENA-ZDJEC-33.zip`.

- ZIP SHA256: `ff271af197fe1b239379ee95fe4b4d03a281564b763dbf03984d6ff830a67254`.
- Public manifest and blank CSV are byte-identical to V1. The manifest hash
  above is unchanged; all 33 photo files and their order remain unchanged.
- ZIP integrity passes. `scripts/check-expert-review-ui.mjs` verifies all
  complete photos at 320, 390 and 1100px, neutral labels, links to original
  images, the CSV link, no horizontal overflow, no JavaScript errors and no
  network requests. Screenshots are in `build/v4-expert-review-qa/`; inspected
  the narrow instructions and desktop photo gallery.
- All 116 ML tests pass. This is package/UI verification, not independent
  annotation or evidence of improved classifier accuracy. No package was sent,
  no annotation was returned and no training label was changed.
