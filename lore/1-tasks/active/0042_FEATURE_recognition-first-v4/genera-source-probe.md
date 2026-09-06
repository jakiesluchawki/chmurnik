# Genera Source and Numeric Probe

## Predeclared Boundary (2026-09-06)

Investigate a cloud-specialist checkpoint without training, label changes,
threshold search, Keras deserialization or execution of downloaded Python.
The pinned archive and public author definitions were inspected as data/text.
HF's suspicious PAIT-KERAS-301 finding remains unresolved: our bounded static
inspection is not a security certification. No production use is authorized.

Source: Mohammed Numan Mubarak,
[Genera](https://huggingface.co/mubaraknumann/genera-cloud-image-classification),
revision `fecb9e83c532a889648da31cd2b549f3de9428a3`.
The card declares MIT licensing for weights/code, but its tree has no separate
LICENSE or training-image manifest. Claimed UGCI evaluation cannot establish
CHMURNIK performance or absence of source-photo overlap. No author corpus has
been acquired. The published label mapping has 12 outputs, including contrail;
it must not be misrepresented as twelve WMO genera or silently reduced to eleven.

## Fixed Diagnostic Protocol

- Reimplement only the inspected numerical graph with local PyTorch operators.
  Attribute the source equations; do not import its custom classes or Streamlit.
  Verify SAME padding at odd/even sizes, BN epsilon .001 and channel attention
  against independent small NumPy calculations before real photographs.
- Fixed archive SHA256
  `d7f57ea9ac891d36648f6d690e2d207452de934c8a44f8d8e677cf7d4eba9c0e`,
  88,386,880 bytes. Enforce exact ZIP member set, bounded members and checksum;
  refuse HDF5 links, repeated objects, virtual/external datasets, filters,
  non-numeric/non-finite values and excessive payloads. Disable plugin lookup.
- Use only the existing 452 validation rows of frozen manifest
  `d5b0ca33e0867bbb0d0fd25dbd08fc20cfeea316a89299e53f63a6bee5d0ea1c`.
  Verify each source file/pixel receipt before inference. This is reused
  development data, not fresh expert assessment. Do not open calibration,
  held-out image splits, or the owner-deferred meteorologist package.
- Use author's single full-image RGB resize to 299x299, Pillow default RGB
  bicubic made explicit, then /255. No crops, flips, ensembles or alternative
  input recipes. Record all 12 probabilities and actual input tensor hashes.
- Map the twelve top-1 outputs to the existing eleven labels, with contrail
  remaining an unsupported output counted as incorrect, not renormalized away.
  Report complete source/class confusion and top-score diagnostics; no claim
  that uncalibrated softmax is probability of correctness.
- Recompute control from the fixed original-input DINO head receipts. Further
  technical investigation requires strictly better validation accuracy and
  macro-F1 than that control, with no tuning after this observation. Regardless
  of this development result, unknown training overlap, independent graph
  parity, calibration, native input parity and release gates remain open.
- Preserve failures and code/input identities. No model replacement, deployment,
  model-generated labels or outreach follows automatically.

## Static Evidence

The archive contains metadata.json (63 bytes), config.json (17,371 bytes) and
model.weights.h5 (88,369,116 bytes). No serialized Lambda/function marker was
found in JSON. Eight RepVGG blocks have deploy=False, each followed by NECA
and ReLU, then global pooling and a twelve-output softmax. Run the stored
multi-branch graph, not the dormant reparameterized convolution. In particular,
TensorFlow SAME padding at even sizes is asymmetric; naive branch fusion would
change sampling alignment and is not used.

288 finite numeric datasets account for 88,073,340 bytes, including 166 optimizer
datasets (58,690,988 bytes). Optimizer and dormant weights are not used for
inference. This is archive size, not an application installation estimate.

The initial static helper stopped before opening weights because the installed
h5py does not expose H5PLset_loading_state. Corrected to the documented
HDF5_PLUGIN_PRELOAD=:: plus empty search paths and explicit filter rejection.
Four focused archive tests then passed, including malformed/link/filter cases.
No Keras/TensorFlow package was installed or imported.

## Completed Diagnostic

The first diagnostic stopped before inference because my guard spelled the
source label ClearSky instead of the actual "Clear Sky". Corrected the literal,
retaining the pinned bidirectional JSON check; added tests for both this typo
and reversed mappings. No inference output or protocol changed during this fix.

All 452 source receipts and numeric outputs pass an independent Node check:
photo bytes, row order, labels, complete softmax, matrix totals and macro-F1.
The fixed control head remains the research DINO candidate, not the shipped
native baseline. No private owner photograph was uploaded to any service.

| Source | Photos | DINO control correct | Genera numeric correct |
|---|---:|---:|---:|
| CCSN | 288 | 182 | 223 |
| Clear source | 20 | 20 | 1 |
| IMGW 2024 samples | 144 | 88 | 43 |
| All | 452 | 290 | 267 |

Overall accuracy falls .641593 -> .590708; macro-F1 falls .644547 -> .572943.
All 26 contrail top-1 outputs remain unsupported/misses in this eleven-label
comparison. Across sources, clear-sky label agreement is only 1/30. Of the 273
outputs with top softmax >= .9, only 197 agree with source labels (72.16%).
This is a development diagnostic, not a tuned acceptance rule or calibrated
precision estimate. Warm CPU forward median is .100978 seconds, not a native
application latency measurement. No fitting, cropping sweep or recalibration.

The stored Keras layer-name attributes independently match the eight block and
attention ordinal weight paths. The custom PyTorch graph passed separate
float64 NHWC NumPy replays on constant RGB, an asymmetric grid and seeded RGB.
Maximum logit error is .0000093905 and probability error .0000002494; all top-1
outputs agree. This checks the independently implemented published equations,
not execution parity against the author's Keras environment or all possible
inputs. No downloaded classes, serialized functions, optimizer or dormant
reparameterized branch was executed.

Ten focused tests and the full 235-test ML/tooling suite pass, zero skips.
The static reader and both graph implementations are isolated research files;
there are no production-source, app-weight, web, signing or submission changes.

**Decision:** reject this fixed direct-replacement candidate. It fails the
predeclared development bar and does not resolve reliable-answer coverage.
The source-specific result is a warning against treating a model-card score as
transferable quality. Unknown training overlap prevents an independent accuracy
claim even on the better-performing source. Do not silently select only that
source, remove contrails, tune on these observations or announce an upgrade.
Meteorologist involvement remains explicitly deferred by the owner.

## Reproduction and Receipts

Use the existing ML environment and optional `requirements-genera-audit.txt`;
set `HDF5_PLUGIN_PRELOAD=::`. Commands are read/local-output only:

```sh
python -B ml/cloud-recognition/audit_genera_archive.py --archive ARCHIVE --report NEW_AUDIT_JSON
python -B ml/cloud-recognition/probe_genera_validation.py --archive ARCHIVE --labels LABEL_JSON --manifest FROZEN_MANIFEST --control FROZEN_HEAD --output NEW_OUTPUT_DIRECTORY --device cpu
python -B ml/cloud-recognition/verify_genera_numeric.py --archive ARCHIVE --report NEW_PARITY_JSON
```

Local ignored artifacts remain in `.local/v4/genera-audit-20260906/`; all numeric
observations and input hashes are retained there. Nothing from the model archive
or evaluation photos is added to Git or published on the website.

| Artifact | SHA256 |
|---|---|
| `revision.json` | `912dff5a40e49a81742dd487f40a3ec45d836967dfb301eb6bc5dda4b665002b` |
| `tree.json` | `d09ace3192286258daece3ab3b8ad66675b46392bde8b5de45058049b2e64f56` |
| `test_model_streamlit.py` (read, not executed) | `4d6c21084692fcbba51b02924abfb10784cc6d25033602d0de09631d6349b2f6` |
| `label_mapping.json` | `efeb29f2fe8f75d13d88928a56693d842767a54e64762bcf02c6c2fa648759dc` |
| `static-audit.json` | `308d08de95c16a73f8ae9ac6b0b838907eb53b0f67f837f9ee72939c47882c62` |
| `numpy-parity.json` | `121dfa25888b3d40bbfaed440f0c158c26f1c2ad9ffacd39d50419c3a80ba2b8` |
| `validation-cpu/recipe.json` | `101ff4c3fc3cbfc33713438e3c6bcf212959c9785ddaa1557aa8b7e60d8d97bd` |
| `validation-cpu/evaluation.json` | `d2d780a91b14f27131f03ed926f93d51982175fdbb3746ba85a12ce1512d7f51` |

Additional primary references:
[Keras BN inference/epsilon](https://keras.io/api/layers/normalization_layers/batch_normalization/),
[Pillow resize](https://pillow.readthedocs.io/en/stable/reference/Image.html#PIL.Image.Image.resize),
[HDF5 plugin controls](https://hdfgroup.github.io/hdf5/develop/_h5public_8h.html).
The scanner status is preserved in the pinned tree API receipt; none of these
checks asserts that the remote repository's warning is cleared.
