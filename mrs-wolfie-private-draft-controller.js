/*
=========================================================
MRS WOLFIE - PRIVATE DRAFT DASHBOARD CONTROLLER
=========================================================

PURPOSE:
Connect the private draft interface to the secure
Firestore and Storage modules.

IMPORTANT:
Private draft writes remain disabled until security
and integration testing is complete.

Public fight management must remain independent.
=========================================================
*/

import {
  createPrivateDraft,
  updatePrivateDraft,
  getPrivateDraft,
  loadPrivateDrafts,
  deletePrivateDraft
} from "./mrs-wolfie-private-drafts.js";

import {
  uploadPrivateDraftImage,
  getPrivateDraftImageBlob,
  deletePrivateDraftImage
} from "./mrs-wolfie-private-draft-images.js";

export const PRIVATE_DRAFT_WRITES_ENABLED = false;

export const PRIVATE_DRAFT_PUBLICATION_ENABLED = false;

function requireDraftWritesEnabled() {
  if (!PRIVATE_DRAFT_WRITES_ENABLED) {
    throw new Error(
      "Private draft writes are not enabled."
    );
  }
}

export function initialisePrivateDraftController({
  db,
  storage,
  auth,
  saveButton,
  draftList
}) {
  if (!db || !storage || !auth) {
    throw new Error(
      "Firebase services are required."
    );
  }

  if (!saveButton || !draftList) {
    throw new Error(
      "Private draft interface elements are missing."
    );
  }

  // Keep saving disabled during development.
  saveButton.disabled = true;

  saveButton.textContent =
    "SAVE PRIVATE DRAFT - COMING SOON";

  return {
    async loadDrafts() {
      const user = auth.currentUser;

      if (!user) {
        throw new Error(
          "Administrator sign-in required."
        );
      }

      // Do not read confidential records until
      // the private rules are deployed and verified.
      throw new Error(
        "Private draft loading is not enabled."
      );
    },

    async createDraft(data) {
      requireDraftWritesEnabled();

      return createPrivateDraft(
        db,
        auth.currentUser,
        data
      );
    },

    async updateDraft(id, data) {
      requireDraftWritesEnabled();

      return updatePrivateDraft(
        db,
        auth.currentUser,
        id,
        data
      );
    },

    async deleteDraft(id) {
      requireDraftWritesEnabled();

      return deletePrivateDraft(
        db,
        auth.currentUser,
        id
      );
    },

    async uploadImage(id, kind, file) {
      requireDraftWritesEnabled();

      return uploadPrivateDraftImage(
        storage,
        auth.currentUser,
        id,
        kind,
        file
      );
    },

    async getImage(id, path) {
      throw new Error(
        "Private image previews are not enabled."
      );
    },

    async deleteImage(id, path) {
      requireDraftWritesEnabled();

      return deletePrivateDraftImage(
        storage,
        auth.currentUser,
        id,
        path
      );
    },

    async publishDraft(id) {
      if (!PRIVATE_DRAFT_PUBLICATION_ENABLED) {
        throw new Error(
          "Private draft publication is not enabled."
        );
      }

      throw new Error(
        "Publication workflow not implemented."
      );
    }
  };
}