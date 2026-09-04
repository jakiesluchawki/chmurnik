# CHMURNIK on-device recognizer

This directory contains the reproducible training, calibration, benchmarking,
and Core ML export pipeline for the iOS photo assistant.

## Data boundary

Training datasets are intentionally not committed.

- CCSN v2: https://doi.org/10.7910/DVN/CADDPD (CC0 1.0)
- Clear-sky supplement: https://huggingface.co/datasets/jcamier/cloud_sky_vis
  (MIT)
- V4 research adds the IMGW public 1,298-image sample, DOI
  https://doi.org/10.1002/qj.4865 (CC BY 4.0). Capture dates and duplicate groups
  stay within one role; a fresh confirmatory set remains separate from selection.

The application model predicts the ten WMO cloud genera plus `clear_sky`.
Contrails are used as outlier exposure rather than as an application label.

## Train

```sh
python train_ccsn.py \
  --data /path/to/CCSN_v2 \
  --clear /path/to/clear_sky_tensor.pt \
  --output /path/to/artifacts
```

## Export and verify

```sh
python export_coreml.py \
  --artifacts /path/to/artifacts \
  --output CloudGenusClassifier.mlpackage

python verify_coreml.py \
  --artifacts /path/to/artifacts \
  --model CloudGenusClassifier.mlpackage \
  --image ../../public/assets/clouds/cumulus.jpg
```

The model is a hypothesis generator. The iOS product aggregates scores into
families, keeps the three strongest genera visible, and uses a conservative
abstention threshold. Do not turn the first class into an authoritative label.

## Version 3 evaluation

Version 3 adds duplicate-safe splits, higher-resolution model candidates,
manual Commons curation, external benchmarks, and an ensemble evaluator. The
shipped ensemble combines the calibrated v2 MobileNetV3 Small output with a
320 px MobileNetV3 Large output. Model weights and the abstention policy are
selected on a holdout unseen by both component models.

```sh
python benchmark_ensemble.py \
  --base /path/to/v2/cloud-genus-net.pt \
  --candidate /path/to/v3/cloud-genus-net.pt \
  --data /path/to/CCSN_v2 \
  --clear /path/to/clear_sky_tensor.pt \
  --atlas ../../public/assets/clouds \
  --commons /path/to/commons/benchmark \
  --noisy-stress /path/to/ccaim \
  --output /path/to/ensemble-benchmark.json
```

Use `--horizontal-flip-tta` to evaluate averaged original and mirrored
inference. This is a benchmark switch, not a production default: the
2026-06-26 evaluation slightly improved the duplicate-safe common test but
regressed both the application atlas and independent Commons benchmark.

## Version 4 experiments

V4 is under evaluation, not yet shipped. The experiment contract and known data
limitations are in Lore task 0042. Keep private feedback out of training and Git.

```sh
python v4_data.py --data /path/to/CCSN_v2 \
  --clear /path/to/clear_sky_tensor.pt --atlas ../../public/assets/clouds \
  --stress /path/to/old-ccaim/images --output /path/to/frozen-data

python v4_baseline.py --manifest /path/to/frozen-data/manifest.json \
  --models ../../ios/App/App/Models --output /path/to/baseline.json \
  --native-executable /path/to/compiled-native-shipped-baseline

python train_v4.py --manifest /path/to/frozen-data/manifest.json \
  --output /path/to/experiment --batch-size 4 --accumulation-steps 4

# Add --resume with the same arguments to restore a completed epoch, including
# optimizer and random state. Partial writes never replace the last checkpoint.
python evaluate_v4.py --manifest /path/to/frozen-data/manifest.json \
  --checkpoint /path/to/experiment/cloud-genus-net.pt \
  --output /path/to/validation-report

# Only after selecting the candidate on validation:
python evaluate_v4.py --manifest /path/to/frozen-data/manifest.json \
  --checkpoint /path/to/experiment/cloud-genus-net.pt \
  --baseline /path/to/baseline.json --evaluate-holdouts \
  --output /path/to/calibrated-candidate

python -m unittest discover -s . -p test_v4.py
```

The native baseline executable is built from
`tests/native-shipped-baseline/main.swift` with the Mac Catalyst UIKit SDK.
It uses the shipped UIImage/UIGraphics/Vision path. Omitting it uses a PIL
approximation, which is not interchangeable with native baseline predictions.
Use `--reuse-parent` only with the exact, hash-checked parent report. A new
confirmatory set is explicitly unlocked with `--include-confirmatory` on the
baseline and `--evaluate-confirmatory` on the evaluator, after recording the
selected candidate hash. An already-opened test remains regression evidence.

V4 Core ML exports require the frozen data manifest so training-source licenses
cannot disappear from exported metadata. Normal exports also require a passing
paired evaluation bound to the exact calibrated-checkpoint hash. Incomplete or
failed candidates can be converted only with explicit `--research-only`; their
version and metadata mark them as unapproved research artifacts:

```sh
python export_coreml.py --artifacts /path/to/calibrated-candidate \
  --manifest /path/to/frozen-data/manifest.json \
  --output /path/to/new/CloudGenus.mlpackage --precision float32
python verify_v4_coreml.py --artifacts /path/to/calibrated-candidate \
  --manifest /path/to/frozen-data/manifest.json \
  --model /path/to/new/CloudGenus.mlpackage --output /path/to/parity.json
```

Exports never replace an existing package. DINO's fixed-size positional
encoding is precomputed with an eager-equivalence check before `torch.export`
conversion. Inference parity still has to pass on photographs, independently
of classification quality; a successful export does not approve the model.
See Apple's [PyTorch conversion workflow](https://apple.github.io/coremltools/docs-guides/source/convert-pytorch-workflow.html).

The default evaluator reads only validation. Holdout evaluation calibrates on
calibration only and reports paired, duplicate-group-aware comparisons. Atlas
and stress sources are not interchangeable; their scores must stay separate.
`train_v4.py` currently does not train on contrails or private feedback.
