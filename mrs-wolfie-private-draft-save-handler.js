/*
=========================================================
MRS WOLFIE - PRIVATE DRAFT SAVE HANDLER
=========================================================

Purpose:
Keep confidential draft saving separate from public
fight submission.

Security:
Saving remains disabled until explicitly enabled.

No direct Firebase imports or public collection access.
=========================================================
*/

export async function savePrivateFightDraft({
  controller,
  documentRef,
  collectForm,
  isPrivateMode,
  writesEnabled,
  editingDraftId = null
}) {

  if (typeof isPrivateMode !== "function" ||
      !isPrivateMode()) {
    throw new Error(
      "Private draft mode must be active."
    );
  }

  if (writesEnabled !== true) {
    throw new Error(
      "Private draft saving is not enabled."
    );
  }

  if (!controller ||
      typeof controller.createDraft !== "function" ||
      typeof controller.updateDraft !== "function") {
    throw new Error(
      "Private draft controller is unavailable."
    );
  }

  if (typeof collectForm !== "function") {
    throw new Error(
      "Private draft form collector is unavailable."
    );
  }

  if (!documentRef) {
    throw new Error(
      "Private draft document is unavailable."
    );
  }

  const form = collectForm(documentRef);

  if (!form ||
      !form.data ||
      typeof form.data !== "object" ||
      Array.isArray(form.data)) {
    throw new Error(
      "Invalid private draft form data."
    );
  }

  if (editingDraftId !== null) {

    if (typeof editingDraftId !== "string" ||
        !/^[A-Za-z0-9_-]{1,128}$/.test(editingDraftId)) {
      throw new Error(
        "Invalid private draft ID."
      );
    }

    return controller.updateDraft(
      editingDraftId,
      form.data
    );
  }

  return controller.createDraft(form.data);
}