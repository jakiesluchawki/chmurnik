# Ground-Photo Data Expansion Audit

Status: research only, September 5, 2026. No newly found data has entered the
frozen V2 manifest, training, calibration or release evaluation. Existing exposed
sets remain regression evidence. A larger DINOv2 Base trial did not beat the
small kernel, so audit additional supervision instead of assuming more encoder
parameters solve the current errors.

## NASA GLOBE CLOUD GAZE

Primary source: <https://zenodo.org/records/7853217>, DOI 10.5281/zenodo.7853217.
Creators: Marile Colon Robles, Tina Rogerson, Kevin Ivey, NASA Langley/SSAI.
The repository explicitly permits research, publication and commercial uses
and asks for attribution to Zooniverse, the GLOBE Program and NASA Langley.
The fetched record API confirms `cc-by-4.0`. Keep attribution and the license
in a future model's provenance; public availability alone is not the basis.

Fetched only the public record JSON and `GAZECloudTypeAll_20230328.csv` into
`.local/v4/globe-gaze-audit/`. Its MD5 matches the published value
`7029a6efd57e67b239f1b166a916aa08`. Initial CSV parsing found 3,909 physical
data records, not 3,909 observations; the structural correction is below.
The later fixed photo audit is recorded below. Do not commit raw observation
locations or identifiable metadata into public application assets.

Each observation has North/East/South/West/Up image URLs and separate labels,
agreement, classification count and retirement fields. The actual taxonomy is:

- Clear sky
- Cirrus/Cirrostratus
- Cirrocumulus/Altocumulus
- Altostratus/Stratus
- Stratocumulus
- Cumulus
- Cumulonimbus
- Contrails, smoke/haze and dust

These are not eleven interchangeable genus labels. Some are unions; multiple
labels can coexist. No union may be split into invented genus ground truth.
An all-zero vector must not be relabeled clear sky. Crowd consensus is not an
expert accuracy guarantee.

Documentation linked by the record:
<https://www.globe.gov/documents/16792331/0/Summary%2BData%2BVariables%2BCLOUD%2BGAZE_2.0.docx/388b8c8f-e869-148f-31c2-78f2d005f38d?t=1654531372682>.
After transient execution-service failures, the 54,129-byte DOCX was fetched
and its XML read. SHA256:
`55484084c87bd5687c999153c92171293679112a99d984581dfe964580a18678`.
It defines per-direction category flags 0/1, with 5 meaning other/unclassified,
the number of citizen classifiers, agreement and retirement metadata. Never
equate agreement with a measured probability that a genus is correct.

### Completed Structural Audit

Reproducible code: `ml/cloud-recognition/globe_gaze_data.py`, with six tests.
Report: `.local/v4/globe-gaze-audit/profile-v2.json` (metadata only, not committed).

- High severity, verified: 810 observations are split into adjacent 61- and
  15-field records, instead of the 75-column schema. The second record starts
  with an empty cell and contains only the Up block. Naive DictReader silently
  shifts those values into North fields. Repair only this exact adjacency,
  boundary and width pattern; reject any other shape or changed header. All
  category and retirement enums are validated after reconstruction.
- Corrected grain: 3,099 unique observations and 15,333 unique photo URLs,
  spanning 196 dates from 2017-08-21 through 2022-01-25. Distinct URLs do not
  prove absence of identical or near-duplicate images.
- High severity, verified: 1,788 photo records contain agreement values but
  zero classification count and empty retirement. Retain this as missing
  metadata, never as high-confidence training supervision. Another 1,071 are
  unclassified; one combines clear sky with another positive category.
- A metadata-only screen requiring one positive cloud/clear category, all
  flags binary, agreement >= .8 and at least five classifiers leaves 7,779
  photo records from 2,451 observations. It covers only 11 dates, not 196.
  This concentration and related directional views matter for split design.

| Category | Screened photo records before image deduplication |
| --- | ---: |
| Clear sky | 3,852 |
| Cirrus/Cirrostratus | 646 |
| Cirrocumulus/Altocumulus | 171 |
| Altostratus/Stratus | 2,081 |
| Stratocumulus | 88 |
| Cumulus | 902 |
| Cumulonimbus | 39 |

These counts are not a training approval or a quality score. They reveal both
additional outdoor-photo supervision and substantial imbalance/partial labels.
No Nimbostratus or individual members of union categories may be invented.

### Completed Fixed Visual Check

Selected six photographs from each of the seven screened categories (42 total,
seed7042 hash ordering, one photograph per observation). The saved selection
manifest precedes the downloads; SHA256 is
`6613a98f1c3e0ad5ab6756fc2285056a2866445e418ebe52b0762061c771e93b`.
All 42 observations and their other views are development-only exposure, never
a future fresh test set. The CLI is `audit_globe_photos.py`; local photographs,
seven contact sheets and per-file hashes are in
`.local/v4/globe-gaze-audit/visual-sample/` and are not public assets.

41 files were downloaded (10,389,196 bytes). One As/St file, ID
`gaze-e1b72f1afc4cb63fa0ca`, failed the JPEG/pixel-count check; it was not replaced.
The combined error does not distinguish an unsupported format from excess
resolution. Do not claim a more specific cause. The downloader rejects changed
previously inspected files without discarding their recorded hashes; it also
fully decodes JPEGs before declaring success.

Inspected all seven sheets on September 5. These are visual observations and
limitations, not expert relabeling or a measured source-label accuracy:

- Clear: the sample contains blue sky with buildings, trees, glare, blur, and
  a person at the edge of one frame. It is not all clean sky-only imagery.
- Ci/Cs: wispy sheets/streaks appear, with contrail-like linear structures,
  foreground obstructions and one blurred image. The union must stay a union.
- Cc/Ac: small cloud elements appear at different scales/perspectives; some
  occupy only part of the frame. A single label cannot locate those elements.
- As/St: the five downloaded images show mostly gray/blue-gray sheets; one
  has a bright break and visibly structured cloud texture. The photographs
  alone do not establish a cloud height or a unique genus.
- Sc: texture varies substantially, including backlighting and warm sunset
  illumination. These resemble the app's difficult lighting conditions, but
  that does not establish every consensus label as correct.
- Cu: multiple cloud objects, dark bases, glare and foreground objects occur;
  one photo has clouds predominantly at the left edge. Center cropping may
  remove the labeled subject. Region work must preserve whole-photo context.
- Cb: all six selected views are dominated by dark/cloudy bases or portions
  of a cloud field, without an unambiguous full tower/anvil visible in the
  contact sheet. These do not independently verify Cb. A dark base alone is
  not sufficient genus evidence; do not turn these into certain Cb examples.

Decision: do not append this source to the eleven-genus manifest as ordinary
single-label truth. A later experimental use must preserve partial labels,
exclude unresolvable Cb supervision, control the large clear/As-St imbalance,
and deduplicate/group by observation, spatial context and capture day. Extra
photos do not justify weakening the existing genus/release gates. No GLOBE
training or confirmatory evaluation has occurred.

## Vienna WMO Multi-Label Study

Paper: <https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2024EA004112>.
Data: <https://zenodo.org/records/14185063>.
Four directional images jointly receive operational SYNOP observations; the
study uses thirty level-specific categories, not a single genus per photograph.
The authors acknowledge imperfect labels and limited independent examples of
rare classes. Published data consists of NetCDF image arrays and CSV labels,
about 1.4GB. Do not map a four-view label indiscriminately to each individual
photo or treat augmented neighboring times as independent samples. No files
were downloaded; data license and available image resolution need further
verification before deciding whether it is useful here.

## TJNU GCD

Primary source: <https://github.com/shuangliutjnu/TJNU-Ground-based-Cloud-Dataset>.
It has 19,000 images and seven grouped conditions; several classes combine two
or three genera, and images with no more than 10% cloudiness are called clear.
Those definitions are incompatible with interpreting every label as CHMURNIK's
genus/absence ground truth. Download/use is subject to `GCD Agreement.pdf`;
public availability alone does not establish product-training permission.
No dataset files were downloaded or agreement accepted. Lower priority than
auditing NASA's directional photo labels and explicit reuse statement.

## Other Sources Checked September 5

### Montenegro Multi-Observer Dataset

Source: <https://zenodo.org/records/21787669>, Plamenac and Tomovic,
version1.0.0, CC-BY-4.0. Fetched only inventory, annotations, code book and
documentation, with all five published MD5 checksums verified. No photos,
training, calibration or confirmation were performed. Reproducible audit:
`montenegro_data.py`; local `montenegro-audit/profile.json` under V4 research.

Verified 2,522 images, 11,191 unique image/observer pairs, nine observers and
69 local capture dates. The code book uses SYNOP levels, not one genus per
image. Unions, multiple levels, missing cells and explicit unobservable codes
remain distinct. The parser found and records 3,055 trailing-space zero codes
and 1,425 trailing-space slash codes; it never coerces slash to absence.

A strict metadata screen requiring at least four agreeing exact-genus votes
and >=80% of all observers leaves 346 images before pixel deduplication:
216 clear, 105 Cu, 24 Ci and one Ac. These cover respectively16,14,6,1 dates.
The other seven cloud genera have no support under this screen. Counts are
not accuracy evidence. Correlated images and observer rows cannot be treated
as independent samples or randomly split. The documentation retains unresolved
camera, resolution, privacy-verification and citation placeholders; do not
infer those fields or a fixed UTC offset. This is not a ready eleven-class
training/confirmation set. Any future partial-label or uncertainty research
requires a fixed visual/provenance audit first. Eleven focused tests pass.

### Pinned CCAiM Metadata And Overlap Audit

The [CCAiM card](https://huggingface.co/datasets/serbekun/CCAiM-CloudsDataset)
reports 916 images, ten classes and MIT licensing. The
[source repository](https://github.com/serbekun/CCAiM) separately identifies
the `clouds_<dataset_number>` photographs as CC0 and the code as MIT; it also
asks contributors to correct wrong labels. This is not expert-verified
single-genus supervision merely because the labels use ten familiar names.

On September 5 downloaded only `labels.json`, the revision response and the
`clouds_1` tree at dataset revision
`07e790f94faf1f6a6cb39d0547837407ed59ba49` (July 23). No new photos downloaded.
The pinned audit is `ml/cloud-recognition/audit_ccaim_metadata.py`; local input
and results are in `.local/v4/ccaim-20260723-audit/`.

- The inventory contains 917 JPEG entries, 916 labels and 834 unique published
  Git LFS SHA256 hashes. Photo `591.jpg` has no label; never infer clear sky
  or another genus for it.
- There are 83 duplicate-hash groups, all pairs. In 28 pairs the exact same
  published content hash has different genus labels. Examples include
  `41/67` (Stratus/Cirrus), `47/51` (Stratus/Stratocumulus), and `276/749`
  (Nimbostratus/Cumulus). These counts use the repository's LFS metadata,
  not a new local download and hash of every remote image.
- Rehashed all 251 local `ccaim-old` rows from the frozen V2 manifest and
  verified their decoded-pixel fingerprints first. All 251 match current
  published image hashes; they represent 247 unique byte hashes. They are
  previously exposed evidence, not 251 new independent test photographs.
- Metadata-only screening removes those exposed hashes, every conflicting
  hash and unlabelled records, and chooses one representative per remaining
  hash. This leaves 560 review candidates totaling 461,197,459 bytes. They
  have not been downloaded, visually checked, near-deduplicated or approved
  for training/fresh testing. Hash differences cannot rule out recompression,
  resizes, related frames or earlier exposure from other datasets.

| Source label | Metadata-screened unique hashes |
| --- | ---: |
| Cumulus | 272 |
| Altocumulus | 53 |
| Stratocumulus | 53 |
| Altostratus | 52 |
| Cirrus | 51 |
| Cirrostratus | 31 |
| Cumulonimbus | 29 |
| Cirrocumulus | 14 |
| Nimbostratus | 3 |
| Stratus | 2 |

The remaining imbalance, especially two Stratus and three Nimbostratus, does
not repair the current difficult-class supervision by itself. Do not append
the whole source or automatically choose between contradictory labels. No
ground truth, frozen split, classifier weight or acceptance threshold changed.
Eleven focused tests cover pinning, malformed/duplicate metadata, old-byte
overlap, changed historical pixels, review exclusions and order independence.

Frozen SHA256 receipts:

- `labels.json`: `73c9a6363e825ac73b27742d26b2a264637e5b973166d92ec95d7462d8660b5b`
- `revision.json`: `91219091d458b587caa403817a5a2fbbf6de38d4892efa216e5c30ea000a64ed`
- `tree.json`: `31026dd132d22d04dc0a50aa3c22e2ae1de7661fc8f97173ed4915449e1a14a8`
- `profile-v2.json`: `5317fcc6a01a235f415462c72f916b87c738ae466dccec7f8b44b59d1702a195`
- Audit code: `1c44eb915cf668e170f697e7a7019820e0d1a66bd34ca5a2c68f114c95b886e5`

`profile.json` preserves the earlier overlap-only report; `profile-v2.json`
adds the deterministic review inventory. Both explicitly deny training
approval. Outputs refuse overwrites. No new recognition score is claimed.

### September 6: Bounded Visual And Crop-Reuse Audit

After migration to Kingston, continued in the physical V4 worktree. No original
split, genus label, calibration threshold or shipped model was changed.

`audit_ccaim_photos.py` freezes a deterministic sample with seed13042, at most
six images per source genus: **53 photos, 35,740,566 bytes**, including all
three remaining Ns and two St candidates. The first attempt downloaded zero
photos because its redirect allowlist did not include the observed Hugging
Face CDN `us.aws.cdn.hf.co`. Preserved that attempt and its selection; a new
audit with this HTTPS host allowed downloaded the exact same 53 photos. All
published byte sizes/SHA256 hashes, image decoding and decoded fingerprints
were checked. No failed photo was replaced by a more convenient example.

Evidence is private under `.local/v4/ccaim-visual-audit-20260906-cdn/`, not SM
assets. Ten contact sheets were inspected. Visual triage is **not independent
expert annotation** and does not supply a replacement genus:

- Several photos contain different cloud structures in one view, including
  C005 (source Ci), C017 (source Cs), C024 (source Ac) and C043 (source Cu).
- C002, C033 and C038 visibly contain a mouse pointer. Some images are narrow
  strips or small crops; C010 is 959x181. Framing, scale and capture context
  cannot be assumed from a single source label.
- C025/C026/C028/C030 and C046 look potentially sequence-related; C040/C041
  also need capture-provenance review. They are not declared identical merely
  from that resemblance. The small Ns/St inventory is not verified as reliable
  hard-class supervision by this inspection.
- The previous dHash screen flagged C014 against 15 older largely uniform
  images, with no exact decoded-pixel match. Such flags are only review leads.
  It missed visually apparent photographic crops, so neither a small dHash
  distance nor its absence establishes independence.

Added `audit_crop_reuse.py`: up to800 SIFT features on an 800px long edge,
mutual ratio-test matches, robust similarity-transform alignment, minimum
spatial support/overlap, and aligned-grayscale correlation/residual checks.
Gates are documented in code; no thresholds were selected on model accuracy.
Use two OpenCV threads. OpenCV4.12.0.88/NumPy2.2.6 are isolated in
`.local/v4/photo-audit-deps`; training NumPy2.5.0 was not replaced.

The first within-sample run compared1,378 pairs and flagged two. The expanded
run rehashed every251 old CCAiM row against the pinned prior audit, retained
all role/label aliases, and compared247 unique old byte hashes against all53
new photos. Combined total: **14,469 comparisons, three candidate pairs**.
Inspected both full photographs in each candidate pair:

| New sample | Matching photo | Observation | Aligned correlation |
| --- | --- | --- | ---: |
| C049 / source475 | C052 / source659 | Same photographed scene, different crop; both source Cb | 0.99457 |
| C051 / source492 | C053 / source615 | Same photographed scene, different crop; both source Cb | 0.99679 |
| C024 / source label Ac | old `stratocumulus/0137.jpg` | Same photographed scene, different crop and contradictory source labels | 0.99887 |

These are photograph-reuse findings, not a resolution of the Ac/Sc label.
They show the sample cannot be counted as53 new independent examples. No
candidate is admitted to training or fresh testing. Other previous datasets,
related frames, difficult crops and missing feature matches remain unaudited;
the absence of further candidates does **not** prove the remaining photos
independent. Do not amend historical scores or merge frozen splits in place.

The complete ML/tooling suite passes **155 tests**, including eight downloader
tests and eight crop-audit tests. Coverage includes crop/resize/JPEG, brightness
changes, reverse matching, uniform/repetitive negatives, small shared overlays,
different aligned pixels, pinned receipts and preserved old-role aliases.
The existing-partial-download test also prevents a failed exclusive create
from deleting a prior attempt's file. CoreML tooling still warns about the
installed Torch/scikit-learn versions; no model conversion ran here.

SHA256 receipts:

- Selection: `16acadc99d29cee24bcfa33753226ab0028edec43f2cd8aeba0541c7111c375f`
- Downloads: `04039510721a8c6b8bf408b2503166df23af19bbaa9459e88020297ba52048e2`
- `crop-reuse-with-previous-v2.json`: `08304872cef24ba4f67f7bb741c98103de9201a06b03f324019e51b0c36ae8d9`
- Crop-audit code: `aa19556a3a1ae81ab14f6f6f5c1b12738d8da3fba7ef208e08c4e071f8990a64`

Next model-data work requires reviewed region/mixed-genus supervision, capture
grouping and truly independent confirmation. The existing blinded33-photo
expert pilot still has no returned reviews. Do not feed these noisy labels to
another training variant and advertise the resulting score as improvement.

### WEBCAM

[WEBCAM repository](https://github.com/MarcusCoteFIT/webcam-ground-based-cloud-image-dataset)
reports over 15,500 images and nine aviation-oriented categories, including fog,
precipitation and towering cumulus rather than all ten genera. The repository
currently exposes a notebook and README, not an explicit dataset license.
The [associated paper](https://doi.org/10.1109/ACCESS.2025.3634057) has a
CC-BY-NC-ND notice; this does not establish a reusable dataset/model license.
Neither public availability nor the article's reported accuracy authorizes
product training. No data downloaded or reuse terms accepted. This is a possible
source only after verifying access, reuse rights, labeling and split independence.
