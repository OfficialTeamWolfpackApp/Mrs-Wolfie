/*
=========================================================
MRS WOLFIE - PRIVATE DRAFT SELECTION
=========================================================

Prepares an existing private draft for editing.

No Firebase access.
No public fight modifications.
No feature switches enabled.
=========================================================
*/

export function selectPrivateDraftForEditing({
  draft,
  editState,
  documentRef,
  populateForm,
  isPrivateMode,
  editingPublicFight = false,
  selectionEnabled = false
}) {

  if (selectionEnabled !== true) {
    throw new Error(
      "Private draft selection is not enabled."
    );
  }

  if (
    typeof isPrivateMode !== "function" ||
    !isPrivateMode()
  ) {
    throw new Error(
      "Private draft mode must be active."
    );
  }

  if (editingPublicFight) {
    throw new Error(
      "Finish editing the public fight first."
    );
  }

  if (
    !draft ||
    typeof draft !== "object" ||
    Array.isArray(draft)
  ) {
    throw new Error(
      "Valid private draft required."
    );
  }

  if (
    typeof draft.id !== "string" ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(draft.id)
  ) {
    throw new Error(
      "Invalid private draft ID."
    );
  }

  if (
    !editState ||
    typeof editState.startEditing !== "function"
  ) {
    throw new Error(
      "Private draft editing state unavailable."
    );
  }

  if (typeof populateForm !== "function") {
    throw new Error(
      "Private draft form population unavailable."
    );
  }

  if (!documentRef) {
    throw new Error(
      "Private draft document unavailable."
    );
  }

  const data = draft.data ?? draft;

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    throw new Error(
      "Invalid private draft data."
    );
  }

  populateForm(documentRef, data);

  editState.startEditing(draft.id);

  return draft.id;
}