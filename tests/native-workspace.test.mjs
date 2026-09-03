import test from "node:test";
import assert from "node:assert/strict";
import { workspaceShortcut, workspaceRoutes } from "../src/lib/native-workspace.js";

test("native keyboard shortcuts address all seven workspaces", () => {
  workspaceRoutes.forEach((route, index) => {
    assert.equal(workspaceShortcut({ key: String(index + 1), metaKey: true }, { native: true }), route);
  });
});

test("workspace shortcuts leave browser, text editing and dialogs alone", () => {
  const event = { key: "3", metaKey: true };
  assert.equal(workspaceShortcut(event), null);
  assert.equal(workspaceShortcut(event, { native: true, modal: true }), null);
  for (const flag of ["defaultPrevented", "isComposing", "repeat", "ctrlKey", "altKey", "shiftKey"]) {
    assert.equal(workspaceShortcut({ ...event, [flag]: true }, { native: true }), null);
  }
  assert.equal(workspaceShortcut({ ...event, target: { closest: () => ({}) } }, { native: true }), null);
  assert.equal(workspaceShortcut({ key: "9", metaKey: true }, { native: true }), null);
  assert.equal(workspaceShortcut({ key: "3" }, { native: true }), null);
});
