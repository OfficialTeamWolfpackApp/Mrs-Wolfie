/*
=========================================================
MRS WOLFIE - PRIVATE DRAFT FORM DATA
=========================================================

Collects confidential fight information from the
existing admin form.

Does not perform Firebase reads or writes.

Photographs are returned separately as File objects.
=========================================================
*/

const FIELD_MAP = Object.freeze({
  promotion: "promotion",
  event: "event",
  opponent: "opponent",
  fightType: "fightType",
  fightDate: "fightDate",
  endDate: "endDate",
  displayDate: "displayDate",
  resultMethod: "resultMethod",
  fightTitle: "fightTitle",
  venue: "venue",
  ticketUrl: "ticketUrl",
  fightStatus: "fightStatus",
  fightResult: "fightResult",
  notes: "notes"
});

function getRequiredElement(documentRef, id) {
  const element = documentRef.getElementById(id);

  if (!element) {
    throw new Error("Missing fight form element: " + id);
  }

  return element;
}

function getValue(documentRef, id) {
  const element = getRequiredElement(documentRef, id);

  if (typeof element.value !== "string") {
    throw new Error("Invalid form value: " + id);
  }

  return element.value.trim();
}

export function collectPrivateDraftForm(documentRef) {
  if (
    !documentRef ||
    typeof documentRef.getElementById !== "function"
  ) {
    throw new Error("A valid document is required.");
  }

  const data = {};

  for (const [field, id] of Object.entries(FIELD_MAP)) {
    data[field] = getValue(documentRef, id);
  }

  // Unannounced opponents must remain confidential.
  // TBA is used only when no opponent has been entered.
  if (!data.opponent) {
    data.opponent = "TBA";
  }

  if (
    data.fightDate &&
    data.endDate &&
    data.endDate < data.fightDate
  ) {
    throw new Error(
      "The fight end date cannot precede its start date."
    );
  }

  if (data.endDate && !data.fightDate) {
    throw new Error(
      "A fight start date is required when an end date is set."
    );
  }

  if (
    data.fightStatus === "COMPLETED" &&
    !["W", "L", "D"].includes(data.fightResult)
  ) {
    throw new Error(
      "A completed fight requires a valid result."
    );
  }

  if (
    data.fightResult &&
    data.fightStatus !== "COMPLETED"
  ) {
    throw new Error(
      "Fight results require COMPLETED status."
    );
  }

  const fighterInput = getRequiredElement(
    documentRef,
    "fighterImageUpload"
  );

  const opponentInput = getRequiredElement(
    documentRef,
    "opponentImageUpload"
  );

  return {
    data,
    images: {
      fighter: fighterInput.files?.[0] ?? null,
      opponent: opponentInput.files?.[0] ?? null
    }
  };
}

export function populatePrivateDraftForm(
  documentRef,
  draft
) {
  if (
    !draft ||
    typeof draft !== "object"
  ) {
    throw new Error("Valid private draft required.");
  }

  for (const [field, id] of Object.entries(FIELD_MAP)) {
    const element = getRequiredElement(documentRef, id);

    const value = draft[field];

    element.value =
      typeof value === "string" ? value : "";
  }

  // Browsers do not permit programmatically restoring
  // previously uploaded files into file inputs.
  // Existing private image paths are handled separately.

  getRequiredElement(
    documentRef,
    "fighterImageUpload"
  ).value = "";

  getRequiredElement(
    documentRef,
    "opponentImageUpload"
  ).value = "";

  return true;
}
