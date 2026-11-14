/*
=========================================================
MRS WOLFIE - SAFE FIGHT FORM RESET
=========================================================

Clears fight-specific form data when changing editor
context.

Does not change editor mode.
Does not change editing IDs.
Does not perform Firebase operations.
Does not enable private drafts.

The caller remains responsible for coordinating editor
mode, active saves and asynchronous operations.
=========================================================
*/

const CLEAR_FIELDS = Object.freeze([
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
]);

const FILE_FIELDS = Object.freeze([
  "fighterImageUpload",
  "opponentImageUpload"
]);

const REMOVE_FIELDS = Object.freeze([
  "removeFighterImage",
  "removeOpponentImage"
]);

const PREVIEW_FIELDS = Object.freeze([
  "fighterImagePreview",
  "opponentImagePreview"
]);

export function clearFightFormContext(documentRef) {

  if (
    !documentRef ||
    typeof documentRef.getElementById !== "function"
  ) {
    throw new Error(
      "A valid document is required."
    );
  }

  const requiredIds = [
    ...CLEAR_FIELDS,
    ...FILE_FIELDS,
    ...REMOVE_FIELDS,
    ...PREVIEW_FIELDS,
    "fightType",
    "fightStatus"
  ];

  const elements = new Map();

  // Validate every required element before changing anything.
  for (const id of requiredIds) {
    const element = documentRef.getElementById(id);

    if (!element) {
      throw new Error(
        "Missing fight form element: " + id
      );
    }

    elements.set(id, element);
  }

  for (const id of CLEAR_FIELDS) {
    elements.get(id).value = "";
  }

  for (const id of FILE_FIELDS) {
    elements.get(id).value = "";
  }

  for (const id of REMOVE_FIELDS) {
    elements.get(id).checked = false;
  }

  for (const id of PREVIEW_FIELDS) {
    const preview = elements.get(id);

    // Release only temporary URLs created for local uploads.
    const objectUrl = preview.dataset?.objectUrl;

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      delete preview.dataset.objectUrl;
    }

    preview.removeAttribute("src");
    preview.hidden = true;
  }

  elements.get("fightType").value =
    "FIGHT NIGHT";

  elements.get("fightStatus").value =
    "UPCOMING";

  elements.get("fightResult").value =
    "";

  elements.get("notes").disabled = false;

  return Object.freeze({
    cleared: true,
    editorModeChanged: false,
    editingIdChanged: false,
    firebaseOperations: 0
  });
}