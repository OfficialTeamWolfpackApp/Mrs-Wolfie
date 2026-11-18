/*
=========================================================
MRS WOLFIE - PRIVATE DRAFT BUTTON HANDLER
=========================================================

Prepares the Create Private Draft interaction.

No Firebase imports.
No database operations.
No publication operations.
No DOM changes.

The application must explicitly authorise private mode.
=========================================================
*/

export function prepareCreatePrivateDraft({
  editorModeManager,
  privateModeEnabled = false,
  editingPublicFight = false
} = {}) {

  if (
    !editorModeManager ||
    typeof editorModeManager.setMode !== "function" ||
    typeof editorModeManager.getMode !== "function"
  ) {
    throw new Error(
      "A valid fight editor mode manager is required."
    );
  }

  if (!privateModeEnabled) {
    throw new Error(
      "Private draft mode is not enabled."
    );
  }

  if (editingPublicFight) {
    throw new Error(
      "Finish or cancel the public fight edit first."
    );
  }

  const previousMode = editorModeManager.getMode();

  if (previousMode !== "PUBLIC") {
    throw new Error(
      "The editor must be in PUBLIC mode before creating a draft."
    );
  }

  const nextMode = editorModeManager.setMode("PRIVATE");

  if (nextMode !== "PRIVATE") {
    throw new Error(
      "The editor did not enter PRIVATE mode."
    );
  }

  return Object.freeze({
    previousMode,
    currentMode: nextMode,
    ready: true
  });
}