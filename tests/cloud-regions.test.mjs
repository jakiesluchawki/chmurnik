import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { buildCloudRecognizerInput, normalizeCloudRegions } from "../src/lib/native-cloud-recognizer.js";

const region = (id) => ({ id, bounds: { x: .1, y: .2, width: .3, height: .4 } });

test("proposal bridge preserves order, omits unknown metadata and never trusts class labels", () => {
  const value = { ...region("cloud-1"), genus: "cumulus", confidence: .99 };
  assert.deepEqual(normalizeCloudRegions({ regions: [value, region("cloud-2")] }), [region("cloud-1"), region("cloud-2")]);
  assert.equal(normalizeCloudRegions({ regions: Array.from({ length: 20 }, (_, i) => region(`cloud-${i}`)) }).length, 5);
});

test("proposal bridge rejects malformed lists and skips invalid or duplicate regions", () => {
  for (const native of [null, {}, { regions: "bad" }]) assert.throws(() => normalizeCloudRegions(native));
  assert.deepEqual(normalizeCloudRegions({ regions: [null, { ...region("bad"), bounds: { x: 0, y: 0, width: NaN, height: 1 } },
    region("valid"), region("valid"), region("<script>")] }), [region("valid")]);
  assert.deepEqual(normalizeCloudRegions({ regions: [] }), []);
});

test("selected crop mode is explicit and is not enabled by truthy strings", () => {
  assert.deepEqual(buildCloudRecognizerInput({ base64: "jpeg", selectedRegion: true }), { base64: "jpeg", selectedRegion: true });
  assert.deepEqual(buildCloudRecognizerInput({ uri: "file:///photo.jpg", selectedRegion: true }), { path: "file:///photo.jpg", selectedRegion: true });
  assert.deepEqual(buildCloudRecognizerInput({ base64: "jpeg", selectedRegion: "true" }), { base64: "jpeg" });
  assert.deepEqual(buildCloudRecognizerInput("jpeg"), { base64: "jpeg" });
});

test("bridge retains cloud-mask anchors only when they lie inside the proposed region", () => {
  const value = { ...region("cloud-1"), anchor: { x: .15, y: .3, score: 1 } };
  assert.deepEqual(normalizeCloudRegions({ regions: [value] }), [{ ...region("cloud-1"), anchor: { x: .15, y: .3 } }]);
  for (const anchor of [{ x: NaN, y: .3 }, { x: .9, y: .3 }, { x: .1, y: -1 }]) {
    assert.deepEqual(normalizeCloudRegions({ regions: [{ ...value, anchor }] }), []);
  }
});

test("bundled mask weights match the exports used in the native parity probe", async () => {
  for (const [name, weights, graph] of [
    ["SkySegmentation", "5bc77c9c949483c2aac57523cc03504f0ce8cbb24371abe4520b193bf0eaef6f", "0cd171c8aa83e89da12cf80a094cf05107ea4a6a8b9f35ee73173f6857737f6c"],
    ["CloudMaskV4Research", "0b353f141a8ee9f3ee5a1789f4e89be4f6cab26d0f8f69495aaca985052bd2b9", "477e34e15e8c2b5da857c8c14b84a83b9816a2a6b41a6c93b721b11ee0dc0545"],
  ]) {
    for (const [file, expected] of [["weights/weight.bin", weights], ["model.mlmodel", graph]]) {
      const bytes = await readFile(new URL(`../ios/App/App/Models/${name}.mlpackage/Data/com.apple.CoreML/${file}`, import.meta.url));
      assert.equal(createHash("sha256").update(bytes).digest("hex"), expected);
    }
  }
});
