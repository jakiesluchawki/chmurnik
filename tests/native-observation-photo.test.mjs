import assert from "node:assert/strict";
import test from "node:test";
import { nativeObservationPhoto } from "../src/lib/observation-store.js";

const galleryPhoto = {
  source: "photos",
  uri: "file:///var/mobile/Media/DCIM/100APPLE/IMG_0001.JPG",
  previewUrl: "capacitor://localhost/_capacitor_file_/var/mobile/Media/DCIM/100APPLE/IMG_0001.JPG",
};

test("camera files and metadata-only edits retain the native vault path contract", async () => {
  assert.deepEqual(await nativeObservationPhoto({ source: "camera", uri: "file:///app/tmp/photo.jpg" }), {
    photoPath: "file:///app/tmp/photo.jpg", photoBase64: undefined,
  });
  assert.deepEqual(await nativeObservationPhoto(null), { photoPath: undefined, photoBase64: undefined });
});

test("gallery originals are copied to bounded JPEG pixels instead of sending an outside-container path", async (t) => {
  const oldImage = globalThis.Image;
  const oldDocument = globalThis.document;
  t.after(() => {
    if (oldImage === undefined) delete globalThis.Image; else globalThis.Image = oldImage;
    if (oldDocument === undefined) delete globalThis.document; else globalThis.document = oldDocument;
  });
  let released = false;
  let draws = 0;
  const canvas = {
    getContext: () => ({ drawImage: () => { draws += 1; } }),
    toDataURL: (type, quality) => {
      assert.equal(type, "image/jpeg");
      assert.equal(quality, 0.76);
      return "data:image/jpeg;base64,cGl4ZWxz";
    },
  };
  globalThis.Image = class {
    naturalWidth = 2400;
    naturalHeight = 1600;
    set src(value) { assert.equal(value, "blob:local-photo"); queueMicrotask(() => this.onload()); }
  };
  globalThis.document = { createElement: (tag) => { assert.equal(tag, "canvas"); return canvas; } };
  t.mock.method(URL, "createObjectURL", () => "blob:local-photo");
  t.mock.method(URL, "revokeObjectURL", () => { released = true; });
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(url, galleryPhoto.previewUrl);
    return new Response(new Blob(["selected pixels"], { type: "image/jpeg" }));
  });
  assert.deepEqual(await nativeObservationPhoto(galleryPhoto), { photoBase64: "cGl4ZWxz" });
  assert.deepEqual([canvas.width, canvas.height], [1080, 720]);
  assert.equal(draws, 1);
  assert.equal(released, true);
  assert.equal(galleryPhoto.uri, "file:///var/mobile/Media/DCIM/100APPLE/IMG_0001.JPG");
});

test("gallery import cannot fetch a remote host or an arbitrary app URL", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", () => assert.fail("Unexpected network request"));
  for (const previewUrl of ["https://example.com/photo.jpg", "capacitor://other/_capacitor_file_/photo.jpg", "capacitor://localhost/index.html"]) {
    await assert.rejects(nativeObservationPhoto({ ...galleryPhoto, previewUrl }), /lokalnej biblioteki/);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("an unreadable or oversized gallery photo fails before touching stored observations", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 404 }));
  await assert.rejects(nativeObservationPhoto(galleryPhoto), /odczytać/);
  fetch.mock.mockImplementation(async () => ({ ok: true, blob: async () => ({ type: "image/jpeg", size: 30_000_001 }) }));
  await assert.rejects(nativeObservationPhoto(galleryPhoto), /too large/);
});
