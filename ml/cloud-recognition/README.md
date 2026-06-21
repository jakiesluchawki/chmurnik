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
