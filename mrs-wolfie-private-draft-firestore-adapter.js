/*
  MRS WOLFIE - FIRESTORE PUBLICATION ADAPTER

  Provides real Firestore transaction operations.

  This module does not execute a transaction
  until explicitly called by the publication service.

  Production use requires:
  - Approved Firestore Security Rules
  - Verified administrator authentication
  - Isolated emulator testing
  - Public image preparation
*/

import {
  doc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const PRIVATE_COLLECTION = "mrsWolfieFightDrafts";
const PUBLIC_COLLECTION = "mrsWolfieFights";

export function createFirestorePublicationAdapter(db) {

  if (!db) {
    throw new Error("Firestore instance required.");
  }

  function draftRef(id) {
    return doc(db, PRIVATE_COLLECTION, id);
  }

  function publicRef(id) {
    return doc(db, PUBLIC_COLLECTION, id);
  }

  return {

    runTransaction(callback) {
      return runTransaction(
        db,
        transaction => callback(transaction)
      );
    },

    async getDraft(transaction, id) {
      const snapshot = await transaction.get(
        draftRef(id)
      );

      if (!snapshot.exists()) {
        return null;
      }

      return {
        id: snapshot.id,
        ...snapshot.data()
      };
    },

    async getPublicFight(transaction, id) {
      const snapshot = await transaction.get(
        publicRef(id)
      );

      if (!snapshot.exists()) {
        return null;
      }

      return {
        id: snapshot.id,
        ...snapshot.data()
      };
    },

    setPublicFight(transaction, id, data) {
      transaction.set(
        publicRef(id),
        {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      );
    },

    markDraftPublished(transaction, id, data) {
      transaction.update(
        draftRef(id),
        {
          ...data,
          publishedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      );
    }

  };
}