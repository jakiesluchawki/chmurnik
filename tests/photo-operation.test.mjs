import assert from "node:assert/strict";
import test from "node:test";
import { createPhotoOperationScope } from "../src/lib/photo-operation.js";

test("photo work starts only within a mounted screen", () => {
  const scope = createPhotoOperationScope();
  assert.equal(scope.begin(), null);
  const unmount = scope.mount();
  const operation = scope.begin();
  assert.equal(operation.isCurrent(), true);
  unmount();
  assert.equal(operation.isCurrent(), false);
  assert.equal(scope.begin(), null);
});

test("rapid taps share one capture, crop or save operation", () => {
  const scope = createPhotoOperationScope();
  scope.mount();
  const first = scope.begin();
  assert.equal(scope.begin(), null);
  first.finish();
  assert.equal(first.isCurrent(), false);
  assert.equal(scope.begin().isCurrent(), true);
});

test("late completion cannot clear a newer photo operation", () => {
  const scope = createPhotoOperationScope();
  scope.mount();
  const first = scope.begin();
  first.finish();
  const second = scope.begin();
  first.finish();
  assert.equal(second.isCurrent(), true);
  assert.equal(scope.begin(), null);
});

test("StrictMode remount invalidates the first effect's result", () => {
  const scope = createPhotoOperationScope();
  const cleanup = scope.mount();
  const first = scope.begin();
  cleanup();
  scope.mount();
  const second = scope.begin();
  first.finish();
  cleanup();
  assert.equal(first.isCurrent(), false);
  assert.equal(second.isCurrent(), true);
});

test("a native result arriving after close is ignored", async () => {
  const scope = createPhotoOperationScope();
  const cleanup = scope.mount();
  const operation = scope.begin();
  let resolve;
  const inference = new Promise((done) => { resolve = done; });
  const displayed = [];
  const run = (async () => {
    const result = await inference;
    if (operation.isCurrent()) displayed.push(result);
    operation.finish();
  })();
  cleanup();
  resolve("old photo result");
  await run;
  assert.deepEqual(displayed, []);
});
