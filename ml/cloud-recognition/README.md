# CHMURNIK cloud recognition

This directory contains the reproducible training and Core ML export pipeline
for the on-device photo recognizer.

## Data

The pipeline uses the CC BY 4.0 dataset published with:

> Rosenberger, M., Dorninger, M., & Weissmann, M. (2025). Deriving WMO Cloud
> Classes From Ground-Based RGB Pictures With a Residual Neural Network
> Ensemble. Earth and Space Science, 12, e2024EA004112.

Dataset DOI: <https://doi.org/10.5281/zenodo.14185063>

The original 30 SYNOP classes are mapped to the ten WMO genera. Ambiguous
codes deliberately activate both compatible genera. Images remain outside the
repository under `.local/ml-data/`.

## Commands

```sh
.local/ml-venv/bin/python ml/cloud-recognition/train.py \
  --architecture mobilenet_v3_small --target-precision 0.85
.local/ml-venv/bin/python ml/cloud-recognition/export_coreml.py
.local/ml-venv/bin/python ml/cloud-recognition/verify_coreml.py
.local/ml-venv/bin/python ml/cloud-recognition/benchmark_ood.py
.local/ml-venv/bin/python ml/cloud-recognition/test_pipeline.py
```

The training script preserves the authors' train, validation, test, and
out-of-sample periods. The exported model is single-photo and multi-label: it
returns probabilities for ten genera plus clear sky. Product code must still
apply the saved calibration and abstention policy.

The production model uses a compact ImageNet-initialized MobileNet V3 Small.
The validation-derived abstention policy measures the margin between the first
and second hypothesis, rather than treating a sigmoid value as certainty. A
small, explicitly documented outlier-exposure set contains CHMURNIK's own
non-photographic artwork and licensed upper-atmosphere cloud photographs.

## Scope limits

The source observations label four simultaneous directions, while the iOS
feature accepts one photograph. Direction-level training is therefore weakly
supervised and cannot recover context outside the frame. The model is an
experimental hypothesis assistant, not a meteorological measurement or an
operational aviation product. Its most useful output is a ranked top three;
low-margin and out-of-scope inputs must remain abstentions.
