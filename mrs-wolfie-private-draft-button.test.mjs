import assert from "node:assert/strict";
import test from "node:test";

import {
  createFightEditorModeManager
} from "./mrs-wolfie-editor-mode.js";

import {
  prepareCreatePrivateDraft
} from "./mrs-wolfie-private-draft-button.js";

test("Mrs Wolfie private draft button safeguards", () => {

  const disabledManager = createFightEditorModeManager();

  assert.equal(disabledManager.getMode(), "PUBLIC");
  console.log("PASS: PUBLIC mode is default");

  assert.throws(
    () => prepareCreatePrivateDraft({
      editorModeManager: disabledManager
    }),
    /not enabled/
  );

  console.log("PASS: Private draft creation disabled by default");

  assert.equal(disabledManager.getMode(), "PUBLIC");
  console.log("PASS: Disabled request preserves PUBLIC mode");

  assert.throws(
    () => prepareCreatePrivateDraft({
      privateModeEnabled: true
    }),
    /valid fight editor mode manager/
  );

  console.log("PASS: Missing manager rejected");

  const productionLikeManager = createFightEditorModeManager();

  assert.throws(
    () => prepareCreatePrivateDraft({
      editorModeManager: productionLikeManager,
      privateModeEnabled: true
    }),
    /not enabled/
  );

  assert.equal(productionLikeManager.getMode(), "PUBLIC");

  console.log("PASS: Disabled manager cannot be bypassed");

  const testManager = createFightEditorModeManager({
    privateModeEnabled: true
  });

  assert.throws(
    () => prepareCreatePrivateDraft({
      editorModeManager: testManager,
      privateModeEnabled: true,
      editingPublicFight: true
    }),
    /Finish or cancel/
  );

  assert.equal(testManager.getMode(), "PUBLIC");

  console.log("PASS: Active public edit blocks private transition");

  const result = prepareCreatePrivateDraft({
    editorModeManager: testManager,
    privateModeEnabled: true,
    editingPublicFight: false
  });

  assert.equal(result.previousMode, "PUBLIC");
  assert.equal(result.currentMode, "PRIVATE");
  assert.equal(result.ready, true);

  console.log("PASS: Test-only PRIVATE transition works");

  assert.equal(testManager.getMode(), "PRIVATE");
  console.log("PASS: Editor manager tracks PRIVATE mode");

  assert.throws(
    () => prepareCreatePrivateDraft({
      editorModeManager: testManager,
      privateModeEnabled: true
    }),
    /must be in PUBLIC mode/
  );

  console.log("PASS: Duplicate PRIVATE transition rejected");

  testManager.resetMode();

  assert.equal(testManager.getMode(), "PUBLIC");

  console.log("PASS: Reset returns editor to PUBLIC mode");

  console.log("------------------------------------------");
  console.log("ALL PRIVATE DRAFT BUTTON TESTS PASSED");
  console.log("NO FIREBASE CONNECTIONS OR WRITES");
});