/*
=========================================================
MRS WOLFIE - FIGHT EDITOR MODE MANAGER
=========================================================

LOCAL DEVELOPMENT MODULE

Manages PUBLIC and PRIVATE editor modes.

No Firebase imports.
No database operations.
No publication operations.

Private mode is disabled by default.
=========================================================
*/

export const FIGHT_EDITOR_MODES = Object.freeze({
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE"
});

export function createFightEditorModeManager({
  privateModeEnabled = false
} = {}) {

  let currentMode = FIGHT_EDITOR_MODES.PUBLIC;

  function getMode() {
    return currentMode;
  }

  function isPrivateMode() {
    return currentMode === FIGHT_EDITOR_MODES.PRIVATE;
  }

  function setMode(mode) {

    if (
      mode !== FIGHT_EDITOR_MODES.PUBLIC &&
      mode !== FIGHT_EDITOR_MODES.PRIVATE
    ) {
      throw new Error("Invalid fight editor mode.");
    }

    if (
      mode === FIGHT_EDITOR_MODES.PRIVATE &&
      !privateModeEnabled
    ) {
      throw new Error(
        "Private draft mode is not enabled."
      );
    }

    currentMode = mode;

    return currentMode;
  }

  function resetMode() {
    currentMode = FIGHT_EDITOR_MODES.PUBLIC;

    return currentMode;
  }

  return Object.freeze({
    getMode,
    isPrivateMode,
    setMode,
    resetMode
  });
}