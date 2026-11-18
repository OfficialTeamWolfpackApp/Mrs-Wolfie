/*
=========================================================
MRS WOLFIE - PRIVATE DRAFT EDITING STATE
=========================================================

Keeps private draft editing separate from public fights.

This module does not:
- access Firebase
- modify public fight records
- enable private draft features
- publish fights
=========================================================
*/

export function createPrivateDraftEditState() {

  let editingDraftId = null;

  function validateDraftId(id) {

    if (
      typeof id !== "string" ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(id)
    ) {
      throw new Error("Invalid private draft ID.");
    }

    return id;
  }

  return Object.freeze({

    getEditingDraftId() {
      return editingDraftId;
    },

    isEditingDraft() {
      return editingDraftId !== null;
    },

    startEditing(id) {
      editingDraftId = validateDraftId(id);
      return editingDraftId;
    },

    clearEditing() {
      editingDraftId = null;
      return null;
    }

  });
}