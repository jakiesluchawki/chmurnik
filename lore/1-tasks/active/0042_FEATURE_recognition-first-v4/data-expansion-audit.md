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
No photographs have been downloaded from this source. Do not commit raw
observation locations or identifiable metadata into public application assets.

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

### Next Bounded Check

Before fitting anything, inspect six deterministically selected photographs
from each of the seven screened categories (42 total, seed7042 hash ordering,
one photograph per observation). Mark all selected observations and their
other views as development-only exposure, never a future fresh test set.
Record a selection manifest before downloads; cap individual and aggregate
download sizes, preserve failures instead of replacing inconvenient images.
Inspect actual cloud visibility, framing, obvious label limitations and image
quality without inventing expert labels. Later training requires an explicit
partial-label strategy, photo deduplication and spatial/observation/day grouping.
The unchanged eleven-output genus objective and existing release gates remain.

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
