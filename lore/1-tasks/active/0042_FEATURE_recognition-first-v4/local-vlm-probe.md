# Local Vision-Language Trial

## Fixed Protocol, Before Inference (September6)

Previous goal turn was progress: offline preservation was reproduced, fixed,
tested and published separately. The current turn returns to classification.
Prior DINO/ConvNeXt/SigLIP feature and supervision trials did not establish
release-eligible reliability. General Astra diagnostics are not a deployed
local model. Test one training-free local VLM, not another fitted head or
another retrospective prompt search.

Use `mlx-community/Qwen3-VL-4B-Instruct-4bit`, revision
`2fd8dacbdb8f1e54b8c005f081ec5bf79c56376b`, derived from the Apache2.0
Qwen3-VL4B Instruct model. Its single safetensors weight file is3,093,767,283
bytes, SHA256 `90eeb02604181dbcccd0a30a1f550a4a8928ca7dcbee4aee1449239306cfdfca`.
Use isolated MLX-VLM0.5.0 (wheel SHA256
`3351d6ccf609cbf57a4c8cd8308e9a1ce469883d8679d9968c6c6f77af016419`),
record resolved dependencies and downloaded metadata hashes. No remote model
code, unpickling downloaded weights or remote photo inference. Conversion
provenance is stated by the publisher, not numerically verified against BF16.

Sources: [base model](https://huggingface.co/Qwen/Qwen3-VL-4B-Instruct),
[MLX port](https://huggingface.co/mlx-community/Qwen3-VL-4B-Instruct-4bit),
[runtime](https://github.com/Blaizzy/mlx-vlm). The card does not establish
meteorological accuracy, mobile memory suitability or CoreML parity.

Use every452 validation row in the unchanged V2 manifest SHA256
`d5b0ca33e0867bbb0d0fd25dbd08fc20cfeea316a89299e53f63a6bee5d0ea1c`.
Verify all source/artifact identities, preserve canonical labels and groups.
The inference process receives anonymous ordered PNG paths, not labels,
source filenames, model outputs, conversation history or exemplar answers.
EXIF-orient RGB and fit the full frame within448x448 with Lanczos, without
upscaling or center cropping; record image dimensions and bytes. The model's
processor may round dimensions to its patch grid; record exact input tensors.
This is a comparison of complete strategies, not an isolated backbone swap
or parity claim against DINO's center square.

One English prompt asks for the most prominent visible cloud structure, using
only visible evidence and a fixed code table in canonical GENERA order:
A Cirrus, B Cirrocumulus, C Cirrostratus, D Altocumulus, E Altostratus,
F Nimbostratus, G Stratocumulus, H Stratus, I Cumulus, J Cumulonimbus,
K visibly clear sky, X inability to identify reliably. Request the code alone,
greedy generation, maximum8 tokens, no examples or follow-up. Retain raw text.
Only an exact stripped single permitted uppercase code is valid. X and
malformed responses remain in the denominator; never silently map uncertainty
to clear sky. The prompt is frozen in the checked-in runner before inference.

All452 rows are planned, with atomic per-image receipts and strict resumption
binding to model, input, prompt and runner. First perform a blank-image runtime
smoke test without tuning the prompt. Limit MLX allocations to4GiB and cache
to128MiB; do not change host-wide memory/lock/security settings. Readback reports
8GiB host RAM and59% system-wide free memory before setup. Stop on memory errors
and preserve the receipt, rather than repeatedly allocating or killing tasks.
No claim that this3GB model belongs in the app follows from a successful load.

Report complete raw and duplicate-group-aware source-label agreement, per-class
and per-source counts, macro-F1, refusal/format counts, runtime and peak process/
MLX memory. Compare against the frozen290/452 DINO control, macro-F1.6445474;
advance only if both accuracy and macro-F1 improve. This validation has been
reused for development and is not independent confirmation. Do not recalibrate,
open holdouts or replace the current app model during this trial. Source label
noise, mixed scenes, unknown pretraining overlap, calibration, native parity,
privacy and release qualification gates remain unchanged. No expert outreach.

## Preparation And Runtime Compatibility

All452 inputs were prepared and source-verified; inputs.json SHA256 is
`598aa03ba44d58e263cd8cc8410435e8a1b8a3be841a2e95722208b37ff9333c`.
All246 ML unit tests pass, including six new protocol/scoring tests. The model
download completed with every expected size and hash verified; receipt SHA256
is `1f9bfa247fd00a503d6291617cd6dd794e4b6a9dc487e3531f038f0018fb6e57`.

The sandbox could not access Metal; an approved GPU invocation outside the
sandbox required no host security/UI change. Its first blank-image smoke test
loaded the weights in3.621 seconds with3,095,389,624 active MLX bytes, but failed
before generation: MLX0.32.2 rejects an MLX scalar repeat-count passed by
Qwen3-VL's vision tower. This is not a classification result or memory failure.
The failed receipt remains at `.local/v4/local-vlm-smoke-20260906/`.

Before any photo inference, pin only mlx/its paired mlx-metal wheel to0.32.0
inside the isolated venv. It satisfies MLX-VLM0.5.0's >=0.31.2 requirement.
Preserve the original install report and write the compatibility install report
separately. Do not patch vendor model code or alter weights, prompt, image
processing, token limit, population or quality gates. Use a new smoke directory,
not an overwritten failed receipt. Record the actually loaded versions in every
inference receipt. The [MLX-Knife compatibility notes](https://github.com/mzau/mlx-knife/blob/main/CHANGELOG.md)
independently describe this0.32.2 Qwen-VL failure and a <0.32.1 pin; our own
blank-image execution, not those notes, must establish runtime success here.

The0.32.0 blank-image attempt completed:3.522s load,4.172s generation,
3,429,877,014 peak MLX bytes. It returned K (clear sky) for a uniform gray image,
not the uncertainty code. This is an out-of-domain warning, not proof of
cloud identification, and it is retained without adjusting the prompt. Runtime
success only permits the fixed452-image validation. The macOS process RSS
counter (632,438,784 bytes) does not include all GPU/shared allocations; it must
not be presented as total model memory. Both counters are retained separately.

## Complete Result And Decision

The frozen runner was committed as `ccb9c8d` before photo inference. The process
completed all 452 rows with exit 0 using MLX/MLX-Metal 0.32.0. There were no
photo retries, prompt revisions, vendor-code patches, selected subsets or
unfinished rows. The unchanged package/input hashes and all row identities
were checked again afterwards. An independent scikit-learn calculation agrees
with both raw and grouped accuracy and macro-F1 to within 1e-12.

| Population | DINO Control | Local Qwen | DINO Macro-F1 | Qwen Macro-F1 |
| --- | --- | --- | --- | --- |
| All 452 validation rows | 290 (64.16%) | 138 (30.53%) | 0.644547 | 0.311565 |
| 449 duplicate groups | 287 (63.92%) | 135 (30.07%) | 0.642974 | 0.308538 |

Qwen returned 361 valid genus/clear codes and 91 explicit refusals, with zero
malformed responses. Refusals remain in the denominator. Of the answered rows,
138/361 (38.23%) agree with source labels, so removing refusals would not rescue
the result. There are 17 paired gains and 169 regressions against the control.

| Genus | Rows | DINO Correct | Qwen Correct |
| --- | --- | --- | --- |
| Cirrus | 30 | 18 | 17 |
| Cirrocumulus | 46 | 29 | 20 |
| Cirrostratus | 48 | 33 | 2 |
| Altocumulus | 43 | 22 | 7 |
| Altostratus | 37 | 20 | 0 |
| Nimbostratus | 44 | 27 | 25 |
| Stratocumulus | 57 | 37 | 0 |
| Stratus | 35 | 17 | 2 |
| Cumulus | 36 | 27 | 14 |
| Cumulonimbus | 46 | 30 | 26 |
| Clear sky | 30 | 30 | 25 |

The loss occurs in both cloud sources: CCSN 87/288 versus 182/288 and IMGW
36/144 versus 88/144. The separate clear source is 15/20 versus 20/20. This is
source-label agreement, not independently certified meteorological accuracy.
All 11 classes remain in per-source macro-F1, even when absent from a source;
those per-source macro scores must not be interpreted as present-class averages.

Generation took 898.97 seconds in aggregate, median 2.054 seconds per image,
excluding image preparation and model loading. Peak MLX allocation was
3,715,235,264 bytes (about 3.46 GiB); process RSS counter was 692,731,904 bytes
and is not a total GPU-memory measure. These are host measurements, not phone
performance or battery tests. The 3.09 GB weights are not an app-size estimate.

**Reject this strategy for advancement.** It loses on both preregistered metrics
and every class. Do not calibrate it, open holdouts, search prompts on the same
evaluation, or replace the shipped classifier. A different model/runtime or
strategy needs its own justified, frozen protocol. Quantized-versus-original
parity remains unverified; the result does not prove that every VLM fails or
that all disagreement is a model error. It does disprove using this measured
local recipe as the promised accuracy improvement.

Aggregate report: `local-vlm-evaluation.json`, SHA256
`193cb2a88e3066099170cc27fc66669ad993505476ccd2ddb6007d54e528981a`.
Local raw receipts: `.local/v4/local-vlm-20260906/validation-results.json`, SHA256
`52db6d718905fcee1d1756da548f1eb0b1559d48391905e7867122065c85f5f4`.
Comparison key SHA256:
`a3f873684c1fdc41cb4bbf72d7e816b96649f21e275f96727b7c10fc5e9dc33f`.
All 246 ML tests passed before inference. No product source, Apple build,
photo transmission or expert outreach occurred. The overall goal remains active.
