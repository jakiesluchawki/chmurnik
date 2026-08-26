import { Capacitor, registerPlugin } from "@capacitor/core";
import { loadJournalForMigration } from "./storage.js";
import {
  MAX_OBSERVATIONS,
  normalizeObservation,
  serializeObservationBackup,
} from "./observations.js";

const Vault = registerPlugin("ObservationVault");
const isIOS = () => Capacitor.getPlatform() === "ios";
let database;
let preparation;

function openDatabase() {
  if (database) return database;
  database = new Promise((resolve, reject) => {
    const request = indexedDB.open("chmurnik-observations", 1);
    let blocked = false;
    request.onupgradeneeded = () => {
      request.result.createObjectStore("entries", { keyPath: "id" });
      request.result.createObjectStore("photos");
      request.result.createObjectStore("meta");
    };
    request.onsuccess = () => {
      if (blocked) {
        request.result.close();
        return;
      }
      request.result.onversionchange = () => {
        request.result.close();
        database = null;
        preparation = null;
      };
      resolve(request.result);
    };
    request.onerror = () => {
      database = null;
      reject(request.error);
    };
    request.onblocked = () => {
      blocked = true;
      database = null;
      reject(new Error("Zamknij inne karty Chmurnika i spróbuj ponownie."));
    };
  });
  return database;
}

function requestValue(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function complete(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () =>
      reject(transaction.error || new Error("Zapis przerwany."));
  });
}

async function writeTransaction(stores, work) {
  const tx = (await openDatabase()).transaction(stores, "readwrite");
  const done = complete(tx);
  // A synchronous photo/quota failure must roll back metadata queued earlier.
  done.catch(() => {});
  try {
    await work(tx);
    await done;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      /* The transaction may already be aborted. */
    }
    await done.catch(() => {});
    throw error;
  }
}

function photoBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const bytes = Uint8Array.from(atob(base64), (character) =>
    character.charCodeAt(0),
  );
  return new Blob([bytes], { type: header.slice(5, header.indexOf(";")) });
}

async function webMerge(entries, migrated = false) {
  await writeTransaction(["entries", "photos", "meta"], async (tx) => {
    const store = tx.objectStore("entries");
    const known = new Set(await requestValue(store.getAllKeys()));
    for (const entry of entries) {
      if (known.has(entry.id)) continue;
      if (known.size >= MAX_OBSERVATIONS)
        throw new Error("Kolekcja może zawierać maksymalnie 500 obserwacji.");
      const { photo, ...metadata } = entry;
      store.put({ ...metadata, hasPhoto: Boolean(photo) });
      if (photo) tx.objectStore("photos").put(photoBlob(photo), entry.id);
      known.add(entry.id);
    }
    if (migrated) tx.objectStore("meta").put(true, "legacyMigrated");
  });
}

async function prepare() {
  if (!preparation) {
    preparation = (async () => {
      if (isIOS()) {
        const state = await Vault.list();
        if (!state.migrated)
          await Vault.merge({
            entries: JSON.stringify(
              loadJournalForMigration().map(normalizeObservation),
            ),
            migrate: true,
          });
      } else {
        const db = await openDatabase();
        const migrated = await requestValue(
          db.transaction("meta").objectStore("meta").get("legacyMigrated"),
        );
        if (!migrated)
          await webMerge(
            loadJournalForMigration().map(normalizeObservation),
            true,
          );
      }
      // The original localStorage journal remains intact as a recovery copy.
    })().catch((error) => {
      preparation = null;
      throw error;
    });
  }
  return preparation;
}

export async function listObservations() {
  await prepare();
  const entries = isIOS()
    ? (await Vault.list()).entries
    : await requestValue(
        (await openDatabase())
          .transaction("entries")
          .objectStore("entries")
          .getAll(),
      );
  return entries.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveObservation(entry, capturedPhoto = null) {
  await prepare();
  const photo =
    typeof entry.photo === "string" && entry.photo.startsWith("data:")
      ? entry.photo
      : !isIOS() && capturedPhoto?.base64
        ? `data:image/jpeg;base64,${capturedPhoto.base64}`
        : null;
  const normalized = normalizeObservation({ ...entry, photo });
  if (isIOS()) {
    await Vault.save({
      entry: JSON.stringify(normalized),
      photoPath: capturedPhoto?.uri || capturedPhoto?.path,
      photoBase64: capturedPhoto?.base64,
    });
  } else {
    await writeTransaction(["entries", "photos"], async (tx) => {
      const store = tx.objectStore("entries");
      const existing = await requestValue(store.get(normalized.id));
      const count = await requestValue(store.count());
      if (!existing && count >= MAX_OBSERVATIONS)
        throw new Error("Kolekcja może zawierać maksymalnie 500 obserwacji.");
      const { photo, ...metadata } = normalized;
      store.put({
        ...metadata,
        hasPhoto: Boolean(photo) || Boolean(existing?.hasPhoto),
      });
      if (photo) tx.objectStore("photos").put(photoBlob(photo), normalized.id);
    });
    navigator.storage?.persist?.().catch(() => {});
  }
}

export async function importObservations(entries) {
  await prepare();
  const normalized = entries.map(normalizeObservation);
  if (isIOS()) await Vault.merge({ entries: JSON.stringify(normalized) });
  else await webMerge(normalized);
}

export async function deleteObservation(id) {
  await prepare();
  if (isIOS()) return Vault.remove({ id });
  await writeTransaction(["entries", "photos"], (tx) => {
    tx.objectStore("entries").delete(id);
    tx.objectStore("photos").delete(id);
  });
}

export async function observationPhoto(entry) {
  if (!entry.hasPhoto) return null;
  if (isIOS())
    return { url: Capacitor.convertFileSrc(entry.photoURI), release() {} };
  const blob = await requestValue(
    (await openDatabase())
      .transaction("photos")
      .objectStore("photos")
      .get(entry.id),
  );
  if (!blob) throw new Error("Brakuje pliku zdjęcia.");
  const url = URL.createObjectURL(blob);
  return { url, release: () => URL.revokeObjectURL(url) };
}

function blobDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function exportObservations() {
  await prepare();
  if (isIOS()) return Vault.exportBackup();
  const entries = await listObservations();
  const parts = [];
  let batch = [];
  let size = 0;
  const db = await openDatabase();
  for (const entry of entries) {
    const blob = entry.hasPhoto
      ? await requestValue(
          db.transaction("photos").objectStore("photos").get(entry.id),
        )
      : null;
    if (entry.hasPhoto && !blob)
      throw new Error("Kopia niekompletna: brakuje zdjęcia.");
    const full = normalizeObservation({
      ...entry,
      photo: blob ? await blobDataUrl(blob) : null,
    });
    const bytes = JSON.stringify(full).length;
    if (size + bytes > 30_000_000 && batch.length) {
      parts.push(
        new Blob([serializeObservationBackup(batch)], {
          type: "application/json",
        }),
      );
      batch = [];
      size = 0;
    }
    batch.push(full);
    size += bytes;
  }
  if (batch.length)
    parts.push(
      new Blob([serializeObservationBackup(batch)], {
        type: "application/json",
      }),
    );
  return { parts };
}

export async function sharePostcard(dataUrl) {
  if (isIOS()) return Vault.shareCard({ dataUrl });
  const blob = photoBlob(dataUrl);
  const file = new File([blob], "chmurnik-obserwacja.jpg", {
    type: "image/jpeg",
  });
  if (navigator.canShare?.({ files: [file] }))
    return navigator.share({ files: [file], title: "Moje niebo · CHMURNIK" });
  downloadFile(blob, file.name);
}
