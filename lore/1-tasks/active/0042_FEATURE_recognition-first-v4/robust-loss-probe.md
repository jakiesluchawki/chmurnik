# Robust-Loss Paired Trial

## Protocol Frozen Before Fitting

The last goal turn produced evidence: the exact threshold audit ruled out the
grid cap as an explanation of the candidate's failed reliability gate. The
subsequent user-facing status readback confirmed that Cyber_Folks still serves
the earlier September6 package. Neither result changes recognition weights.

Test a different training objective, not another confidence adjustment.
Documented source-label conflicts motivate one generalized-cross-entropy (GCE)
trial. They do not establish which remaining labels are incorrect. Preserve
all source labels, photographs, groups and split assignments; never use model
agreement to manufacture ground truth.

Primary source: Zhang and Sabuncu, NeurIPS2018,
https://papers.nips.cc/paper/2018/file/f2925f97bc13ad2852a7a551802feea0-Paper.pdf
The per-target loss is (1 - p^q) / q, with fixed q=0.7 as in the paper.
The paper's synthetic-noise results are motivation, not evidence about clouds.
Our existing class weighting and 0.05 label smoothing remain in both arms;
their combination with GCE is an explicitly declared adaptation, not a claim
that the paper's robustness guarantees apply unchanged.

- Use the original hash-pinned DINO Small224 feature caches from the V2
  manifest:2325 training photos with two views and452 validation photos with
  one view. No new downloads, auxiliary data or backbone fitting.
- Paired128-unit FeatureMLP heads; identical initialization, dropout, shuffled
  batches and seed7042. Training-only normalization and square-root inverse
  class-frequency weights. AdamW lr0.001, decay0.01; cosine200 epochs to1e-5,
  batches64. Select maximum validation macro-F1 with the existing patience20
  and minimum30 epochs, at most200. No q/seed/architecture sweep.
- Control uses the exact existing weighted, smoothed cross-entropy. Require
  its selected logits to reproduce the retained control within1e-6 and with
  no top-1 changes before considering the GCE result.
- Candidate changes only the loss to the weighted soft-target GCE extension.
  Keep the same denominator as weighted cross-entropy. Do not truncate losses,
  prune samples, relabel, recalibrate, or adjust inference confidence.
- Report both arms and the frozen best RBF candidate on every validation row,
  duplicate-group representatives, cloud-only rows, each source and class.
  Retain predictions, epoch histories and checkpoints, including failures.
- Eligibility for further research requires validation macro-F1 at least
  0.6545474034701404 (the existing RBF plus0.01), improvement over the paired
  control, no raw/cloud top-1 regression against RBF, and no group-unique
  macro-F1 regression. This is not a release gate or fresh confirmation.
- If screening fails, reject this fixed recipe without a second q/seed fit or
  opening calibration/test/confirmation predictions. If it passes, the
  existing reliability, native-input and fresh-evidence requirements remain.

The UI/content release stays independent. No production classifier, app build,
Apple submission, web package, private-photo policy or host setting is changed.
The owner has deferred expert involvement; do not contact the reviewer.

## Completed Result

Both arms finished; the control selected epoch5 and stopped at30. Its logits
reproduce the retained previous control exactly (maximum error0, zero top-1
changes). GCE selected epoch18 and stopped at38. No second q, seed, optimizer,
data selection or smoothing trial was run after observing the result.

| Population | Frozen RBF | Paired CE | GCE q=0.7 |
| --- | --- | --- | --- |
| All452 validation photos | 290 | 288 | 280 |
| All-photo macro-F1 | 0.644547 | 0.631637 | 0.623513 |
| Unique449 photos | 287 | 286 | 278 |
| Unique420 cloud photos | 258 | 257 | 249 |
| CCSN288 photos | 182 | 181 | 173 |
| IMGW144 photos | 88 | 87 | 87 |
| Separate clear-sky source20 photos | 20 | 20 | 20 |

GCE has23 paired gains versus31 regressions relative to CE; relative to the
best RBF it has26 gains versus36 regressions. All declared screening conditions
fail. Reject this fixed training recipe. The result does not prove that GCE
can never help, that the source labels are correct, or that the current app is
reliable. It closes this specific loss-only replacement under the fixed inputs.
No calibration, test, confirmation or private feedback-image inference occurred.

Ten focused numeric/evidence-boundary tests pass, including the exact q=0
control and gradient, an independent NumPy weighted-soft-target calculation,
q-to-zero and q=1 limits, the hard-target gradient multiplier, finite extremes,
autograd finite-difference checking, input rejection, control drift, duplicate
group handling and every eligibility condition. All267 ML/tooling tests pass,
zero skips. Existing coremltools dependency-version warnings remain; this trial
does not perform a model export or claim platform compatibility.

Independent replay did not import the trial's metric or inference helpers.
It verifies all452 records against the pinned manifest, source/group identities,
all54 population reports from rebuilt confusion matrices, checkpoint/feature/
recipe/code hashes and paired counts. NumPy float64 matrix operations with
SciPy's normal CDF reproduce the two GELU heads: maximum logit error4.019007e-6
for CE and1.087137e-5 for GCE, zero top-1 changes in either case. This is numeric
verification, not independent meteorological annotation.

Artifacts: `.local/v4/dinov2-robust-loss-20260906/`. Full aggregate result is
retained alongside this note as `robust-loss-evaluation.json`.

- Recipe SHA256: `439b8b413f6e97723a68ebfa0c08d268a086c05e01aeab17a4337f5387fc1eeb`
- Predictions SHA256: `a1985486efc8466dff62ac2f87cb3aef84d75ef7263c45cf20b93e13b7d40c20`
- Evaluation SHA256: `f46cbf815cbea8a198d552a4cff4d20f6090856ff0519acd2f25c9f09dd7acd8`
- GCE head SHA256: `ee0542e2753e8a936127175c84d29b37000d73487a71f2e5d00245c13c89326f`

This is concrete negative evidence and preserved training work, not a blocked
or complete goal. No production file, shipped weights, Apple submission,
hosting deployment, private-photo permissions or system security setting changed.
Future work needs a distinct evidence-backed intervention rather than another
q/seed sweep on these already-used validation photographs.
