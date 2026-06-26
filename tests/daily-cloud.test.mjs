import assert from "node:assert/strict";
import test from "node:test";
import { dailyIndex, localDateKey, selectDailyCloud } from "../src/lib/daily-cloud.js";

test("daily cloud selection is stable for a local calendar date", () => {
  const morning = new Date(2026, 5, 26, 7, 10);
  const evening = new Date(2026, 5, 26, 22, 45);
  assert.equal(localDateKey(morning), "2026-06-26");
  assert.equal(dailyIndex(morning, 30), dailyIndex(evening, 30));
});

test("daily cloud selection returns a real image candidate", () => {
  const cloudList = [
    { id: "a", images: [{ id: "a-1", src: "a.jpg" }] },
    { id: "b", images: [{ id: "b-1", src: "b.jpg" }] },
  ];
  const selected = selectDailyCloud(cloudList, new Date(2026, 5, 26));
  assert.ok(selected.cloud.id === "a" || selected.cloud.id === "b");
  assert.match(selected.image.src, /\.jpg$/);
  assert.equal(selected.total, 2);
});

test("daily index declines empty candidate collections", () => {
  assert.equal(dailyIndex(new Date(2026, 5, 26), 0), -1);
  assert.equal(selectDailyCloud([], new Date(2026, 5, 26)), null);
});
