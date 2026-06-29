---
title: "Licensed data and local inference for photo recognition"
type: R
status: completed
created: "2026-06-21"
updated: "2026-06-21"
spawned_from: "Q-how-should-photo-recognition-work.md"
spawns: ["S-on-device-ranked-hypotheses.md"]
tags: ["dataset", "core-ml", "wmo", "privacy"]
---

# Licensed data and local inference for photo recognition

## Sources

- Rosenberger, Dorninger, and Weissmann, *Deriving WMO Cloud Classes From
  Ground-Based RGB Pictures With a Residual Neural Network Ensemble*:
  <https://doi.org/10.1029/2024EA004112>
- Published image and label dataset, CC BY 4.0:
  <https://doi.org/10.5281/zenodo.14185063>
- Published reference implementation, CC BY 4.0:
  <https://doi.org/10.5281/zenodo.14185529>
- Apple Core ML overview:
  <https://developer.apple.com/documentation/coreml>
- Apple Vision/Core ML request API:
  <https://developer.apple.com/documentation/vision/vncoremlrequest>

## Dataset boundary

The dataset contains 22,739 expert-labelled observations, each represented by
four simultaneous directional RGB pictures at 64 x 100 pixels and thirty WMO
SYNOP classes. Its preserved periods contain 13,912 training, 3,478 validation,
3,069 test, and 2,280 out-of-sample observations.

CHMURNIK maps the thirty SYNOP outputs to the ten WMO genera plus clear sky.
Combined codes remain multi-label; for example, an ambiguous As/Ns code
activates both Altostratus and Nimbostratus. The source labels describe the
four-view observation, while the product accepts one frame. Direction-level
training is therefore weakly supervised and cannot recover context outside the
photograph.

## Local versus hosted inference

| Property | On-device Core ML | Hosted inference |
| --- | --- | --- |
| Privacy | Photo remains on the iPhone | Photo must leave the device |
| Offline use | Yes | No |
| Latency and cost | Stable, no request cost | Network and service dependent |
| Model updates | Requires an app build | Can be changed centrally |
| Initial fit | Preferred | Rejected for version 1 |

The first production implementation uses Core ML locally. A hosted fallback
is not included because it weakens the product's privacy promise without
solving the dataset's single-frame ambiguity.

## Model comparison

The 44,907-parameter scratch baseline reached 69.7% top-one and 95.3% top-three
hit rate on the normal test period, but only 48.2% and 86.2% respectively on
the out-of-sample period.

A 1.53-million-parameter MobileNet V3 Small initialized from ImageNet reached
78.9% top-one and 97.2% top-three on the normal test period after a six-epoch
smoke run. Out-of-sample results improved to 55.5% top-one and 89.7% top-three.
The result supports a ranked-hypothesis assistant, not an automatic label.

## Out-of-scope behavior

The project includes a limited outlier-exposure and sanity set made from its
own non-photographic artwork plus licensed photographs of nacreous, polar
stratospheric, and noctilucent clouds. Those examples are deliberately outside
the ten tropospheric genera. This set is useful for regression checks but is
not a substitute for a broad, independently sourced out-of-domain benchmark.
