import assert from "node:assert/strict";
import test from "node:test";
import { isNearBlackCrop, movePhotoRegion, resizePhotoCorner, photoFrame, squarePhotoRegion, squareRegionForProposal, prepareRecognitionRegion, validatePhotoRegion } from "../src/lib/photo-frame.js";

test("unzoomed framing preserves all original evidence", () => {
  assert.deepEqual(photoFrame(4032, 3024), {
    x: 0,
    y: 0,
    width: 4032,
    height: 3024,
  });
  assert.deepEqual(photoFrame(3024, 4032, 1, 0, 100), {
    x: 0,
    y: 0,
    width: 3024,
    height: 4032,
  });
});

test("framing keeps original aspect ratio and never samples outside the photo", () => {
  for (const zoom of [1, 1.5, 2, 3]) {
    for (const x of [0, 50, 100]) {
      for (const y of [0, 50, 100]) {
        const frame = photoFrame(1200, 1600, zoom, x, y);
        assert.equal(frame.width / frame.height, 1200 / 1600);
        assert.ok(frame.x >= 0 && frame.y >= 0);
        assert.ok(
          frame.x + frame.width <= 1200 && frame.y + frame.height <= 1600,
        );
      }
    }
  }
  assert.deepEqual(photoFrame(1200, 1600, 2, 100, 0), {
    x: 600,
    y: 0,
    width: 600,
    height: 800,
  });
});

test("invalid dimensions and frame coordinates are rejected before canvas processing", () => {
  for (const args of [
    [0, 100],
    [NaN, 100],
    [100, Infinity],
    [100, 100, 0],
    [100, 100, 4],
    [100, 100, 2, -1],
    [100, 100, 2, 50, 101],
  ]) {
    assert.throws(() => photoFrame(...args), RangeError);
  }
});

test("tap regions are square in image pixels and fit at all four edges", () => {
  for (const [width, height] of [[1200, 1600], [1600, 1200]]) {
    for (const x of [0, .5, 1]) for (const y of [0, .5, 1]) {
      const bounds = squarePhotoRegion(width, height, { x, y });
      assert.equal(validatePhotoRegion(bounds), bounds);
      assert.ok(Math.abs(bounds.width * width - bounds.height * height) < 1e-9);
    }
  }
});

test("invalid taps and native proposal rectangles are rejected", () => {
  assert.throws(() => squarePhotoRegion(1200, 1600, { x: NaN, y: 0 }));
  assert.throws(() => squarePhotoRegion(0, 1600, { x: .5, y: .5 }));
  assert.throws(() => validatePhotoRegion({ x: .9, y: 0, width: .2, height: .3 }));
  assert.throws(() => validatePhotoRegion({ x: 0, y: 0, width: -1, height: .3 }));
});

test("native proposals become visible square inputs within the original photo", () => {
  for (const [width, height] of [[1200, 1600], [1600, 1200], [1600, 1600]]) {
    for (const bounds of [{ x: .1, y: .15, width: .1, height: .2 },
      { x: 0, y: 0, width: 1, height: 1 }, { x: .7, y: .8, width: .3, height: .2 }]) {
      const frame = squareRegionForProposal(width, height, bounds);
      validatePhotoRegion(frame);
      assert.ok(Math.abs(width * frame.width - height * frame.height) < 1e-9);
      assert.ok(frame.x + frame.width <= 1 && frame.y + frame.height <= 1);
    }
  }
  const original = { x: .2, y: .2, width: .2, height: .1 };
  const frame = squareRegionForProposal(1600, 1200, original);
  assert.ok(frame.x <= original.x + 1e-9 && frame.y <= original.y);
  assert.ok(frame.x + frame.width >= original.x + original.width);
  assert.ok(frame.y + frame.height >= original.y + original.height);
  assert.throws(() => squareRegionForProposal(NaN, 100, original));
  assert.throws(() => squareRegionForProposal(100, 100, { ...original, x: 2 }));
  const anchor = { x: .25, y: .2 };
  const anchored = squareRegionForProposal(1600, 1200, { x: 0, y: 0, width: 1, height: .5 }, anchor);
  assert.ok(anchored.x <= anchor.x && anchored.x + anchored.width >= anchor.x);
  assert.ok(anchored.y <= anchor.y && anchored.y + anchored.height >= anchor.y);
  assert.throws(() => squareRegionForProposal(100, 100, original, { x: 1, y: 1 }));
});

test("an off-center cloud anchor cannot cut off a proposal that fits in the square", () => {
  const b = { x: .15, y: .25, width: .5, height: .2 };
  for (const anchor of [{ x: .16, y: .26 }, { x: .64, y: .44 }]) {
    const crop = squareRegionForProposal(1200, 900, b, anchor);
    assert.ok(crop.x <= b.x + 1e-9 && crop.x + crop.width >= b.x + b.width - 1e-9);
    assert.ok(crop.y <= b.y + 1e-9 && crop.y + crop.height >= b.y + b.height - 1e-9);
  }
});

test("near-black input veto does not reject gray skies, a blue channel or visible contrast", () => {
  assert.ok(isNearBlackCrop([0, 0, 0, 255, 12, 12, 12, 255]));
  for (const pixels of [[], [120, 120, 120, 255], [0, 5, 75, 255], [0, 0, 0, 255, 90, 90, 90, 255]]) {
    assert.equal(isNearBlackCrop(pixels), false);
  }
});

test("corner drag fixes the opposite corner, stays square in pixels and never escapes the photo", () => {
  for (const [w, h] of [[1600, 900], [900, 1600]]) {
    const start = squarePhotoRegion(w, h, {x: .6, y: .6}, .4);
    const bigger = resizePhotoCorner(start, w, h, .03, .03);
    assert.ok(bigger.width > start.width);
    for (const delta of [-5, -.01, 0, .01, 5]) {
      const crop = resizePhotoCorner(start, w, h, delta, delta);
      validatePhotoRegion(crop);
      assert.equal(crop.x, start.x); assert.equal(crop.y, start.y);
      assert.ok(Math.abs(crop.width*w - crop.height*h) < 1e-8);
    }
  }
});

test("selected-region JPEG preserves every visible crop edge and flags native no-recrop mode", async (t) => {
  const descriptors = Object.fromEntries(["Image", "document"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => { for (const key of ["Image", "document"]) {
    if (descriptors[key]) Object.defineProperty(globalThis, key, descriptors[key]); else delete globalThis[key];
  } });
  const draws = [];
  const canvas = { getContext: () => ({ drawImage: (...args) => draws.push(args) }), toDataURL: () => "data:image/jpeg;base64,fixture" };
  const sample = { getContext: () => ({ drawImage() {}, getImageData: () => ({ data: [100, 130, 150, 255] }) }) };
  globalThis.Image = class {
    naturalWidth = 1600; naturalHeight = 1200;
    set src(_) { queueMicrotask(() => this.onload()); }
  };
  globalThis.document = { createElement: () => draws.length ? sample : canvas };
  const result = await prepareRecognitionRegion("local-photo", { x: .25, y: .25, width: .375, height: .5 });
  assert.deepEqual(draws[0].slice(1), [400, 300, 600, 600, 0, 0, 600, 600]);
  assert.equal(canvas.width, canvas.height);
  assert.deepEqual(result, { previewUrl: "data:image/jpeg;base64,fixture", base64: "fixture", selectedRegion: true });
  await assert.rejects(prepareRecognitionRegion("local-photo", { x: 0, y: 0, width: 1, height: 1 }), RangeError);
  assert.equal(draws.length, 1);
});

test("keyboard movement keeps the selected proposal size and position, including small regions", () => {
  for (const [width, height] of [[1200, 1600], [1600, 1200]]) {
    const original = squareRegionForProposal(width, height, { x: .1, y: .2, width: .05, height: .05 });
    const right = movePhotoRegion(original, .05, 0);
    assert.ok(Math.abs(right.x - original.x - .05) < 1e-9);
    assert.equal(right.y, original.y);
    assert.equal(right.width, original.width);
    assert.equal(right.height, original.height);
    assert.deepEqual(movePhotoRegion(original, 0, 0), original);
    for (const dx of [-1, 1]) for (const dy of [-1, 1]) {
      const moved = movePhotoRegion(original, dx, dy);
      validatePhotoRegion(moved);
      assert.equal(moved.width, original.width);
      assert.equal(moved.height, original.height);
    }
  }
  assert.throws(() => movePhotoRegion({ x: 0, y: 0, width: 1, height: 1 }, NaN, 0));
});

test("a near-black selected crop is rejected before JPEG encoding or inference", async (t) => {
  const previous = Object.fromEntries(["Image", "document"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => {
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  });
  globalThis.Image = class { naturalWidth = 100; naturalHeight = 80; set src(_) { this.onload(); } };
  globalThis.document = { createElement: () => ({
    getContext: () => ({ drawImage() {}, getImageData: () => ({ data: new Uint8ClampedArray(16*16*4) }) }),
    toDataURL: () => assert.fail("A rejected crop should not be encoded"),
  }) };
  assert.deepEqual(await prepareRecognitionRegion("dark", { x: .2, y: 0, width: .8, height: 1 }), { quality: "near-black" });
});
