import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  dragHeight,
  keyboardHeight,
  HEIGHT_RANGE,
  HEIGHT_SPAN,
} from "../weather-preview/interaction.mjs";
import { cloud } from "../weather-preview/model.mjs";

test("parcel drag uses the rendered scene height, not desktop pixels", () => {
  for (const sceneHeight of [190, 204.8, 250, 390, 600]) {
    const distance = (sceneHeight * HEIGHT_SPAN) / 3;
    assert.equal(dragHeight(0, 500, 500 - distance, sceneHeight), 1000);
    assert.equal(dragHeight(1500, 500, 500 + distance, sceneHeight), 500);
    assert.equal(dragHeight(1230, 500, 500, sceneHeight), 1230);
  }
});

test("captured pointer outside the scene clamps and respects 10 m steps", () => {
  assert.equal(dragHeight(1000, 200, -10000, 200), 3000);
  assert.equal(dragHeight(1000, 200, 10000, 200), 0);
  for (let y = -200; y <= 1000; y++) {
    const height = dragHeight(1500, 200, y, 204.8);
    assert.ok(height >= HEIGHT_RANGE.min && height <= HEIGHT_RANGE.max);
    assert.equal(height % HEIGHT_RANGE.step, 0);
  }
  assert.equal(dragHeight(1500, 10, 20, 0), 1500);
  assert.equal(dragHeight(1500, 10, NaN, 200), 1500);
});

test("vertical parcel supports keyboard, endpoints, fine and coarse movement", () => {
  for (const key of ["ArrowUp", "ArrowRight"])
    assert.equal(keyboardHeight(1000, key), 1050);
  for (const key of ["ArrowDown", "ArrowLeft"])
    assert.equal(keyboardHeight(1000, key), 950);
  assert.equal(keyboardHeight(1000, "PageUp"), 1500);
  assert.equal(keyboardHeight(1000, "PageDown"), 500);
  assert.equal(keyboardHeight(1000, "Home"), 0);
  assert.equal(keyboardHeight(1000, "End"), 3000);
  assert.equal(keyboardHeight(3000, "ArrowUp"), 3000);
  assert.equal(keyboardHeight(0, "ArrowDown"), 0);
  assert.equal(keyboardHeight(1000, "Tab"), null);
  assert.equal(keyboardHeight(1000, "toString"), null);
});

test("dragging changes the same physical input as keyboard and walkthrough actions", () => {
  const input = { temperature: 24, humidity: 55, height: 0 };
  const dragged = dragHeight(0, 200, 152, 200);
  assert.equal(dragged, 1500);
  assert.deepEqual(
    cloud({ ...input, height: dragged }),
    cloud({ ...input, height: keyboardHeight(1000, "PageUp") }),
  );
  assert.equal(cloud({ ...input, height: 500 }).saturated, false);
  assert.equal(cloud({ ...input, height: dragged }).saturated, true);
});

test("UI wiring preserves tap alternatives, pointer cancellation and assessment locks", async () => {
  const main = await readFile(
    new URL("../weather-preview/main.jsx", import.meta.url),
    "utf8",
  );
  const parcel = await readFile(
    new URL("../weather-preview/parcel-control.jsx", import.meta.url),
    "utf8",
  );
  assert.match(
    main,
    /showControl\("height"\) &&\s*!controlDisabled\("height"\)/,
  );
  assert.match(main, /Opuść o 100 m/);
  assert.match(main, /Unieś o 100 m/);
  assert.match(parcel, /role="slider"/);
  assert.match(parcel, /aria-orientation="vertical"/);
  assert.match(parcel, /setPointerCapture/);
  assert.match(
    parcel,
    /onPointerCancel=\{\(event\) => finish\(event, true\)\}/,
  );
  assert.match(parcel, /onLostPointerCapture/);
  assert.match(parcel, /if \(cancelled\) onChange\(start.value\)/);
  assert.match(parcel, /!event.isPrimary/);
  assert.ok(
    main.indexOf('className="guide-intro"') <
      main.indexOf('className="scene-area"'),
  );
  assert.ok(
    main.indexOf('className="scene-action"') <
      main.indexOf('<aside className="controls">'),
  );
});
