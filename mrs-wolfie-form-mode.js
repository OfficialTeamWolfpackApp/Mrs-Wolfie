/*
=========================================================
MRS WOLFIE - FIGHT FORM MODE CONTROLLER
=========================================================

Controls the public/private form action buttons.

No Firebase imports.
No database operations.
No publication operations.

Private saving remains disabled by default.
=========================================================
*/

export function applyFightFormMode({
  mode = "PUBLIC",
  publicSaveButton,
  privateSaveButton,
  privateDraftWritesEnabled = false,
  editingPublicFight = false
} = {}) {

  if (
    !publicSaveButton ||
    !privateSaveButton
  ) {
    throw new Error(
      "Both fight form action buttons are required."
    );
  }

  if (
    mode !== "PUBLIC" &&
    mode !== "PRIVATE"
  ) {
    throw new Error(
      "Invalid fight form mode."
    );
  }

  if (mode === "PRIVATE") {

    publicSaveButton.disabled = true;

    privateSaveButton.disabled =
      !privateDraftWritesEnabled;

    privateSaveButton.textContent =
      privateDraftWritesEnabled
        ? "SAVE PRIVATE DRAFT"
        : "SAVE PRIVATE DRAFT - COMING SOON";

    return Object.freeze({
      mode: "PRIVATE",
      publicSubmissionEnabled: false,
      privateDraftSavingEnabled:
        privateDraftWritesEnabled
    });
  }

  publicSaveButton.disabled = false;

  publicSaveButton.textContent =
    editingPublicFight
      ? "SAVE CHANGES"
      : "ADD FIGHT";

  privateSaveButton.disabled = true;

  privateSaveButton.textContent =
    "SAVE PRIVATE DRAFT - COMING SOON";

  return Object.freeze({
    mode: "PUBLIC",
    publicSubmissionEnabled: true,
    privateDraftSavingEnabled: false
  });
}