# Source-Balanced Trial: Rejected

Completed2026-09-06 after the [predeclared protocol](source-balance-probe.md).
This is a negative training result, not an app-model update.

## Validation Outcome

| Population | Reference control | Equal source/class weighting |
|---|---:|---:|
| All452 rows, correct | 290 (64.16%) | 279 (61.73%) |
| All rows, macro-F1 | .644547 | .617689 |
| Unique449 photos, correct | 287 (63.92%) | 276 (61.47%) |
| Unique-photo macro-F1 | .642974 | .616071 |
| Cloud-only422 rows, correct | 260 (61.61%) | 249 (59.00%) |
| Unique420 cloud photos, correct | 258 (61.43%) | 247 (58.81%) |
| CCSN288 rows, correct | 182 | 173 |
| IMGW144 rows, correct | 88 | 86 |
| Separate clear-sky20 rows, correct | 20 | 20 |

Six rows improve and17 regress. This fails the unchanged .6545474034701404
macro-F1 requirement and all/unique/cloud no-regression checks, as well as the
additional source-preservation criterion. Equal source influence did not fix
the observed weaknesses under this frozen representation and kernel recipe.
This does not disprove every source-adaptation method or establish that source
bias is absent. Do not retry arbitrary source ratios against these results.

Influence was changed exactly as intended. For each cloud class, CCSN and IMGW
each receive50% of training mass, with relative frozen OOF-quality ratios
inside each source/class cell preserved. Clear-sky similarly splits equally
between its two available sources. Class totals and original/mirror factors
remain equal. On a2,325-photo influence scale, source totals become
CCSN1,056.818, IMGW1,162.5 and separate clear-sky105.682. There is no fitting
or normalization on validation and no modification of source labels.

These are agreements with retained source labels on repeatedly used
development data. They are not independent field-accuracy estimates, and
the control is the experimental DINO model, not the shipped classifier.
`source-balance-result.json` preserves full confusion and36 population reports.
Its single-class subsets describe conditioned outcomes; use the all-row
matrix to derive proper full-population per-class precision/F1.

## Verification and Evidence

Control refit reproduces retained logits exactly, zero changed predictions.
Float32 checks at batches1/4/32/452 have maximum absolute logit errors
.000174265(control) and .000242125(candidate), with zero prediction changes.

Independent NumPy/SciPy replay reconstructs original and balanced weights,
source/class totals and train-only scaler, then solves the weighted kernel
normal equations directly. It does not import sklearn's estimator or our
probe, head or metrics helpers. Maximum logit errors are2.58318e-11(control)
and2.49880e-11(candidate), with zero label changes. All36 population reports,
gains/regressions and the rejection decision agree. This repeats only the
declared mathematics for verification; it is not another selected recipe.

Seven focused and all291 ML/tooling tests pass, zero skips. Existing
coremltools/version/deprecation warnings remain; no candidate conversion was
attempted. Fit/scoring time2.1seconds excludes artifact loading, test suite
and independent full-equation replay. No process remains running for the trial.

Private artifacts: `.local/v4/dinov2-source-balance-20260906/`.
Verifier: `.local/v4/verify_source_balance.py`; its checksum and result are in
`source-balance-replay.json`. No original/private photos were read or uploaded.

| Artifact | SHA256 |
|---|---|
| Recipe | `f1c14a2354b8c9455bdf7fb791f183ac2f196dcb61850b5e49b800e9d34a3953` |
| Evaluation | `b5adf5b685adf012de4aa953c4c2de5f19a434a5e734dc647647f2276ccdd145` |
| Control head | `a20dc2ccefbdce8bc744b40eb011d2e7d6759a4dfa3b6f8653591adec3e441f7` |
| Candidate head | `c394b12dc01771dfe6d4a1acf32e256fe4b0fbaed522668f9b9819e57ad5d609` |
| Independent replay | `c69c1bd70d12270571d5996b2a4737fe150150dee60e54935ab8461ad1ddc906` |

No calibration/holdout use, Core ML export, model replacement, web deployment
or Apple submission followed. The overall goal remains active and the
owner-deferred expert review remains deferred. This completed negative trial
changes the next research decision without satisfying the reliability gate.
