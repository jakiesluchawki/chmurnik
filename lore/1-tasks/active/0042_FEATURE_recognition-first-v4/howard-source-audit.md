# Howard-Cloud-X Source Audit

## Protocol Frozen Before Photo Inspection

The preceding goal turn verified the owner's current web deployment, including
the daily answer-concealment fix and offline atlas. That was progress. The
classifier reliability requirement remains open; this investigation addresses
the need for additional independently usable supervision after the fixed GCE
trial failed. The owner has deferred meteorologist involvement.

Source: https://www.kaggle.com/datasets/imbikramsaha/howard-cloudx/data
Public API identifies dataset 2371703, version 2, updated 2022-07-30, owned by
Bikram Saha. The card declares CC0 and ten cloud genera, but gives no capture
provenance, individual photo credits or annotation/adjudication procedure.
Treat that as a source declaration, not verified ownership or ground truth.

Inspect this version only, without predictions, training, label changes or
calibration/holdout model evaluation. Archive download budget: 350 MB;
expanded-member budget: 600 MB total, 12 MB per image, 10,000 entries and
30 million pixels per image. Reject unsafe paths, symlinks, encrypted members,
duplicate paths and unexpected executable content. Do not execute downloaded
code or extract arbitrary archive paths. Record archive and metadata hashes.

Count all source classes and splits. Compute raw and EXIF-normalized RGB SHA256
and the existing 256-bit dHash for each decodable photo. Compare with the frozen
4,358-row project manifest, including all split identities solely to detect
reuse, not to score any model. Distinguish exact matches from dHash <= 8 review
flags; a missing flag is not proof of capture independence. Check internal
pixel duplicates and cross-class/split conflicts. Preserve failed decodes in
the denominator instead of replacing them.

Visually inspect a deterministic, SHA-ordered six-photo sample per source
class and any exact cross-class conflicts. Source names remain source labels,
not expert-confirmed identifications. Do not turn visual impressions into new
training labels. Keep all downloaded images local and outside published assets.
Both training_approved and fresh_test_approved remain false until provenance,
reuse and annotation evidence warrant a separate admission decision.

Artifacts will be retained in `.local/v4/howard-source-20260906/`.

## Completed Audit And Decision

The pinned archive is 288,766,260 bytes and expands to 297,364,113 bytes,
matching the public metadata. All member paths, sizes and CRC reads passed
the bounded audit. No downloaded code was executed. The source typo
`Cirroculumulus` is retained rather than silently changing its metadata.

| Check | Result |
| --- | --- |
| Archive files | 1,421 |
| Source train / test | 1,171 / 250 |
| Single-frame photos decoded | 1,419 |
| Unique normalized pixel hashes | 1,291 |
| Exact duplicate pixel groups | 123 groups / 251 files |
| Groups with different singleton genus labels | 36 groups / 75 files |
| Groups crossing source train and test | 37 groups / 77 files |
| Source test photos also present in source train | 37 / 250 (14.8%) |
| Exact reuse against our frozen manifest | 1 photo |
| Additional perceptual-only reuse flags | 4 photos |

The two excluded inputs are MPO files containing three and two frames,
respectively, despite their JPEG extensions. They are unsupported by the
predeclared single-frame audit, not proven corrupt. They remain in the total
and were not replaced. All ten classes are represented; source counts remain
in the complete `howard-source-audit.json` receipt accompanying this note.

Visually inspected all 60 deterministically selected source examples and all
36 exact cross-label groups. Examples include one identical image labelled
Altocumulus and Nimbostratus (H0002/H1146), and another placed in Cumulus,
Nimbostratus, Stratocumulus and Stratus (H1071/H1143/H1235/H1323). This verifies
inconsistent singleton targets, not which alternative is correct. Coexisting
clouds would require explicit multi-label/region annotation, not inventing a
winner from model predictions. No new meteorological labels were assigned.

The inspected sample includes visible iStock watermarks (H0582, H1335), a
Depositphotos watermark (H0684), Science Photo Library (H0759), Cloud Stock
Photos (H0302) and an All Rights Reserved notice (H0300, H0119). These concrete
image-level provenance issues prevent treating the card's CC0 declaration as
sufficient admission evidence. Do not publish these photos or their contact
sheets in the atlas, social galleries or packages.

The exact reused file is the existing diagnostic atlas cirrus photograph.
The four other dHash flags are not promoted to exact-match claims. Conversely,
the low external-match count does not certify novelty: this bounded audit
does not rule out different crops, near-duplicate captures or unrecorded web
reuse. Its strong findings concern internal exact-pixel leakage and conflicting
targets, without needing model-based labels.

Reject Howard-Cloud-X v2 as an automatically admitted training extension and
as an independent accuracy benchmark. Removing only the 37 leaked test
images would not repair annotation or provenance problems. Keep the source
quarantined; both admission flags remain false. Do not start a training run
or tune to this source's test partition. A different source with traceable
photographs and annotation evidence is needed, not another classifier sweep
using this archive's folder names as trusted answers.

## Verification

Nine focused tests pass: archive path/type/count/byte boundaries, duplicate
paths, symlinks and encryption rejection, known RGB fingerprint replay,
unsupported image handling, original-versus-retained reference evidence,
the exact dHash boundary, cross-class/split conflicts and deterministic
sampling without replacing failures. All 276 ML/tooling tests pass, zero
skips; pre-existing coremltools dependency warnings remain.

The separate replay imports no audit helpers. It rehashes all source members
and all 4,358 retained reference files, independently rebuilds normalized RGB
hashes and NumPy-packed dHashes, checks 6,184,002 source/reference comparisons,
and reproduces every match, duplicate group and aggregate. It also identifies
the two unsupported MPO inputs and renders the complete conflict contact
sheets. This is independent technical verification, not expert cloud review.

- Archive SHA256: `5469d479d8fb1101101b0ac8eaac6394a478632547f7f9236785d38ba4fa7b65`
- Full audit SHA256: `e219b079743dbc2ad3b40b0cb1f71984fc04abb4269dcc15462f8991fab9e10b`
- Frozen manifest SHA256: `d5b0ca33e0867bbb0d0fd25dbd08fc20cfeea316a89299e53f63a6bee5d0ea1c`

Primary tool: `ml/cloud-recognition/audit_howard_source.py`; independent local
replay: `.local/v4/verify_howard_source.py`. Full inputs, fingerprint inventories,
selection, contact sheets and `independent-replay.json` remain in the artifact
directory. No production classifier, weights, web assets, Apple build or
submission, privacy setting, host permission or expert outreach changed.
The goal remains active; this source rejection is concrete progress but does
not satisfy the classifier reliability requirement.

## Separate FabraClouds Access Check

Also inspected the author's
[repository](https://github.com/marcosPlaza/Ground-based-Cloud-Classification-with-Deep-Learning)
and complete relevant pages of its 45-page master's thesis. PDF page 17
(printed page 11) describes 2,228 images photographed and labelled by
meteorologist Alfons Puertas. Page 31 (printed page 25) explicitly omits Cs
and Ns from the reported genus experiments because of insufficient examples.
Do not assume a complete ten-genus benchmark from the README alone.

The README's MIT notice covers Marcos Plaza's developed software/documentation;
it is not clear permission for Alfons Puertas's photograph collection. The
inspected repository inventory, PDF hyperlinks and open issue #1 provide no
full dataset download or photo-specific reuse terms. This source has better
stated annotation provenance, but it is not currently admitted or available
as a training extension. No author was contacted. The Macau paper lead could
not be read fully because its publisher returned HTTP 429; no access or
licensing conclusion is drawn from that failure.

The local `fabra-thesis.pdf` receipt has SHA256
`cb2da372f74ce77db6c3b6af6a6f596915e806996a5f24d68908a44b6b1f0433`.
Its relevant pages were rendered and visually inspected; no Fabra training
photo collection was downloaded. Public source:
https://github.com/marcosPlaza/Ground-based-Cloud-Classification-with-Deep-Learning/blob/main/Ground_based_Cloud_Classification_with_Deep_Learning_MasterThesisReport_MarcosPlazaGonzalez.pdf
