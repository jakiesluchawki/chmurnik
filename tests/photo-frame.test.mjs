import assert from "node:assert/strict";
import test from "node:test";
import { movePhotoRegion, photoFrame, squarePhotoRegion, squareRegionForProposal, prepareRecognitionRegion, validatePhotoRegion } from "../src/lib/photo-frame.js";

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

test("selected-region JPEG preserves every visible crop edge and flags native no-recrop mode", async (t) => {
  const descriptors = Object.fromEntries(["Image", "document"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => { for (const key of ["Image", "document"]) {
    if (descriptors[key]) Object.defineProperty(globalThis, key, descriptors[key]); else delete globalThis[key];
  } });
  const draws = [];
  const canvas = { getContext: () => ({ drawImage: (...args) => draws.push(args) }), toDataURL: () => "data:image/jpeg;base64,fixture" };
  globalThis.Image = class {
    naturalWidth = 1600; naturalHeight = 1200;
    set src(_) { queueMicrotask(() => this.onload()); }
  };
  globalThis.document = { createElement: () => canvas };
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
