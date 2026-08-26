---
id: "0001"
title: "Store private observations outside localStorage"
status: accepted
date: "2026-08-26"
related_tasks: ["0032"]
---

# Private Observation Storage

## Context

The iOS-first collection connects camera evidence, model hypotheses and user
notes. The legacy Base64 localStorage journal cannot safely grow into a photo
collection. The product supports iOS 15 and a static website without a server.

## Decision

Use native Application Support photo files and a bounded, atomic JSON index
on iOS, accessed only on the plugin's serial queue. Commit new photographs
before replacing the index; roll back new files when the index commit fails.
Keep the prior index and unmodified legacy journal as recovery copies. Never
silently reset corrupt data. Store model hypotheses separately from explicit
user confirmation. The maximum remains 500 entries.

On web use IndexedDB with metadata, Blob photographs and a migration marker
in one transaction. Failed imports and quota errors abort the whole write.
Request persistence only after a successful explicit save.

Normalize incoming images, preserve their entire frame, and remove source
EXIF/GPS. Shared postcards omit user-entered location and notes. A consciously
exported full backup retains those fields and uses portable version-2 JSON,
split below the 50 MB importer limit. Version-1 journal backups remain readable.

## Consequences

No cloud account, new database dependency, microphone, location permission,
or minimum-iOS increase. The native index is small and auditable; real store
tests inject photo/index failures and verify atomic behavior. Browser tests
exercise actual transaction semantics with `fake-indexeddb`.

The app is local-first, not a promise against OS backup or deliberate export.
Recovery copies can retain earlier metadata. Replaced photos are retained
for recovery; original camera/gallery files are not deleted. The explicit
delete removes the active observation and its current stored photograph.
Users should export before migration; uninstalling the app may remove its
local collection. Physical interruption and low-storage acceptance remains
an open release gate in task 0032.
