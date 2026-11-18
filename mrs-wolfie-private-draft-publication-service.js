/*
  MRS WOLFIE - CONTROLLED FIGHT PUBLICATION

  Transaction adapter is injected.
  No Firebase SDK imports.
  No direct Firebase connection.
  No automatic publication.

  Production use requires:
  - Verified Firebase authentication
  - Enforced Firestore Security Rules
  - Approved public image handling
  - Emulator integration testing
*/

import {
  convertPrivateDraftToPublicFight
} from "./mrs-wolfie-private-draft-public-converter.js";

const ADMIN_UIDS = new Set([
  "PRGa9TsCW0QDn1QtoUXyYjEi7YB3",
  "SlpEQYl94DaH6j42QUyl8Kv2ujJ3"
]);

const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

function requireAdmin(user) {
  if (
    !user ||
    user.isAnonymous ||
    typeof user.uid !== "string" ||
    !ADMIN_UIDS.has(user.uid)
  ) {
    throw new Error("Authorised administrator required.");
  }
}

function requireDraftId(draftId) {
  if (
    typeof draftId !== "string" ||
    !ID_PATTERN.test(draftId)
  ) {
    throw new Error("Invalid private draft ID.");
  }
}

function requireAdapter(adapter) {
  if (
    !adapter ||
    typeof adapter.runTransaction !== "function" ||
    typeof adapter.getDraft !== "function" ||
    typeof adapter.getPublicFight !== "function" ||
    typeof adapter.setPublicFight !== "function" ||
    typeof adapter.markDraftPublished !== "function"
  ) {
    throw new Error("Valid publication adapter required.");
  }
}

/*
  This service deliberately uses the same document ID
  for the private draft and its corresponding public fight.

  That provides a deterministic publication destination
  and prevents accidental duplicate IDs.

  The adapter must implement a genuine atomic transaction
  before production use.
*/

export async function publishPrivateFightDraft({
  user,
  draftId,
  adapter,
  preparedImages = null,
  publicationEnabled = false
}) {

  if (publicationEnabled !== true) {
    throw new Error("Private draft publication is disabled.");
  }

  requireAdmin(user);
  requireDraftId(draftId);
  requireAdapter(adapter);

  return adapter.runTransaction(async transaction => {

    const draft = await adapter.getDraft(
      transaction,
      draftId
    );

    if (!draft) {
      throw new Error("Private draft not found.");
    }

    if (draft.draftStatus !== "DRAFT") {
      throw new Error("Draft has already been published.");
    }

    const existingPublicFight =
      await adapter.getPublicFight(
        transaction,
        draftId
      );

    if (existingPublicFight) {
      throw new Error(
        "Public fight already exists for this draft."
      );
    }

    const publicFight =
      convertPrivateDraftToPublicFight(draft);

    if (!publicFight.event.trim()) {
      throw new Error(
        "A public fight requires an event name."
      );
    }

    /*
      Private images must be resolved separately.

      Refuse publication if private image paths exist
      but have not been processed.

      This prevents accidentally publishing fights
      without their expected approved images.
    */

    /*
      Public image references are accepted only when
      they correspond to the current private draft.

      The preparation process must complete before
      entering the Firestore transaction.
    */

    const imageFields = [
      {
        kind: "fighter",
        privatePath: draft.fighterImagePath,
        publicField: "fighterImage"
      },
      {
        kind: "opponent",
        privatePath: draft.opponentImagePath,
        publicField: "opponentImage"
      }
    ];

    for (const image of imageFields) {
      const prepared = preparedImages?.[image.kind];

      if (image.privatePath) {
        if (
          !prepared ||
          prepared.privateImagePath !== image.privatePath ||
          typeof prepared.publicUrl !== "string" ||
          !prepared.publicUrl.trim()
        ) {
          throw new Error(
            "Private draft images require matching public image preparation."
          );
        }

        publicFight[image.publicField] = prepared.publicUrl;
      } else if (prepared) {
        throw new Error(
          "Unexpected prepared image for a draft without that image."
        );
      }
    }

    /*
      Read operations above must finish before writes.
      The adapter must ensure both writes are atomic.
    */

    await adapter.setPublicFight(
      transaction,
      draftId,
      publicFight
    );

    await adapter.markDraftPublished(
      transaction,
      draftId,
      {
        draftStatus: "PUBLISHED",
        publishedFightId: draftId,
        publishedBy: user.uid
      }
    );

    return {
      published: true,
      draftId,
      publicFightId: draftId,
      publicFight
    };
  });
}