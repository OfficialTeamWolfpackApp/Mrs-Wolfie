import assert from "node:assert/strict";
import test from "node:test";

import {
  clearFightFormContext
} from "./mrs-wolfie-form-reset.js";

const FIELD_IDS = [
  "promotion",
  "event",
  "opponent",
  "fightDate",
  "endDate",
  "displayDate",
  "resultMethod",
  "fightTitle",
  "venue",
  "ticketUrl",
  "fightResult",
  "notes",
  "fighterImageUpload",
  "opponentImageUpload",
  "removeFighterImage",
  "removeOpponentImage",
  "fighterImagePreview",
  "opponentImagePreview",
  "fightType",
  "fightStatus"
];

function createDocument() {
  const elements = new Map();

  for (const id of FIELD_IDS) {
    elements.set(id, {
      value: "CONFIDENTIAL TEST DATA",
      checked: true,
      disabled: true,
      hidden: false,
      src: "private-test-image",
      removeAttribute(name) {
        if (name === "src") {
          delete this.src;
        }
      }
    });
  }

  return {
    elements,
    getElementById(id) {
      return elements.get(id) ?? null;
    }
  };
}

test("Mrs Wolfie safe form reset safeguards", () => {

  const documentRef = createDocument();

  const result = clearFightFormContext(documentRef);

  for (const id of [
    "promotion",
    "event",
    "opponent",
    "fightDate",
    "endDate",
    "displayDate",
    "resultMethod",
    "fightTitle",
    "venue",
    "ticketUrl",
    "fightResult",
    "notes"
  ]) {
    assert.equal(
      documentRef.getElementById(id).value,
      ""
    );
  }

  console.log("PASS: Confidential fight details cleared");

  for (const id of [
    "fighterImageUpload",
    "opponentImageUpload"
  ]) {
    assert.equal(
      documentRef.getElementById(id).value,
      ""
    );
  }

  console.log("PASS: Uploaded file inputs cleared");

  for (const id of [
    "removeFighterImage",
    "removeOpponentImage"
  ]) {
    assert.equal(
      documentRef.getElementById(id).checked,
      false
    );
  }

  console.log("PASS: Image removal selections cleared");

  for (const id of [
    "fighterImagePreview",
    "opponentImagePreview"
  ]) {
    const preview = documentRef.getElementById(id);

    assert.equal(preview.hidden, true);
    assert.equal("src" in preview, false);
  }

  console.log("PASS: Existing image previews cleared");

  // Verify temporary local image URLs are released.
  const temporaryDocument = createDocument();

  temporaryDocument.getElementById(
    "fighterImagePreview"
  ).dataset = {
    objectUrl: "blob:temporary-fighter"
  };

  temporaryDocument.getElementById(
    "opponentImagePreview"
  ).dataset = {
    objectUrl: "blob:temporary-opponent"
  };

  const revokedUrls = [];
  const originalRevoke = URL.revokeObjectURL;

  try {
    URL.revokeObjectURL = (url) => {
      revokedUrls.push(url);
    };

    clearFightFormContext(temporaryDocument);
  } finally {
    URL.revokeObjectURL = originalRevoke;
  }

  assert.deepEqual(
    revokedUrls,
    [
      "blob:temporary-fighter",
      "blob:temporary-opponent"
    ]
  );

  for (const id of [
    "fighterImagePreview",
    "opponentImagePreview"
  ]) {
    const preview = temporaryDocument.getElementById(id);

    assert.equal(
      "objectUrl" in preview.dataset,
      false
    );

    assert.equal(preview.hidden, true);
    assert.equal("src" in preview, false);
  }

  console.log("PASS: Temporary image URLs revoked");
  console.log("PASS: Temporary image references removed");

  // Saved image URLs must never be revoked.
  const savedDocument = createDocument();
  const savedRevocations = [];

  const originalSavedRevoke = URL.revokeObjectURL;

  try {
    URL.revokeObjectURL = (url) => {
      savedRevocations.push(url);
    };

    clearFightFormContext(savedDocument);
  } finally {
    URL.revokeObjectURL = originalSavedRevoke;
  }

  assert.deepEqual(savedRevocations, []);

  console.log("PASS: Saved image URLs not revoked");

  assert.equal(
    documentRef.getElementById("fightType").value,
    "FIGHT NIGHT"
  );

  assert.equal(
    documentRef.getElementById("fightStatus").value,
    "UPCOMING"
  );

  assert.equal(
    documentRef.getElementById("fightResult").value,
    ""
  );

  console.log("PASS: Default fight values restored");

  assert.equal(
    documentRef.getElementById("notes").disabled,
    false
  );

  console.log("PASS: Private notes field restored");

  assert.equal(result.cleared, true);
  assert.equal(result.editorModeChanged, false);
  assert.equal(result.editingIdChanged, false);
  assert.equal(result.firebaseOperations, 0);

  console.log("PASS: Editor state and Firebase untouched");

  const invalidDocument = createDocument();

  invalidDocument.elements.delete("opponent");

  assert.throws(
    () => clearFightFormContext(invalidDocument),
    /Missing fight form element: opponent/
  );

  assert.equal(
    invalidDocument.getElementById("promotion").value,
    "CONFIDENTIAL TEST DATA"
  );

  console.log("PASS: Missing field rejected before clearing");

  assert.throws(
    () => clearFightFormContext(null),
    /A valid document is required/
  );

  console.log("PASS: Invalid document rejected");

  console.log("------------------------------------------");
  console.log("ALL SAFE FORM RESET TESTS PASSED");
  console.log("NO FIREBASE CONNECTIONS OR WRITES");
});