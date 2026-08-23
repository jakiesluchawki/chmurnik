import assert from "node:assert/strict";
import test from "node:test";

import {
  clearObservationDraft,
  clearPhotoFeedback,
  loadJournal,
  loadPhotoFeedback,
  saveJournal,
  saveObservationDraft,
  savePhotoFeedback,
} from "../src/lib/storage.js";

test("journal persistence reports success only when the browser accepts the write", () => {
  const previousWindow = globalThis.window;
  const values = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  };

  try {
    assert.equal(saveJournal([{ id: "saved" }]), true);
    assert.deepEqual(loadJournal(), [{ id: "saved" }]);
    assert.equal(saveObservationDraft({ cloud: "Cumulus" }), true);
    assert.equal(clearObservationDraft(), true);

    globalThis.window.localStorage.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    assert.equal(saveJournal([{ id: "lost" }]), false);
    assert.equal(saveObservationDraft({ cloud: "Cumulus" }), false);
    assert.deepEqual(loadJournal(), [{ id: "saved" }]);

    globalThis.window.localStorage.removeItem = () => {
      throw new Error("SecurityError");
    };
    assert.equal(clearObservationDraft(), false);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test("photo feedback stays local, bounded, and fully removable", () => {
  const previousWindow = globalThis.window;
  const values = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  };

  try {
    const records = Array.from({ length: 55 }, (_, index) => ({
      helpful: index % 2 === 0,
      candidate: "cumulus",
      createdAt: index,
    }));

    assert.equal(savePhotoFeedback(records), true);
    assert.equal(loadPhotoFeedback().length, 50);
    assert.equal(loadPhotoFeedback()[0].createdAt, 0);
    assert.equal(clearPhotoFeedback(), true);
    assert.deepEqual(loadPhotoFeedback(), []);

    globalThis.window.localStorage.removeItem = () => {
      throw new Error("SecurityError");
    };
    assert.equal(clearPhotoFeedback(), false);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
