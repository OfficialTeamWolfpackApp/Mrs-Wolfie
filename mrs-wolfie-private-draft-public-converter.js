/*
  MRS WOLFIE
  PRIVATE DRAFT TO PUBLIC FIGHT CONVERTER

  Pure data conversion only.
  No Firebase imports.
  No database writes.
  No publication.
*/

export function convertPrivateDraftToPublicFight(draft) {

  if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
    throw new Error("Valid private fight draft required.");
  }

  if (draft.draftStatus !== "DRAFT") {
    throw new Error("Only unpublished drafts can be converted.");
  }

  const status = String(
    draft.fightStatus || "UPCOMING"
  ).trim().toUpperCase();

  const allowedStatuses = [
    "UPCOMING",
    "POSTPONED",
    "CANCELLED",
    "COMPLETED"
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid public fight status.");
  }

  const result = String(
    draft.fightResult || ""
  ).trim().toUpperCase();

  if (status === "COMPLETED" && !["W", "L", "D"].includes(result)) {
    throw new Error("Completed fights require a valid result.");
  }

  if (status !== "COMPLETED" && result) {
    throw new Error("Only completed fights may contain a result.");
  }

  const opponent = String(
    draft.opponent || "TBA"
  ).trim() || "TBA";

  const rawDate = String(
    draft.fightDate || ""
  ).trim();

  const date = rawDate.toUpperCase() === "TBA"
    ? ""
    : rawDate;

  const event = String(
    draft.event || ""
  ).trim();

  const promotion = String(
    draft.promotion || ""
  ).trim();

  const fightTitle = String(
    draft.fightTitle || ""
  ).trim();

  const fightType = String(
    draft.fightType || ""
  ).trim();

  const venue = String(
    draft.venue || ""
  ).trim();

  const displayDate = String(
    draft.displayDate || ""
  ).trim() || (date ? date : "DATE TBA");

  return {
    fighterId: "mrs-wolfie",
    fighterName: "MRS WOLFIE",
    team: "TEAM WOLFIE",

    promotion,
    event,
    opponent,

    date,
    displayDate,

    fightTitle,
    fightType,
    venue,

    status,
    result,

    ticketUrl: String(draft.ticketUrl || "").trim(),

    // Public image references must be assigned separately.
    fighterImage: "",
    opponentImage: ""
  };
}