# Vienna Four-View Supervision Trial

## Declared Before Sample Selection And Fitting, September 6

Previous turn made progress: negative GLOBE partial-label trial, completed
Vienna license/schema/reuse audit and 186 passing tests. This next hypothesis
uses operational annotations and multi-instance supervision, not another
same-data head/weight search. No promise of improved accuracy follows from
larger data or a more complicated objective.

Source: Rosenberger (2024), CC-BY-4.0,
<https://zenodo.org/records/14185063>. Follow Table 2 and the observation limits
in <https://doi.org/10.1029/2024EA004112>. Labels concern four low-resolution
views jointly; SYNOP reports have priorities and are not exhaustive labels of
all visible genera. Unknown levels remain unknown. Dates are unavailable in
the downloaded training file, so no temporal independence is claimed.

## Fixed Sample And Admission

Use only the already hash-verified 13,912 training rows and four 100x64 RGB
views per row. All selected rows remain auxiliary training-only. No original
or Vienna validation/test labels are used to select new observations. Choose
at most 16 rows for each of 12 positive-constraint buckets: nine exact genera
(no invented exact Ns), clear, {As,Ns}, {St,Cu}. Sort buckets rarest first,
then rows by SHA256 of `6042:row_index`; select each row once. Max 192 bags.
Preserve every reported positive constraint, not just the sampling bucket.

Render all four views of every selected bag and record a technical review
decision, without meteorological relabelling or predictions. Exclude visible
people/body fragments, invalid images and images unusable even at source
resolution; exclude the whole bag, never silently drop a direction while
keeping its full-sky label. No replacement after exclusion. Preserve original
RGB exactly as PNG; enlargement for viewing adds no source information.

Compare exact pixel/dHash<=8 fingerprints against every old-manifest row and
across different bags in this sample; any flagged view excludes its entire bag
conservatively. Overlap within the same already-grouped observation is allowed.
Near matches are not asserted to be copies. This screening cannot establish
capture-day independence or rule out every crop reuse. Need >=120 bags and
at least 6 retained in 8 of 12 sampling buckets to run the fixed pilot.

## Source Constraints

Low: codes 1/2 imply Cu; 3/9 Cb; 4/5 Sc; 6 St; 7 {St,Cu}; 8 both Cu and Sc.
Middle: 1 As; 2 {As,Ns}; 3-9 Ac. Middle 7 always includes Ac across its alternatives;
do not require As/Ns or infer absent genera. High: 1-4 Ci; 5-8 Cs; 9 Cc.
Do not infer additional visible parent clouds from the origin/species code.
Codes 0 and unknown contribute no positive cloud constraint. Only the explicit
triple (0,0,0) supplies clear-sky supervision for all four views.

## Fixed Representation And Paired Fit

Use the same pinned frozen DINOv2 Small backbone and original 2325-image
training/452-row validation caches as the GLOBE trial. Require the checkpoint
and cache hashes plus the previously verified 72-photo feature replay. New
views use whole-frame 224px edge padding, no crop or synthetic detail. Extract
one view per source direction, no flip, into a resumable identity-bound cache.

Fit the existing 128-unit FeatureMLP twice with original seed 7042, identical
initial weights, original minibatch order, train-only normalization and
original dropout stream. Original CE/AdamW/scheduler/early-stop recipe is
unchanged. The auxiliary arm samples 8 four-view bags per original 64-image
step, balanced by the fixed sampling bucket, auxiliary seed 6042, loss weight .5.

For each positive allowed set, use the largest set probability over the four
directions: `-log(max_view(sum_genus_in_set(softmax(logits))))`. Max pooling
does not assert conditional independence of overlapping directions. Mean over
constraints within each bag, then over bags; explicit all-clear bags use mean
per-view clear CE instead. This is weak supervision: the winning direction is
latent, not a new ground-truth annotation. No absent-label penalty, threshold,
weight grid, pseudo-label, backbone tuning or post-result recipe adjustment.

Save both complete histories, selected heads, logits, source/class breakdowns
and source/code/cache identities. Require auxiliary macro-F1 >= .6545474034701404
and > paired control before any calibration/holdout access. Existing release
precision/count/coverage/robustness/native/fresh-evidence gates remain unchanged.
This trial alone cannot authorize shipping a model or claim region accuracy.

## Admission And Pre-Fit Audit

Selected 192 bags (768 views), exactly 16 in each of the 12 buckets. All eight
contact sheets were visually reviewed for technical suitability and privacy,
not for replacement genus labels. Three bags were excluded for severe water
film/droplet obstruction: V09715, V06430, V03383. The separate conservative
fingerprint screen excluded 34 bags. No replacements were sampled.

The resulting 155 bags / 620 views meet the declared size and bucket gate:

| Sampling constraint | Admitted bags |
| --- | ---: |
| Clear | 5 |
| Cc | 13 |
| As or Ns | 16 |
| As | 16 |
| Cu or St | 13 |
| St | 13 |
| Cb | 15 |
| Cs | 10 |
| Cu | 15 |
| Sc | 13 |
| Ci | 12 |
| Ac | 14 |

All but the clear bucket retain at least six bags. Some droplets, glare,
station hardware and low-detail weather remain. Source labels are unchanged,
including apparently questionable clear observations; this is deliberately a
weak-label trial, not independent meteorological adjudication.

Independent read-only code review verified the SYNOP mapping, numerical loss,
gradients and paired original RNG stream. It found two enforcement defects
before fitting: selection identity was recorded but not enforced, and a stale
overlap report was trusted. Both were corrected without changing the declared
learning recipe. Admission now checks frozen selection fields and source
hashes, verifies actual image fingerprints and four-view identities, and
recomputes overlaps against the current original manifest. Added regressions
cover both defects, loss semantics, admission thresholds and cache resume.

## Outcome

Completed September 6. No sample had been selected or fitted at protocol
creation; the admission section above was added after screening, before model
inference. The final independent review closed both enforcement findings,
including a synthetic 128-bag integration check. All 207 ML/tooling tests pass,
zero skips. Existing CoreML dependency compatibility warnings are not export
verification; no conversion was attempted in this experiment.

Replay of 120 original feature vectors from 72 photos has maximum absolute
error 0. The new 620-view feature cache completed. Both fits use the declared
recipe; the selected control head is byte-identical to the previous GLOBE
control, a further paired-pipeline check.

| Arm | Selected epoch | Total epochs | Correct / 452 | Accuracy | Macro-F1 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Original-only control | 5 | 30 | 288 | 63.72% | .6316373631 |
| Original + Vienna bags | 11 | 31 | 280 | 61.95% | .6211057976 |

The auxiliary arm fails both predeclared selection requirements: it is worse
than the control and below .6545474034701404. No calibration/holdout split was
opened, no weight was retuned, and no model was exported or deployed.

| Validation source | Control | With bags |
| --- | ---: | ---: |
| CCSN | 181/288 | 178/288 |
| Dedicated clear source | 20/20 | 19/20 |
| IMGW 2024 samples | 87/144 | 83/144 |

| Genus / output | Control correct | With bags correct | Support |
| --- | ---: | ---: | ---: |
| Ci | 17 | 19 | 30 |
| Cc | 33 | 32 | 46 |
| Cs | 30 | 28 | 48 |
| Ac | 22 | 22 | 43 |
| As | 18 | 21 | 37 |
| Ns | 26 | 28 | 44 |
| Sc | 43 | 39 | 57 |
| St | 10 | 12 | 35 |
| Cu | 24 | 22 | 36 |
| Cb | 35 | 28 | 46 |
| Clear | 30 | 29 | 30 |

There are 26 improved and 34 regressed validation rows. The broad source
decline and Cb regression argue against selecting favorable class slices as
a deployment justification. These are descriptive results on already-exposed
validation data, not a fresh test or causal diagnosis of individual errors.
The negative result rejects this fixed pilot, not every possible use of
Vienna data. Do not reopen a weight/threshold search on these same outcomes.
No increase in model size was needed for this trial, and no claim of improved
recognition, calibrated confidence or region accuracy is supported.

## Reproduction And Evidence

Run selection only against the pinned, verified training download:

```sh
../chmurnik/.local/ml-venv/bin/python ml/cloud-recognition/vienna_bags.py \
  --source .local/v4/vienna-audit-20260906 \
  --manifest .local/v4/data-v2/manifest.json \
  --output .local/v4/vienna-bags-20260906
```

Technical review decisions are preserved in `reviews.csv` and the companion
`technical-review.json` in that local sample directory. Fitting refuses an
unfinished review, stale selection/overlap, or incompatible original cache.

```sh
../chmurnik/.local/ml-venv/bin/python ml/cloud-recognition/probe_vienna_bags.py \
  --sample .local/v4/vienna-bags-20260906 \
  --manifest .local/v4/data-v2/manifest.json \
  --features .local/v4/dinov2-imgw-linear \
  --output .local/v4/vienna-bag-trial-20260906
```

The completed output deliberately refuses overwriting or silent retraining.
Source photos, caches and heads stay local. The frozen recipe records every
selection/review/code/source hash and ordered admitted IDs. Evidence SHA256:

| Artifact | SHA256 |
| --- | --- |
| Recipe | `18d0bac4060917baf8378c1ec0d5c6d088e466a28da42f4907f49b731775c4c5` |
| Evaluation | `bd995a3484c113fd04f4384f6d75ac0f612f0a51940eed3d6bad74ed30880de8` |
| Original cache replay | `948cd958647628689190101c759cb878e3950051ea8f44ffc0c125e884e0d82d` |
| Validation breakdown | `42f223913825474447b2b7254658759cec91a32565d06ebf2c8cc6566a9f8d70` |
| Auxiliary features | `6c3cbca7cac8b51d619a0c2d91b47f402023010ac3a27dffd36395a8829c3649` |
| Control head | `2d6b265314d435d52d09cfdb1c34486155d090fc4e26a85cde3bf08b2d68b5fa` |
| Bag-supervised head | `14cec81945e221533320ed73bfb16620e181aa129db996059e23f2f57f8674dc` |

This goal turn made measurable progress and completed without an environment
blocker. The overall reliability goal remains active. The separately submitted
1.2 UX/content release is not represented as a classifier upgrade.
