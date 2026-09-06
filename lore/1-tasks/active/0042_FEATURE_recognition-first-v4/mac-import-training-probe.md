# Mac Import Training Probe

September 6, 2026. Protocol fixed before extracting imported training features
or fitting this trial. The preceding 452-photo Mac JPEG parity run failed:
four non-tie changes, eleven total changes, maximum probability error .169106.
The calibrated candidate itself remains unapproved. This probe addresses a
measured input-distribution difference; it is not permission to relax gates.

## Fixed Experiment

- Use only the frozen V2 2325 training and 452 validation photographs. Preserve
  IDs, labels, duplicate/capture groups and the manifest digest. Verify frozen
  source identity before export. No calibration or test images.
- Encode each development photo with the actual Mac operation: ImageIO
  transformed thumbnail, 1800px cap, UIKit JPEG quality .86. Use a Catalyst
  CLI, no app UI or user library. Hash originals, encoded files and executable.
- Reuse the selected calibrated DINOv2 Small backbone, 224px/.902 center crop,
  two training views (original and horizontal flip), one validation view.
  Freeze the original training-only out-of-fold quality weights. No relabeling
  or new quality estimates using validation. Gamma .25/768 and alpha .1 stay.
- Fit exactly one kernel head using imported training views in place of raw
  training views. Keep the original head as control. No parameter sweep.
- Evaluate both heads on the same raw and imported validation feature sets.
  Use the existing raw cache only after verifying its full identity and digest.
  Report top-1, macro-F1, per-class confusion and all logits. Do not select
  using four individual errors or reuse exposed tests to choose this head.
- Advance only if imported-validation macro-F1 and top-1 both strictly improve
  over control, while raw-validation macro-F1 and top-1 do not regress. Even a
  pass only permits further evaluation; it does not satisfy calibration,
  native-export, fresh-evidence or release requirements.

The source datasets have known annotation limitations. This does not produce
independent human labels, evaluate physical iPhone codecs or contact the
owner-deferred meteorologist. Do not alter any shipped model, memory cap,
privacy behavior, application release, hosting or Apple submission.

## Source Identity Correction Before Extraction

The initial attempt stopped before export or feature extraction because its
new verifier compared IMGW's original-image fingerprint with the deliberately
resized stored JPEG. Inspection of `imgw_data.py` and `freeze_imgw_v4.py`
confirmed that the frozen `artifact_sha256`, not the original pixel hash,
binds these IMGW working files. The verifier now checks that exact artifact
hash when provided, and decoded-pixel identity for other sources. Added
regressions for both cases and corrupted hashes. No manifest, file, label,
split or scientific selection rule changed. Preserve the initial recipe and
run the corrected harness in a new output directory before any fit.

The IMGW working images are at most 640px and already JPEG92, not original
multi-megapixel camera files. This trial is explicitly limited to this
development corpus; the separate synthetic 12MP probe does not remove that
real-photo evidence gap.

## Completed Trial

The corrected run exported all 2777 development photos (79,124,054 bytes of
JPEG data). An independent Node audit verified every encoded hash and that
all 452 validation files exactly reproduce the bytes previously used by
the Catalyst parity runner. All frozen source-identity checks passed.

Sandboxed PyTorch reported MPS unavailable despite macOS 26.6.2. That attempt
stopped before feature extraction; the approved elevated invocation resumed
the same recipe and completed with Metal. No host restart, UI interaction,
system-setting change or CPU/device substitution was needed. Both feature
caches are complete; the kernel head was fitted exactly once.

| Head | Validation input | Correct / 452 | Top-1 | Macro-F1 |
|---|---|---:|---:|---:|
| Control | Raw | 290 | .641593 | .644547 |
| Control | Imported JPEG | 286 | .632743 | .635635 |
| Imported-training candidate | Raw | 290 | .641593 | .642533 |
| Imported-training candidate | Imported JPEG | 289 | .639381 | .641494 |

**Do not advance this candidate.** Imported-input results improve, but raw
macro-F1 regresses under the predeclared rule. Raw top-1 remaining unchanged
does not excuse the per-class regression. No JPEG-quality/alpha/gamma sweep,
new calibration, test-set evaluation or deployment followed this result.

These four cells are Torch feature/head measurements, not new native Core ML
scores. In particular, the control's 286 imported Torch answers should not
be substituted for the 288 native answers in the earlier parity report.
Decoder/accelerator and full-pipeline parity boundaries remain explicit.

Float32 head evaluation matched the fitted sklearn predictions without any
top-1 change (maximum logit error .0002111323). The original control cache
reproduced the saved control logits with no top-1 change (maximum .0001742643).
An independent Python audit checked all four complete logit matrices, IDs,
feature hashes, recipe/code bindings and every confusion matrix, recomputed
top-1/macro-F1 from integer class counts and confirmed the failed admission.
No independent human/cloud-label validation is claimed.

Eight new tests cover immutable identities, preservation of labels/groups,
receipt ordering/duplicates, forbidden splits, path traversal, file/hash/size
tampering, original-versus-derived source semantics and the no-regression
admission. Full ML/tooling regression is recorded in the task worklog.

## Retained Evidence

Completed artifacts: `.local/v4/mac-import-training-20260906-v2/`.
The earlier `.local/v4/mac-import-training-20260906/` contains only the
pre-export failed recipe, not a second model trial. No image is published.

| Artifact | SHA256 |
|---|---|
| evaluation.json | `f0f05415c501069b18763c5e59ea526bb2b30b0568f4486a05f5f0cf7002c303` |
| recipe.json | `a49e88fe4fa90fe86736e8bfedfeee5d9ffd76825f20f46896ba26560bc0904d` |
| imported/receipts.json | `7f2195e0952f3afd683a0a43a818cf6fcfe1452d359a71ac43766e4d60bad9f0` |
| train-features.pt | `384c283420968612223d2bfe79d917929c20dcd45f34ba1ed3484f048ad5e49f` |
| validation-features.pt | `f4285bbbe5f395b1791443333911bd75ed5d2729106cb7eefdd73bc9fa6fd59d` |
| head.pt | `c0375f0f8f8dd317e1feb81389e9758927392a989adcc2e3f49b471c2c0926b5` |
| importer executable (in prior diagnostic artifact folder) | `d2847be175692653f6df366dde7c09028b55a428423a911380bc7c89b63c9fd9` |

Import matching alone does not solve the classifier's reliability or raw
generalization. Preserve the original candidate and failed coverage gate;
future work needs a separately declared data/model improvement, not another
reinterpretation of the same validation results. The owner-deferred expert
review and Apple/web delivery boundaries remain unchanged.
