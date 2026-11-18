/*
=========================================================
MRS WOLFIE - PRIVATE DRAFT LIST INTEGRATION
=========================================================

Development module.

Private loading remains disabled in the controller.

This module does not:
- enable private mode
- modify public fights
- save private drafts
- publish private drafts
- change Firebase security rules
=========================================================
*/

import {
  renderPrivateDraftList
} from "./mrs-wolfie-private-draft-list.js";

export async function refreshPrivateDraftList({
  controller,
  container
}) {

  if (!controller || typeof controller.loadDrafts !== "function") {
    throw new Error(
      "Private draft controller is unavailable."
    );
  }

  if (!container) {
    throw new Error(
      "Private draft list container is unavailable."
    );
  }

  const list = container.querySelector(
    ".private-draft-list"
  );

  if (!list) {
    throw new Error(
      "Private draft list element is missing."
    );
  }

  list.textContent = "Loading private fight drafts...";

  try {

    const drafts = await controller.loadDrafts();

    if (!Array.isArray(drafts)) {
      throw new Error(
        "Private draft loading returned invalid data."
      );
    }

    renderPrivateDraftList(
      container,
      drafts
    );

    return drafts;

  }
  catch (error) {

    list.textContent =
      "Private fight drafts are unavailable.";

    throw error;

  }

}