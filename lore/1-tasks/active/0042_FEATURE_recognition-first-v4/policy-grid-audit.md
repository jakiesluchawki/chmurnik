# Confidence-Grid Audit

## Question Frozen Before The Audit

The failed trust-score probe does not justify changing its recipe. Inspection
of `train_ccsn.choose_policy` exposed a separate implementation limitation:
confidence is searched only on 71 points from 0.20 to 0.90, and margin on 71
points from 0 to 0.70. Such a grid can miss stricter acceptance thresholds or
boundaries between adjacent scores. Determine whether this explains the
current DINO candidate's failed calibration, rather than assuming another
representation or reliability model is needed.

Read only the existing calibration predictions from the retained evaluation
SHA256 `6b35a443820a9e7564c4400735f79879c07f3861b1f7f1e08e5369ee6ff49f91`.
Bind them to the same frozen V2 manifest and assembled classifier. Do not run
inference again or use test/diagnostic/confirmation labels to select thresholds.
Calibrated probabilities and temperature stay unchanged.

Compare the historical grid with an exhaustive search over every distinct
confidence and margin boundary on group-unique cloud calibration cases. Keep
confidence >=0.20, precision >=0.90, and at least
`max(25, round(0.08 * cloud_count))` accepted cases. Include complete score ties.
Choose maximum coverage, then precision, with deterministic threshold ties.
Also report the maximum supported precision when none reaches 0.90.

This is a diagnostic, not permission to lower the target, search on holdouts,
or change a release decision using reused evidence. Keep production code and
previous reports unchanged until this audit shows whether the grid matters.
If no supported threshold reaches the target, close this explanation and keep
the candidate rejected. If a threshold exists, the original held-out accuracy,
precision, count, coverage, native parity and product gates still apply.

## Completed Result

The audit used 260 unique cloud calibration photos, the unchanged calibrated
temperature 1.689385474860335 and unchanged class probabilities. All original
IDs, labels, sources, duplicate and capture groups match the frozen manifest.
The original grid's failed result reproduced exactly.

The exhaustive search considered 255 distinct confidence boundaries and 261
margin boundaries, with 54747 threshold pairs retaining at least 25 cases.
**None reaches 90%.** Maximum supported precision is **35/41 = 85.365854%**,
at confidence >=0.20 and margin >=0.8586264476180077 (15.769231% coverage).
The higher precision than the saved grid's best-failed row does not rescue the
candidate: the original grid ranked unsuccessful attempts by precision times
square-root coverage, not maximum precision.

The grid can miss valid policies on other inputs: a synthetic regression test
demonstrates 25 correct cases at confidence 0.98 mixed with 75 incorrect at
0.95, where the historical cap fails and the exhaustive search succeeds.
That implementation limitation **does not explain this candidate's failure**.
Leave historical calibration code and the rejection decision unchanged here;
future evaluation can use the tested exact enumerator without lowering the
precision, sample-size or held-out release requirements.

Four focused tests pass, covering the cap counterexample, complete score ties,
minimum counts, a separately implemented brute-force oracle, invalid
probabilities and rejection of non-calibration or clear-only inputs.
No new training/inference or test/confirmation scoring was performed.

Artifacts: `.local/v4/dinov2-policy-grid-audit-20260906/`; exact aggregate copy
is `policy-grid-evaluation.json` alongside this note. Recipe SHA256:
`3081f6faebba37a2861a8e0701b19edf6c98e4601758b2a7d1149de27f404a4f`.

This closes the threshold-grid explanation for the current candidate. It does
not establish a reliable replacement model. Further work needs new evidence
about representation or supervision rather than retrying these rejected
confidence mechanisms on the same photos. Expert review remains deferred by
the owner, not silently replaced with self-generated ground truth.

Final combined verification: all 257 ML/tooling tests pass (11 newly added).
Both tracked aggregate JSON files match their retained local output byte for
byte. This is research-tooling verification, not a new native release or model
acceptance. Existing coremltools dependency-version warnings remain; this work
does not perform or claim new production-model conversion.
