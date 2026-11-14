import assert from "node:assert/strict";
import test from "node:test";

import {
  applyFightFormMode
} from "./mrs-wolfie-form-mode.js";

function createButtons() {
  return {
    publicSaveButton: {
      disabled: false,
      textContent: "ADD FIGHT"
    },
    privateSaveButton: {
      disabled: true,
      textContent: "SAVE PRIVATE DRAFT - COMING SOON"
    }
  };
}

test("Mrs Wolfie fight form mode safeguards", () => {

  const buttons = createButtons();

  const publicResult = applyFightFormMode({
    mode: "PUBLIC",
    ...buttons
  });

  assert.equal(publicResult.mode, "PUBLIC");
  assert.equal(buttons.publicSaveButton.disabled, false);
  assert.equal(buttons.privateSaveButton.disabled, true);

  console.log("PASS: PUBLIC mode enables public submission");
  console.log("PASS: PUBLIC mode disables private saving");

  const editButtons = createButtons();

  applyFightFormMode({
    mode: "PUBLIC",
    editingPublicFight: true,
    ...editButtons
  });

  assert.equal(
    editButtons.publicSaveButton.textContent,
    "SAVE CHANGES"
  );

  console.log("PASS: Existing public edit label retained");

  const privateButtons = createButtons();

  const privateResult = applyFightFormMode({
    mode: "PRIVATE",
    ...privateButtons
  });

  assert.equal(privateResult.mode, "PRIVATE");
  assert.equal(privateButtons.publicSaveButton.disabled, true);
  assert.equal(privateButtons.privateSaveButton.disabled, true);

  console.log("PASS: PRIVATE mode blocks public submission");
  console.log("PASS: Private saving disabled by default");

  assert.match(
    privateButtons.privateSaveButton.textContent,
    /COMING SOON/
  );

  console.log("PASS: Disabled private save label displayed");

  const testOnlyButtons = createButtons();

  const testOnlyResult = applyFightFormMode({
    mode: "PRIVATE",
    privateDraftWritesEnabled: true,
    ...testOnlyButtons
  });

  assert.equal(
    testOnlyResult.privateDraftSavingEnabled,
    true
  );

  assert.equal(
    testOnlyButtons.privateSaveButton.disabled,
    false
  );

  console.log("PASS: Explicit test-only private saving state");

  assert.throws(
    () => applyFightFormMode({
      mode: "INVALID",
      ...createButtons()
    }),
    /Invalid fight form mode/
  );

  console.log("PASS: Invalid mode rejected");

  assert.throws(
    () => applyFightFormMode({
      mode: "PUBLIC"
    }),
    /Both fight form action buttons/
  );

  console.log("PASS: Missing buttons rejected");

  const resetButtons = createButtons();

  applyFightFormMode({
    mode: "PRIVATE",
    ...resetButtons
  });

  applyFightFormMode({
    mode: "PUBLIC",
    ...resetButtons
  });

  assert.equal(resetButtons.publicSaveButton.disabled, false);
  assert.equal(resetButtons.privateSaveButton.disabled, true);

  console.log("PASS: Reset restores PUBLIC controls");

  console.log("------------------------------------------");
  console.log("ALL FORM MODE TESTS PASSED");
  console.log("NO FIREBASE CONNECTIONS OR WRITES");
});