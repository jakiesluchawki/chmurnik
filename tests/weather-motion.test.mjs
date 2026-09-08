import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { calculate, DEFAULTS, timeLabel } from "../weather-preview/model.mjs";
import {
  sceneAppearance,
  advanceInputs,
  inputsSettled,
} from "../weather-preview/presentation.mjs";
import {
  guides,
  guideInputsAt,
  guideStepComplete,
} from "../weather-preview/tutorial.mjs";

test("fog is invisible up to saturation and increases continuously afterwards", () => {
  const input = { ...DEFAULTS.fog };
  const { needed } = calculate("fog", input);
  for (const cooling of [0, needed - 1e-7, needed])
    assert.equal(sceneAppearance("fog", { ...input, cooling }).opacity, 0);
  assert.ok(
    sceneAppearance("fog", { ...input, cooling: needed + 1e-7 }).opacity < 1e-6,
  );
  let previous = 0;
  for (let cooling = 0; cooling <= 10; cooling += 0.01) {
    const { opacity } = sceneAppearance("fog", { ...input, cooling });
    assert.ok(opacity >= previous && opacity <= 1);
    previous = opacity;
  }
});

test("cloud stays invisible below LCL including LCL beyond the drawing", () => {
  for (const temperature of [5, 24, 35])
    for (const humidity of [20, 55, 100]) {
      const input = { temperature, humidity, height: 0 };
      const { base } = calculate("cloud", input);
      let previous = 0;
      for (let height = 0; height <= 3000; height += 10) {
        const { opacity, scale } = sceneAppearance("cloud", {
          ...input,
          height,
        });
        if (height <= base) assert.equal(opacity, 0);
        assert.ok(opacity >= previous && opacity <= 1);
        assert.ok(scale >= 0.55 && scale <= 1);
        previous = opacity;
      }
      if (base < 3000)
        assert.ok(
          sceneAppearance("cloud", { ...input, height: base + 1e-7 }).opacity <
            1e-6,
        );
    }
});

test("circulation fades to zero in the calm range and never moves in the wrong direction", () => {
  for (let hour = 0; hour <= 23.5; hour += 0.1)
    for (let heating = 0; heating <= 100; heating++) {
      const input = { hour, heating };
      const { direction } = calculate("breeze", input);
      const { flow, night, speed } = sceneAppearance("breeze", input);
      assert.ok(flow >= 0 && flow <= 1 && night >= 0 && night <= 1);
      if (direction === "calm") {
        assert.equal(flow, 0);
        assert.equal(speed, 0);
      } else assert.equal(Math.sign(speed), direction === "onshore" ? -1 : 1);
    }
});

test("lighting has no dawn or dusk switch and clock formats fine-grained input", () => {
  for (const hour of [6, 19]) {
    const a = sceneAppearance("breeze", { hour: hour - 1e-7, heating: 70 });
    const b = sceneAppearance("breeze", { hour: hour + 1e-7, heating: 70 });
    assert.ok(Math.abs(a.night - b.night) < 1e-6);
  }
  assert.equal(timeLabel(14.1), "14:06");
  assert.equal(timeLabel(2.9999), "03:00");
  assert.equal(advanceInputs({ hour: 23.5 }, { hour: 0 }, 16).hour, 0);
});

test("every walkthrough target settles exactly without overshoot or invalid physics", () => {
  for (const [scene, guide] of Object.entries(guides)) {
    for (let index = 0; index < guide.steps.length; index++) {
      const start = guideInputsAt(scene, index);
      const target = {
        ...start,
        [guide.steps[index].key]: guide.steps[index].target,
      };
      let frame = { ...start };
      for (let i = 0; i < 100; i++) {
        frame = advanceInputs(frame, target, 16);
        for (const key of Object.keys(target)) {
          assert.ok(frame[key] >= Math.min(start[key], target[key]));
          assert.ok(frame[key] <= Math.max(start[key], target[key]));
        }
        if (scene !== "breeze" && !calculate(scene, frame).saturated)
          assert.equal(sceneAppearance(scene, frame).opacity, 0);
      }
      assert.ok(inputsSettled(frame, target));
      assert.ok(guideStepComplete(scene, index, frame));
    }
  }
});

test("rendering pauses when hidden and bypasses motion for reduced motion and saved trials", async () => {
  const main = await readFile(
    new URL("../weather-preview/main.jsx", import.meta.url),
    "utf8",
  );
  const motion = await readFile(
    new URL("../weather-preview/motion.jsx", import.meta.url),
    "utf8",
  );
  assert.match(main, /reduced \|\| mini/);
  assert.match(main, /key=\{`\$\{scene\}:\$\{mode\}`\}/);
  assert.match(motion, /disabled \|\| hidden/);
  assert.match(motion, /cancelAnimationFrame/);
  assert.match(motion, /visibilitychange/);
  assert.doesNotMatch(motion, /localStorage|serializeTrials/);
  assert.doesNotMatch(
    main,
    /result.saturated && \(\s*<div className="fog-layer"/,
  );
});
