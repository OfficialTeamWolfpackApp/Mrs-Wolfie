/**
 * Read-only migration mapper for Mrs Wolfie Firestore fight records.
 * This module never connects to Firebase and never writes data.
 */

const ALLOWED_STATUSES = new Set([
  "UPCOMING",
  "POSTPONED",
  "COMPLETED",
  "CANCELLED"
]);

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function dateTimestamp(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const value = new Date(date + "T12:00:00").getTime();
  return Number.isFinite(value) ? value : null;
}

function fingerprint(fight) {
  const parts = [
    clean(fight.fightDate || fight.date).toLowerCase(),
    clean(fight.opponent).toLowerCase(),
    clean(fight.promotion).toLowerCase(),
    clean(fight.eventName || fight.event).toLowerCase()
  ];
  return parts.some(Boolean) ? parts.join("|") : null;
}

export function mapMrsWolfieFight(documentId, source) {
  if (!documentId || typeof documentId !== "string") {
    throw new TypeError("A Firestore document ID is required.");
  }
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    throw new TypeError("A Firestore fight document must be an object.");
  }

  const fightDate = clean(source.date || source.fightDate);
  const displayDate = clean(source.displayDate) ||
    (fightDate || "TBA");
  const dateTba =
    !fightDate || displayDate.toUpperCase() === "TBA";

  const status = clean(source.status || "UPCOMING").toUpperCase();
  const result = clean(source.result).toUpperCase();

  const mapped = {
    fighterId: "mrs-wolfie",
    fighterName: "MRS WOLFIE",
    fighterProfile: "mrs-wolfie.html",
    team: "TEAM WOLFIE",
    opponent: clean(source.opponent) || "TBA",
    fightDate: dateTba ? "" : fightDate,
    displayDate: dateTba ? "TBA" : displayDate,
    dateTimestamp: dateTba ? null :
      (Number.isFinite(source.dateTimestamp)
        ? source.dateTimestamp
        : dateTimestamp(fightDate)),
    dateTba,
    fightAgreed: dateTba,
    dateEnd: clean(source.dateEnd || source.dateEndDate),
    status,
    result,
    method: clean(source.method || source.resultMethod),
    promotion: clean(source.promotion),
    eventName: clean(source.event || source.eventName),
    venue: clean(source.venue),
    fightType: clean(source.type || source.fightType || "FIGHT NIGHT"),
    fightTitle: clean(source.fightTitle || source.title),
    fighterImage: clean(source.fighterImage) || "zoey-james.jpg",
    opponentImage: clean(source.opponentImage),
    ticketUrl: clean(source.ticketUrl)
  };

  const reviewReasons = [];
  if (!ALLOWED_STATUSES.has(status)) {
    reviewReasons.push("UNRECOGNISED_STATUS");
  }
  if (!mapped.promotion) reviewReasons.push("MISSING_PROMOTION");
  if (!mapped.venue) reviewReasons.push("MISSING_VENUE");
  if (!mapped.opponent || mapped.opponent === "TBA") {
    reviewReasons.push("OPPONENT_TBA");
  }
  if (!dateTba && !mapped.dateTimestamp) {
    reviewReasons.push("INVALID_FIGHT_DATE");
  }
  if (result && status !== "COMPLETED") {
    reviewReasons.push("RESULT_WITH_NON_COMPLETED_STATUS");
  }
  if (status === "COMPLETED" && !result) {
    reviewReasons.push("COMPLETED_WITHOUT_RESULT");
  }

  return {
    sourceDocumentId: documentId,
    mapped,
    fingerprint: fingerprint(mapped),
    reviewReasons,
    privateNotesExcluded: Object.prototype.hasOwnProperty.call(source, "notes")
  };
}

export function buildMrsWolfieMigrationAudit(firestoreDocuments, realtimeFights) {
  if (!Array.isArray(firestoreDocuments)) {
    throw new TypeError("Firestore documents must be supplied as an array.");
  }
  if (!realtimeFights || typeof realtimeFights !== "object" ||
      Array.isArray(realtimeFights)) {
    throw new TypeError("Realtime Database fights must be an object.");
  }

  const existing = Object.entries(realtimeFights)
    .filter(([, fight]) =>
      fight && typeof fight === "object" &&
      fight.fighterId === "mrs-wolfie"
    );

  const existingIds = new Set(existing.map(([id]) => id));
  const existingFingerprints = new Map();

  for (const [, fight] of existing) {
    const key = fingerprint(fight);
    if (key) {
      existingFingerprints.set(key, (existingFingerprints.get(key) || 0) + 1);
    }
  }

  const seenSourceFingerprints = new Set();
  const rows = firestoreDocuments.map((document) => {
    const row = mapMrsWolfieFight(document.id, document.data);
    const reasons = [...row.reviewReasons];

    if (existingIds.has(row.sourceDocumentId)) {
      reasons.push("TARGET_ID_ALREADY_EXISTS");
    }

    if (row.fingerprint && existingFingerprints.has(row.fingerprint)) {
      reasons.push("POSSIBLE_EXISTING_DUPLICATE");
    }

    if (row.fingerprint && seenSourceFingerprints.has(row.fingerprint)) {
      reasons.push("DUPLICATE_WITHIN_SOURCE_COLLECTION");
    }
    if (row.fingerprint) seenSourceFingerprints.add(row.fingerprint);

    return {
      ...row,
      decision: reasons.some((reason) =>
        reason === "TARGET_ID_ALREADY_EXISTS" ||
        reason === "POSSIBLE_EXISTING_DUPLICATE" ||
        reason === "DUPLICATE_WITHIN_SOURCE_COLLECTION"
      ) ? "HOLD_DUPLICATE_REVIEW" :
        (reasons.length ? "HOLD_DATA_REVIEW" : "READY_FOR_MANUAL_REVIEW"),
      reviewReasons: reasons
    };
  });

  return {
    mode: "READ_ONLY_DRY_RUN",
    sourceCollection: "mrsWolfieFights",
    targetPath: "/fights",
    targetFighterId: "mrs-wolfie",
    sourceCount: firestoreDocuments.length,
    existingMrsWolfieTargetCount: existing.length,
    readyForManualReview: rows.filter(x =>
      x.decision === "READY_FOR_MANUAL_REVIEW").length,
    heldForDataReview: rows.filter(x =>
      x.decision === "HOLD_DATA_REVIEW").length,
    heldForDuplicateReview: rows.filter(x =>
      x.decision === "HOLD_DUPLICATE_REVIEW").length,
    rows
  };
}
