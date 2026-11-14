/*
=========================================================
MRS WOLFIE - PRIVATE FIGHT DRAFT MANAGEMENT
=========================================================

Private Firestore collection:
mrsWolfieFightDrafts

Private Storage prefix:
mrs-wolfie-private-fight-drafts

This module must only be used by authorised administrators.

Firebase Security Rules provide the final access control.

Publishing is deliberately not implemented here.
=========================================================
*/

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

export const PRIVATE_DRAFT_COLLECTION =
  "mrsWolfieFightDrafts";

export const PRIVATE_DRAFT_STORAGE_PREFIX =
  "mrs-wolfie-private-fight-drafts";

export const PRIVATE_DRAFT_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED"
});

const ADMIN_UIDS = new Set([
  "PRGa9TsCW0QDn1QtoUXyYjEi7YB3",
  "SlpEQYl94DaH6j42QUyl8Kv2ujJ3"
]);

const DRAFT_FIELDS = [
  "promotion",
  "event",
  "opponent",
  "type",
  "date",
  "dateEnd",
  "displayDate",
  "method",
  "fightTitle",
  "venue",
  "ticketUrl",
  "status",
  "result",
  "notes",
  "fighterImagePath",
  "opponentImagePath"
];

function requireAdmin(user) {
  if (
    !user ||
    user.isAnonymous ||
    !ADMIN_UIDS.has(user.uid)
  ) {
    throw new Error(
      "Authorised administrator authentication required."
    );
  }
}

function requireDatabase(db) {
  if (!db) {
    throw new Error("Firestore instance required.");
  }
}

function cleanDraftData(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new Error("Valid draft data required.");
  }

  const cleaned = {};

  for (const field of DRAFT_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(input, field)) {
      continue;
    }

    const value = input[field];

    if (typeof value !== "string") {
      throw new Error(
        "Invalid value for draft field: " + field
      );
    }

    cleaned[field] = value.trim();
  }

  if (
    cleaned.date &&
    cleaned.dateEnd &&
    cleaned.dateEnd < cleaned.date
  ) {
    throw new Error(
      "The end date cannot be earlier than the fight date."
    );
  }

  if (cleaned.dateEnd && !cleaned.date) {
    throw new Error(
      "A start date is required when an end date is set."
    );
  }

  if (
    cleaned.status === "COMPLETED" &&
    !["W", "L", "D"].includes(cleaned.result)
  ) {
    throw new Error(
      "A completed fight requires a valid result."
    );
  }

  if (
    cleaned.result &&
    cleaned.status &&
    cleaned.status !== "COMPLETED"
  ) {
    throw new Error(
      "Fight results require COMPLETED status."
    );
  }

  return cleaned;
}

function getDraftReference(db, id) {
  if (
    typeof id !== "string" ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(id)
  ) {
    throw new Error("Invalid private draft ID.");
  }

  return doc(db, PRIVATE_DRAFT_COLLECTION, id);
}

export async function createPrivateDraft(
  db,
  user,
  input
) {
  requireAdmin(user);
  requireDatabase(db);

  const cleaned = cleanDraftData(input);

  const reference = doc(
    collection(db, PRIVATE_DRAFT_COLLECTION)
  );

  await setDoc(reference, {
    ...cleaned,
    draftStatus: PRIVATE_DRAFT_STATUS.DRAFT,
    createdAt: serverTimestamp(),
    createdBy: user.uid,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid
  });

  return reference.id;
}

export async function updatePrivateDraft(
  db,
  user,
  id,
  input
) {
  requireAdmin(user);
  requireDatabase(db);

  const reference = getDraftReference(db, id);
  const cleaned = cleanDraftData(input);

  const existing = await getDoc(reference);

  if (!existing.exists()) {
    throw new Error("Private draft not found.");
  }

  if (
    existing.data().draftStatus !==
    PRIVATE_DRAFT_STATUS.DRAFT
  ) {
    throw new Error(
      "Only unpublished drafts can be edited."
    );
  }

  await updateDoc(reference, {
    ...cleaned,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid
  });

  return id;
}

export async function getPrivateDraft(
  db,
  user,
  id
) {
  requireAdmin(user);
  requireDatabase(db);

  const snapshot = await getDoc(
    getDraftReference(db, id)
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

export async function loadPrivateDrafts(
  db,
  user
) {
  requireAdmin(user);
  requireDatabase(db);

  const snapshot = await getDocs(
    collection(db, PRIVATE_DRAFT_COLLECTION)
  );

  return snapshot.docs.map(item => ({
    id: item.id,
    ...item.data()
  }));
}

export async function deletePrivateDraft(
  db,
  user,
  id
) {
  requireAdmin(user);
  requireDatabase(db);

  const reference = getDraftReference(db, id);
  const existing = await getDoc(reference);

  if (!existing.exists()) {
    return false;
  }

  if (
    existing.data().draftStatus !==
    PRIVATE_DRAFT_STATUS.DRAFT
  ) {
    throw new Error(
      "Published records cannot be deleted as drafts."
    );
  }

  await deleteDoc(reference);

  return true;
}

/*
  Image upload and controlled publication will be
  implemented separately.

  Do not connect this module to the live dashboard
  until the private security rules are deployed
  and the workflow has passed testing.
*/

export function privateDraftsReady() {
  return false;
}