import assert from "node:assert/strict";
import test from "node:test";

import {
  createFightEditorModeManager,
  FIGHT_EDITOR_MODES
} from "./mrs-wolfie-editor-mode.js";

test("Mrs Wolfie editor mode safeguards", () => {

  const manager = createFightEditorModeManager();

  assert.equal(
    manager.getMode(),
    FIGHT_EDITOR_MODES.PUBLIC
  );

  console.log("PASS: PUBLIC mode is default");

  assert.equal(
    manager.isPrivateMode(),
    false
  );

  console.log("PASS: Private mode inactive by default");

  assert.throws(
    () => manager.setMode("INVALID"),
    /Invalid fight editor mode/
  );

  console.log("PASS: Invalid modes rejected");

  assert.throws(
    () => manager.setMode(FIGHT_EDITOR_MODES.PRIVATE),
    /Private draft mode is not enabled/
  );

  console.log("PASS: Disabled PRIVATE mode rejected");

  assert.equal(
    manager.getMode(),
    FIGHT_EDITOR_MODES.PUBLIC
  );

  console.log("PASS: Failed mode change preserves PUBLIC mode");

  assert.equal(
    manager.setMode(FIGHT_EDITOR_MODES.PUBLIC),
    FIGHT_EDITOR_MODES.PUBLIC
  );

  console.log("PASS: PUBLIC mode selection works");

  const enabledManager = createFightEditorModeManager({
    privateModeEnabled: true
  });

  assert.equal(
    enabledManager.setMode(FIGHT_EDITOR_MODES.PRIVATE),
    FIGHT_EDITOR_MODES.PRIVATE
  );

  console.log("PASS: Explicit test-only PRIVATE mode works");

  assert.equal(
    enabledManager.isPrivateMode(),
    true
  );

  console.log("PASS: Private mode detected correctly");

  assert.equal(
    enabledManager.resetMode(),
    FIGHT_EDITOR_MODES.PUBLIC
  );

  console.log("PASS: Reset returns to PUBLIC mode");

  assert.equal(
    enabledManager.isPrivateMode(),
    false
  );

  console.log("PASS: Reset clears PRIVATE mode");

  console.log("------------------------------------------");
  console.log("ALL 10 EDITOR MODE TESTS PASSED");
  console.log("NO FIREBASE CONNECTIONS OR WRITES");
});