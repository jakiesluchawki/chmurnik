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
