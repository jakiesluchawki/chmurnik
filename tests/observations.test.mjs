import assert from "node:assert/strict";
import test from "node:test";
import {
  confirmedGenera,
  normalizeObservation,
  observationFromRecognition,
  parseObservationBackup,
  postcardCaption,
  serializeObservationBackup,
} from "../src/lib/observations.js";
import { serializeJournalBackup } from "../src/lib/journal.js";

const legacy = {
  id: "legacy-1",
  date: "2026-08-23",
  location: "Gdynia",
  cloud: "Cumulus",
  confidence: "wysoka",
  evidence: "Flat base",
  createdAt: 1782000000000,
  photo: "data:image/jpeg;base64,aGVsbG8=",
};

test("legacy backups migrate without treating a hypothesis as user confirmation", () => {
  const entries = parseObservationBackup(serializeJournalBackup([legacy]));
  assert.equal(entries[0].photo, legacy.photo);
  assert.equal(entries[0].cloud, "Cumulus");
  assert.equal(entries[0].confirmedCloudId, null);
  assert.deepEqual(confirmedGenera(entries), []);
});

test("recognition creates a savable observation without forcing a location or notes", () => {
  const entry = observationFromRecognition(
    {
      state: "uncertain",
      modelVersion: "3.0-ensemble",
      leadingFamily: { label: "Kłębiaste" },
      ranked: [
        { id: "cumulus", probability: 0.5 },
        { id: "clear_sky", probability: 0.3 },
      ],
    },
    new Date("2026-08-26T10:00:00Z"),
    "capture-1",
  );
  assert.equal(entry.location, "");
  assert.equal(entry.evidence, "");
  assert.equal(entry.hypothesis.modelVersion, "3.0-ensemble");
  assert.equal(entry.hypothesis.candidates.length, 1);
  assert.equal(entry.confirmedCloudId, null);
  assert.deepEqual(
    parseObservationBackup(serializeObservationBackup([entry])),
    [entry],
  );
});

test("collection completion requires an explicit cloud and deduplicates genera", () => {
  const first = normalizeObservation({
    ...legacy,
    confirmedCloudId: "cumulus",
  });
  assert.deepEqual(
    confirmedGenera([
      first,
      { ...first, id: "copy" },
      normalizeObservation(legacy),
    ]),
    ["cumulus"],
  );
  assert.throws(() =>
    normalizeObservation({ ...legacy, confirmedCloudId: "cloud" }),
  );
});

test("backup parsing validates both metadata and photos without allowing external URIs", () => {
  const entry = normalizeObservation(legacy);
  assert.throws(() =>
    serializeObservationBackup([{ ...entry, photo: "file:///etc/passwd" }]),
  );
  assert.throws(() =>
    parseObservationBackup(
      '{"kind":"chmurnik-observations","version":99,"entries":[]}',
    ),
  );
  assert.throws(
    () => parseObservationBackup(serializeObservationBackup([entry, entry])),
    /powtórzone/,
  );
  assert.throws(() =>
    normalizeObservation({
      ...entry,
      hypothesis: { candidates: [{ id: "cumulus", probability: 9 }] },
    }),
  );
});

test("postcards exclude personal notes, location and model metadata by default", () => {
  const entry = normalizeObservation({
    ...legacy,
    location: "Private coordinates",
    evidence: "Private note",
    confirmedCloudId: "cumulus",
  });
  const caption = postcardCaption(entry);
  assert.deepEqual(Object.keys(caption).sort(), ["date", "status", "title"]);
  assert.equal(caption.status, "Rozpoznanie autora obserwacji");
  assert.ok(!JSON.stringify(caption).includes("Private"));
});

test("clear-sky refusal never stores tiny cloud scores as proposed identifications", () => {
  const entry = observationFromRecognition({
    state: "clear",
    leadingFamily: { id: "clear", label: "Bezchmurne" },
    ranked: [
      { id: "clear_sky", probability: 0.98 },
      { id: "cumulus", probability: 0.01 },
    ],
  });
  assert.deepEqual(entry.hypothesis.candidates, []);
  assert.equal(entry.confirmedCloudId, null);
});
