import assert from "node:assert/strict";
import test from "node:test";
import { photoFrame, squarePhotoRegion, validatePhotoRegion } from "../src/lib/photo-frame.js";

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
