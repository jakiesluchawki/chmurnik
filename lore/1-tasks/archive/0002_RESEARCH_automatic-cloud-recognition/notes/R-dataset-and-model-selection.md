# Dataset and model selection

## Decision

Use CCSN v2 as the principal training source and supplement it with clear-sky
examples. Export a compact MobileNetV3 Small model to Core ML and present
family-level aggregation plus genus hypotheses.

## Evidence

- CCSN v2: 2,543 labelled 400 x 400 photographs, ten cloud genera plus
  contrails, CC0 1.0, DOI `10.7910/DVN/CADDPD`.
- Clear supplement: 227 clear-sky examples from the MIT-licensed
  `jcamier/cloud_sky_vis` dataset.
- Independent application atlas: 30 licensed Wikimedia photographs, three per
  WMO genus, not used for training.
- Rejected alternative: Rosenberger et al. 2024 multi-direction observations.
  Its capture domain did not transfer to ordinary single photographs.

## Product consequence

The model is useful for narrowing the search and teaching observable evidence.
It is not accurate enough to replace a human field observation or to present a
single genus as fact.
