---
id: "0035"
title: "Accept and distribute the iPad and Mac builds"
type: RELEASE
status: backlog
related_adr: ["0001", "0002"]
related_tasks: ["0032", "0033", "0034"]
tags: ["ipad", "macos", "release"]
links: []
history:
  - date: "2026-09-03"
    status: backlog
    who: codex
    note: "Spawned from 0034. Local implementation is separate from physical-device acceptance and Apple distribution."
---

# Apple Platform Acceptance

Accept the universal iPhone/iPad target and Mac Catalyst app on physical
devices, then prepare an explicitly authorized Apple distribution.

## Acceptance Criteria

- [ ] Physical iPad camera grant/denial, limited Photos, orientation, resizable
  windows, hardware keyboard and sharing accepted.
- [ ] Mac installation/upgrade, sandbox persistence, low disk and multi-part
  backup recovery accepted. Intel runtime tested on Intel hardware.
- [ ] Platform icons, application menu name, supported OS versions, privacy
  metadata, version/build number and current Apple requirements reviewed.
- [ ] Signed archives, screenshots and distribution route confirmed.
- [ ] Explicitly authorized TestFlight/App Store upload or direct-download
  notarization completed and verified. Local builds are not publication.

Keep the pinned official Capacitor source build until a reviewed binary
package includes Catalyst. Do not patch installed npm packages or replace
the iPhone dependency graph with the generated local Mac project.
