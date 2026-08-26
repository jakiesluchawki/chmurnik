import assert from "node:assert/strict";
import test from "node:test";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { parseObservationBackup } from "../src/lib/observations.js";

const photo = "data:image/jpeg;base64,aGVsbG8=";
const entry = {
  id: "one",
  date: "2026-08-26",
  createdAt: 1787742000000,
  location: "Gdynia",
  cloud: "Cumulus",
  evidence: "Płaska podstawa",
  confidence: "niska",
  photo,
};
let instance = 0;

async function fixture(legacy = null) {
  const values = new Map(
    legacy == null ? [] : [["cloud-recognition:journal", legacy]],
  );
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  };
  globalThis.indexedDB = new IDBFactory();
  const store = await import(
    `../src/lib/observation-store.js?instance=${++instance}`
  );
  return { store, values };
}

async function databaseValue(storeName, key) {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open("chmurnik-observations", 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(storeName).objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

test("browser migration keeps its recovery copy and separates photo blobs from metadata", async () => {
  const legacy = JSON.stringify([entry]);
  const { store, values } = await fixture(legacy);
  const [saved] = await store.listObservations();
  assert.equal(saved.id, "one");
  assert.equal(saved.hasPhoto, true);
  assert.equal(saved.photo, undefined);
  assert.equal(saved.confirmedCloudId, null);
  assert.equal(values.get("cloud-recognition:journal"), legacy);
  const blob = await databaseValue("photos", "one");
  assert.ok(blob instanceof Blob);
  assert.equal(await blob.text(), "hello");
  assert.equal(await databaseValue("meta", "legacyMigrated"), true);
});

test("corrupt legacy data is not silently marked migrated and can be retried", async () => {
  const { store, values } = await fixture("{not-json");
  await assert.rejects(store.listObservations());
  assert.equal(await databaseValue("meta", "legacyMigrated"), undefined);
  assert.equal(values.get("cloud-recognition:journal"), "{not-json");
  values.set("cloud-recognition:journal", JSON.stringify([entry]));
  assert.equal((await store.listObservations()).length, 1);
});

test("a photo write failure rolls back the complete migration, then retry succeeds", async () => {
  const legacy = JSON.stringify([entry, { ...entry, id: "two" }]);
  const { store, values } = await fixture(legacy);
  const original = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (value, key) {
    if (this.name === "photos" && key === "two")
      throw new DOMException("Storage is full", "QuotaExceededError");
    return original.call(this, value, key);
  };
  try {
    await assert.rejects(store.listObservations(), {
      name: "QuotaExceededError",
    });
  } finally {
    IDBObjectStore.prototype.put = original;
  }
  assert.equal(await databaseValue("entries", "one"), undefined);
  assert.equal(await databaseValue("photos", "one"), undefined);
  assert.equal(await databaseValue("meta", "legacyMigrated"), undefined);
  assert.equal(values.get("cloud-recognition:journal"), legacy);
  assert.equal((await store.listObservations()).length, 2);
});

test("capture retries upsert one entry and metadata edits preserve its photograph", async () => {
  const { store } = await fixture();
  await store.saveObservation(
    { ...entry, photo: null },
    { base64: "aGVsbG8=" },
  );
  await store.saveObservation(
    { ...entry, photo: null },
    { base64: "aGVsbG8=" },
  );
  await store.saveObservation({
    ...entry,
    photo: null,
    evidence: "Moja poprawka",
    favorite: true,
    confirmedCloudId: "cumulus",
  });
  const entries = await store.listObservations();
  assert.equal(entries.length, 1);
  assert.equal(entries[0].hasPhoto, true);
  assert.equal(entries[0].favorite, true);
  assert.equal(entries[0].evidence, "Moja poprawka");
  const image = await store.observationPhoto(entries[0]);
  assert.equal(await (await fetch(image.url)).text(), "hello");
  image.release();
});

test("failed photo replacement keeps both the old photograph and old metadata", async () => {
  const { store } = await fixture();
  await store.saveObservation(entry);
  const original = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (value, key) {
    if (this.name === "photos")
      throw new DOMException("Storage is full", "QuotaExceededError");
    return original.call(this, value, key);
  };
  try {
    await assert.rejects(
      store.saveObservation({
        ...entry,
        favorite: true,
        photo: "data:image/jpeg;base64,bmV3",
      }),
      { name: "QuotaExceededError" },
    );
  } finally {
    IDBObjectStore.prototype.put = original;
  }
  assert.equal((await store.listObservations())[0].favorite, false);
  assert.equal(await (await databaseValue("photos", "one")).text(), "hello");
});

test("imports never overwrite existing observations and deduplicate their own entries", async () => {
  const { store } = await fixture();
  await store.saveObservation(entry);
  await store.importObservations([
    { ...entry, favorite: true },
    { ...entry, id: "two" },
    { ...entry, id: "two", favorite: true },
  ]);
  const entries = await store.listObservations();
  assert.equal(entries.length, 2);
  assert.ok(entries.every((item) => item.favorite === false));
  await assert.rejects(
    store.importObservations([
      { ...entry, id: "three", photo: "data:image/jpeg;base64,a===" },
    ]),
  );
  assert.equal((await store.listObservations()).length, 2);
});

test("collection limits abort the entire batch and concurrent saves cannot exceed them", async () => {
  const { store } = await fixture();
  await store.importObservations(
    Array.from({ length: 499 }, (_, index) => ({
      ...entry,
      id: `entry-${index}`,
      photo: null,
    })),
  );
  await assert.rejects(
    store.importObservations([
      { ...entry, id: "extra-a" },
      { ...entry, id: "extra-b" },
    ]),
    /500/,
  );
  assert.equal((await store.listObservations()).length, 499);
  assert.equal(await databaseValue("photos", "extra-a"), undefined);
  const results = await Promise.allSettled([
    store.saveObservation({ ...entry, id: "extra-a" }),
    store.saveObservation({ ...entry, id: "extra-b" }),
  ]);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
  assert.equal((await store.listObservations()).length, 500);
});

test("browser backup rehydrates photographs and deleting an observation removes both stores", async () => {
  const { store } = await fixture();
  globalThis.FileReader = class {
    readAsDataURL(blob) {
      blob
        .arrayBuffer()
        .then((bytes) => {
          this.result = `data:${blob.type};base64,${Buffer.from(bytes).toString("base64")}`;
          this.onload();
        })
        .catch((error) => this.onerror(error));
    }
  };
  await store.saveObservation(entry);
  const exported = await store.exportObservations();
  const restored = parseObservationBackup(await exported.parts[0].text());
  assert.equal(restored[0].photo, photo);
  assert.equal(restored[0].location, entry.location);
  assert.equal(restored[0].photoURI, undefined);
  await store.deleteObservation(entry.id);
  assert.deepEqual(await store.listObservations(), []);
  assert.equal(await databaseValue("photos", "one"), undefined);
});
