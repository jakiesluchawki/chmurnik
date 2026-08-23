import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeJournalEntries,
  normalizeJournalEntry,
  parseJournalBackup,
  serializeJournalBackup,
} from "../src/lib/journal.js";

const entry = {
  id: "observation-1",
  date: "2026-08-23",
  location: "Gdynia",
  cloud: "Cumulus",
  confidence: "średnia",
  evidence: "Clear detached clouds with flat bases.",
  photo: "data:image/jpeg;base64,aGVsbG8=",
  createdAt: 1_782_000_000_000,
};

test("journal backups round-trip local observations and local photos", () => {
  const contents = serializeJournalBackup([entry], new Date("2026-08-23T08:00:00Z"));
  const backup = JSON.parse(contents);

  assert.equal(backup.kind, "chmurnik-journal");
  assert.equal(backup.exportedAt, "2026-08-23T08:00:00.000Z");
  assert.deepEqual(parseJournalBackup(contents), [entry]);
});

test("journal imports deduplicate observations and preserve their chronology", () => {
  const newer = { ...entry, id: "observation-2", createdAt: entry.createdAt + 1000 };

  assert.deepEqual(mergeJournalEntries([entry], [entry, newer]), [newer, entry]);
});

test("journal imports reject external photo URLs and invalid calendar dates", () => {
  assert.throws(
    () => normalizeJournalEntry({ ...entry, photo: "https://example.com/photo.jpg" }),
    /invalid local photo/,
  );
  assert.throws(
    () => normalizeJournalEntry({ ...entry, date: "2026-02-31" }),
    /invalid calendar date/,
  );
  assert.throws(() => parseJournalBackup('{"entries": []}'), /unsupported format/);
});
