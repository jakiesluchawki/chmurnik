# CHMURNIK on-device recognizer

This directory contains the reproducible training, calibration, benchmarking,
and Core ML export pipeline for the iOS photo assistant.

## Data boundary

Training datasets are intentionally not committed.

- CCSN v2: https://doi.org/10.7910/DVN/CADDPD (CC0 1.0)
- Clear-sky supplement: https://huggingface.co/datasets/jcamier/cloud_sky_vis
  (MIT)

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
