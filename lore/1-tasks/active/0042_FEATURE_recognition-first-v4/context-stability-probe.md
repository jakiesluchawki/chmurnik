# Small-Context Stability Probe

## Predeclared Protocol (2026-09-06)

Previous large framing tests used the older DINO MLP and different image areas.
This fixed study uses the existing reliability-weighted kernel candidate,
without training, new labels, threshold selection or opening held-out images.
It tests whether small view changes reveal fragile predictions and whether
one equal six-view aggregate improves original-photo classification.

- Checkpoint: uncalibrated assembled DINO Small kernel,
  SHA256 `d63fd93f1c5dc6eb35935ebc4b3d5b11d230703a17ea62fbd923d16d31ef2f86`.
  Existing head control SHA256
  `671382d070d721e4e31d699516264ceffc60bf8231129b24d73b96a8b25a4dbe`.
- Same frozen V2 manifest, 452 validation rows only. Verify original-image
  fingerprints/prepared-artifact hashes and actual source bytes. No calibration,
  original test, IMGW confirmatory images, reviewer packet or private feedback.
- EXIF-transpose and RGB as in the existing development pipeline. Resize the
  short side to248 with Pillow bilinear through the existing torchvision API.
  Fixed224px center crop, then translations of8px left/right/up/down, plus
  horizontal mirror of the center. All crops remain within the resized photo.
  Original center must reproduce the saved control within .001 logit error,
  zero top-1 changes; otherwise no comparative classification result is valid.
- Record every view, crop geometry, exact input-tensor SHA and full logits.
  Do not choose views using labels, scores or the apparent winning result.
- Exactly one alternative prediction: equal arithmetic mean of all six raw
  eleven-class logit vectors. Further consideration requires strictly better
  original-photo validation top-1 AND macro-F1 than center. A marginal gain is
  not by itself sufficient to justify six forward passes or a release.
- Report unchanged/all-six-stable center decisions separately from unstable
  decisions. Stability is not correctness or an acceptance policy. Do not
  silently filter difficult photos from the headline. Individual shifted
  regions have no independent genus annotations, and can contain multiple
  clouds; original-photo labels do not establish region-specific accuracy.
- Report raw452 and duplicate-aware449 metrics, per-source changes and CPU
  timing. All unchanged confidence, native parity, independent evidence and
  release gates remain mandatory. Preserve a negative result without retuning.

The prior goal turn was progress: the pinned specialist model was statically
audited, numerically reconstructed, evaluated under a fixed protocol and
rejected with retained evidence. No process from that turn is still running.
Meteorologist involvement remains deferred; no outreach is authorized here.

Implementation: `probe_v4_context_stability.py`; code/recipe-bound resumable
cache, no network access. Output: `.local/v4/context-stability-20260906/`.

## Completed Result (2026-09-06)

The frozen center control reproduced with zero top-1 differences and maximum
absolute logit error .00017426434, within the predeclared .001 bound. All452
source-file receipts passed. This was an uncalibrated development comparison,
not a shipped-model benchmark or an independent accuracy estimate.

| Population | Count | Center correct | Six-view mean correct | Center macro-F1 | Mean macro-F1 |
|---|---:|---:|---:|---:|---:|
| Raw validation | 452 | 290 | 285 | .64454740 | .63303353 |
| One representative per nonconflicting duplicate group | 449 | 287 | 282 | .64297396 | .63147436 |

The raw alternative corrected5 and regressed10 photos. By source:

| Source | Count | Center correct | Mean correct | Gains | Regressions |
|---|---:|---:|---:|---:|---:|
| CCSN | 288 | 182 | 179 | 4 | 7 |
| Clear-sky source | 20 | 20 | 20 | 0 | 0 |
| IMGW development samples | 144 | 88 | 86 | 1 | 3 |

All six views agreed on336 photos, of which240 agreed with the source label
(71.43%). On116 unstable photos, center agreed with50 labels (43.10%). Thus
96 of the162 center errors remained stable, while instability also flagged50
correct center answers. Stability cannot certify correctness and would not
meet the unchanged reliability requirement even in this exposed development
population. These are descriptive subsets, not a newly calibrated policy.
No source labels were inferred for individual shifted regions.

Top-1 changes versus center were51 left,38 right,60 up,62 down,36 mirrored.
Median six-view CPU forward time was .17103494seconds per photo; total recorded
forward time87.752195seconds. This excludes preparation/reporting, includes
the initial forward in the total, and is not native/device latency evidence.

**Decision: reject this fixed aggregate.** Both accuracy and macro-F1 regress;
no favorable-view selection, weighting adjustment, calibration, holdout access,
new fit, Core ML conversion, production change or release follows. Small-view
sensitivity explains some failures, but stable wrong answers show that it is
not the sole problem. The classifier reliability/native-input/fresh-evidence
gates remain open, with meteorologist participation still deferred by owner.

## Verification And Retained Evidence

Five focused tests and all240 ML/tooling tests pass, zero skips. Known tooling
version/deprecation warnings remain; this test result does not assert new
Core ML runtime compatibility. An independent local verifier, importing none
of the probe/metric helpers, recomputed source-file SHA hashes and all2712
input-tensor receipts using direct Pillow/NumPy resize/crop/mirror operations.
It replayed raw and duplicate-aware counts, macro-F1, source breakdowns,
corrections/regressions, stability subsets and view-switch totals from saved
logits. Double-precision loop aggregation and production diagnostic float32
means produce identical top-1 decisions on all452 cases. Verification PASS.

Runtime recorded in that receipt: Python3.12.14, torch2.12.1,
torchvision0.27.1, NumPy2.2.6, Pillow12.2.0. No images, local full result files
or checkpoint weights are committed or published with the research scripts.

Local evidence in `.local/v4/context-stability-20260906/`:

| Artifact | SHA256 |
|---|---|
| `evaluation.json` | `119335edad263873d17277a46d3df65c2c234787745c9363c478f1cdf0b3be1b` |
| `recipe.json` | `274b903df4b83649d1dfc0f0cf2aa38f08e241eab4c5b42ba3f6f1288938e953` |
| `views.pt` | `1a2603e1d9433cb0b021f79e88bc42dce5d23b9709b27b260ff7ed795a2735e3` |
| `independent-check.json` | `4db4ee0d9979964ab2591cfb7f3ab7230e3a49c38ba659183dae929ad56ae5ed` |
| `verify.py` | `168bbefc2707fe70a666d7bbd1863b5b393f035d84497bd6743f5ba23dd011f1` |

This turn made measurable diagnostic progress and encountered no technical
impasse. The overall goal is still active, not complete or blocked. No host
restart, security/permission changes or owner presence were needed.
