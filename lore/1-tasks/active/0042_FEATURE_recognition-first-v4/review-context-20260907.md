# Reviewer Context Update, September 7

The owner authorized a portal update after expert feedback that missing ground
and horizon particularly limits cloud-level assessment.

## Implemented

- Optional level assessment independent of genus, with an explicit cannot-assess
  response and separate missing horizon, wider frame, detail, light and reference
  flags. No automatic genus-to-level inference.
- API validation, autosave/reload, coordinator display and JSON export.
- Existing answers and locked snapshots retain their original data; missing old
  fields do not become uncertainty votes. Old clients preserve new fields when
  they omit them, while explicit empty fields clear only the optional additions.
- Current R001-R033 images remain byte-identical. No paired wider images exist
  in this delivery. A future series needs genuine same-observation views, source
  provenance and new IDs; synthetic terrain is prohibited.
- Code-only update ZIP deliberately excludes the entire private directory,
  including accounts, materials and response storage. Health version is 2.
- Narrow-screen genus layout fixed after a 320px regression check.

## Evidence

48 API checks, complete browser workflow including all 33 protected images,
autosave/reload, isolation, report freeze and 320/390/768/1440px overflow checks.
Separate restarted-PHP test confirms a v1-shaped frozen record is unchanged
on session/export and still rejects edits. 288 application tests pass, Pages
build passes, and all nine lesson modules pass their existing contract.

The WASM PHP QA server snapshots mounted files: seed the legacy fixture while
it is stopped, then restart before checking. Port 8793 belongs to an unrelated
local bridge, so these tests now use 18973 without changing that bridge.

Production health was version 1 before delivery. No CyberFolks credentials were
available in the established manual-upload workflow. Publication of the update
ZIP is not installation on chmurnik.cloud. No model research or training resumed.
