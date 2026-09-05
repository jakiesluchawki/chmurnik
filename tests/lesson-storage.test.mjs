import assert from "node:assert/strict";
import test from "node:test";
import { loadLessonPosition, saveLessonPosition } from "../src/lib/storage.js";

test("lesson resume rejects damaged or negative positions without mutating stored data", () => {
  const original = globalThis.window;
  let value;
  let writes = 0;
  globalThis.window = { localStorage: { getItem: () => value, setItem() { writes++; } } };
  try {
    for (const invalid of [null, "{", "null", "12", '"text"', "[]", '{"wiatr":-1}', '{"wiatr":1.5}', '{"wiatr":"2"}']) {
      value = invalid;
      assert.equal(loadLessonPosition("wiatr"), 0, String(invalid));
    }
    value = '{"wiatr":5,"obserwacja":2}';
    assert.equal(loadLessonPosition("wiatr"), 5);
    assert.equal(loadLessonPosition("obserwacja"), 2);
    assert.equal(loadLessonPosition("warstwy"), 0);
    assert.equal(writes, 0);
  } finally { globalThis.window = original; }
});

test("saving a lesson position preserves other lessons", () => {
  const original = globalThis.window;
  let value = '{"wiatr":5}';
  globalThis.window = { localStorage: { getItem: () => value, setItem: (_, next) => { value = next; } } };
  try {
    assert.equal(saveLessonPosition("obserwacja", 2), true);
    assert.deepEqual(JSON.parse(value), { wiatr: 5, obserwacja: 2 });
  } finally { globalThis.window = original; }
});
