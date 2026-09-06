# GLOBE Partial-Supervision Trial

## Predeclared September 6, Before Selection or Training

Hypothesis: additional independently crowd-labelled sky photographs can help
generalization without inventing precise genera from the source's union labels.
This is a bounded supervision trial, not another search over existing-data
heads. Crowd agreement is not expert accuracy. All new photographs are
development-only; neither these labels nor existing exposed tests provide fresh
confirmation of real-world accuracy. No product model changes in this trial.

Source: [NASA GLOBE CLOUD GAZE](https://zenodo.org/records/7853217), pinned
`GAZECloudTypeAll_20230328.csv`, MD5 `7029a6efd57e67b239f1b166a916aa08`.
The record explicitly permits research and commercial use and requests
attribution. Preserve the record, original CSV and per-photo source URLs locally.
These data were obtained from the Zooniverse online platform, the GLOBE Program
and NASA Langley Research Center. No private owner feedback is used.

## Sampling and Admission

- Exactly one photo per observation, globally across categories. Require one
  positive category, complete binary flags, agreement >= .8, >= 5 classifiers.
- Exclude the 42 previously inspected observations and their alternative views.
  Select up to 64 observations in each of six source categories, rarest first
  (Sc, Cc/Ac, Ci/Cs, As/St, Cu, clear), deterministic SHA256 seed9042 order.
  Cb, contrails, haze/smoke and dust are excluded by protocol, not by predictions.
- Preserve Cu, Sc and clear as source singletons; retain {Cc,Ac}, {Ci,Cs} and
  {As,St} as unresolved allowed sets. Never split a union into guessed genera.
- Maximum 384 files, 2 MB per file, 150 MB total. Do not replace failed downloads.
  Verify decoded JPEG format/size, raw SHA256 and decoded pixel fingerprints.
- Compare decoded fingerprints/dHash<=8 with all original frozen rows and among
  new rows. Conservatively exclude flagged rows; similarity is not proof of
  a duplicate, especially for uniform skies. Preserve exclusion evidence.
- Review all surviving full-frame contact sheets for visible people, unusable
  images and corruption. Record a decision for every downloaded image, without
  seeing model predictions or changing source labels. This is a technical visual
  screen by Codex, not meteorological annotation or expert validation.
- Retain original dates/directions/observation groups privately. All admitted
  rows train-only. Record the limited capture-day diversity and residual
  undetected crop/reuse risk. Need >=240 admitted images and >=32/category to
  run this pilot; otherwise report insufficient data without loosening rules.

## Representation and Paired Training

Use the frozen DINOv2 Small backbone and original V2 training/validation feature
caches, checking manifest and checkpoint identities. New photographs use the
whole RGB frame, EXIF-corrected, bilinear fit inside224x224 and edge padding,
with original/horizontal-flip views. Do not assign a whole-frame source label
to a crop that can omit the cloud. Existing photo preprocessing is unchanged.
This auxiliary geometry is a domain difference, not a new product pipeline.

Fit the existing 128-unit FeatureMLP twice with identical initial parameters,
original-data minibatch order and random seed7042. Train-only normalization
uses original features in both arms. Preserve the previous AdamW recipe:
lr.001, weight decay.01, cosine200epochs, batch64, sqrt inverse-class weighted
cross entropy, label smoothing.05, max200epochs, early stopping after30epochs
and20without improved validation macro-F1. Select separately by the same452
original validation rows; preserve per-epoch history and all selected logits.

The added-data arm also sees one batch32 per original-data step, sampled with
equal total influence per source category. Auxiliary loss coefficient .5:
`-log(sum(softmax(logits)[allowed_genus_set]))`. This does not train an arbitrary
member within a union. No new-label smoothing, pseudo-labels, confidence-derived
relabelling, weight search, extra augmentation or backbone tuning. Seed auxiliary
sampling separately so the original-data order and dropout stream stay paired.

Require candidate validation macro-F1 >=.6545474034701404 (previous best+.01),
and > paired control, before calibration/holdout evaluation. Save negative
results without opening those splits. Any later selected checkpoint still needs
the unchanged accepted-cloud precision/count/coverage, robustness, export/native
parity, privacy and fresh-evidence gates. This pilot cannot authorize shipment.

## Results

The protocol above was frozen before admitting or fitting additional photos.
The following evidence was appended after the September6 paired trial.

### Admission and Pre-Fit Review

Selected384 observations across11 capture dates (January15-25,2022); downloaded
378 valid images,113,051,760bytes. Six fixed failures remain unreplaced: three
format/pixel-limit rejections and three size-limit rejections. Inspected all16
full-frame contact sheets plus enlarged ambiguous foregrounds. Ten technical
person/body-fragment exclusions (including two conservative unresolved cases)
and one strong-defocus exclusion; no meteorological labels changed. The dHash
screen independently flags5 additional rows, mostly uniform skies; these are
conservatively excluded, not asserted to be proven copies. Admitted362:
Sc61, Cc/Ac63, Ci/Cs63, As/St56, Cu61, clear58. All remain training-only.

Selection SHA256 `4dc1a2e63dbe3c4ad7f45e3a465891b20e507dafed6e615f4b943c5c023dced9`;
visual-review SHA256 `6d04e33ba6bd6c46d089d4124c082c04a5b6f80408dec9db867b5a9ef7a08eee`.
Artifacts are private in `.local/v4/globe-partial-20260906/`.

Independent code review found a cache/backbone identity validation gap, not
evidence of mismatched actual artifacts. Before fitting, require the original
unmasked Small cache identity and checkpoint SHA256
`2363831b37253517daeddb82fe31b852893db31d393e0ca4bd9b6a9a671263ac`.
The space-saving archive reconstructed all179 original tensors and metadata
exactly, including the same serialized checkpoint hash. Additionally reproduce
features from16 train and8 validation photographs per source, SHA256 seed9042
selection, original two/one views, checking original pixel/artifact hashes and
maximum feature error <=.001. Save the actual comparison. This checks72 photos,
not every original cache row. No predictions, calibration or test data enter it.
This safeguard changes no model, input, loss, sampling or selection parameter.

### Paired Outcome: Rejected

The cache replay reproduced all120 feature vectors from72 photos exactly
(maximum absolute error0). Extracted two views of each of the362 admitted
photos. Both arms completed30epochs and selected epoch5. The control exactly
reproduces the earlier V2 MLP validation result; it is not the shipped native
ensemble and this452-row validation is not the separate123-row regression test.

| Development validation | Control | Added partial labels |
| --- | ---: | ---: |
| Correct /452 | 288 | 278 |
| Top1 | 63.7168% | 61.5044% |
| Macro-F1 | .6316373631 | .6198024268 |

The added-data arm corrects15 control mistakes but loses25 control successes:
net10 fewer correct, -2.2124 percentage points top1 and -.01183494 macro-F1.
By source, CCSN falls181->174/288, IMGW87->84/144, and clear remains20/20.
By genus, Stratus improves10->16/35, but Stratocumulus falls43->38/57,
Cirrocumulus33->29/46 and Cumulonimbus35->32/46. These descriptive slices do
not authorize class-specific cherry-picking or retuning on the same validation.

The candidate misses both predeclared selection conditions. No calibration,
test evaluation, Core ML export, product weights, thresholds, native bundle or
public site changed. This is evidence against this specific augmentation
recipe, not proof that all partial-label or multi-label methods cannot help.
Retain the failed trial; do not search auxiliary weights against this result.

All177 ML/tooling unit tests pass with the existing local OpenCV dependencies,
zero skips, including15 new data/loss/review/cache tests. Independent review's
identity-binding finding was fixed before this trial. No new native/browser
regression is claimed for these research-only files.

### Reproducible Artifacts

Private output: `.local/v4/globe-partial-trial-20260906/`. No source photos,
identifiable review material or model binaries are committed.

| Artifact | SHA256 |
| --- | --- |
| recipe.json | `89b3e824d324c94aa0b9685a5b09f4fa2015b5468380a52f8514cda93c6ccbe7` |
| evaluation.json | `0d1763a17f1e4117dc0b883e7019f01757e315bd79a7215aabe72e66d042e213` |
| cache-binding.json | `948cd958647628689190101c759cb878e3950051ea8f44ffc0c125e884e0d82d` |
| auxiliary-features.pt | `99968690c10c99caa958e7cb96afbf4d553938430b9deb96b4d451356e344dc1` |
| control/head.pt | `2d6b265314d435d52d09cfdb1c34486155d090fc4e26a85cde3bf08b2d68b5fa` |
| partial/head.pt | `79d28caa96c397b22ebe71234ec9aa033040da38a27f82ff9b073e8ccd78dfcf` |

Command (existing local ML environment, CPU, no host UI required):

```sh
../chmurnik/.local/ml-venv/bin/python ml/cloud-recognition/probe_globe_partial.py \
  --sample .local/v4/globe-partial-20260906 \
  --manifest .local/v4/data-v2/manifest.json \
  --features .local/v4/dinov2-imgw-linear \
  --output .local/v4/globe-partial-trial-20260906
```
