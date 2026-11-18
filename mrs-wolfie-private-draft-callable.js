/*
 * Mrs Wolfie private fight publication — callable transport only.
 * This module never writes directly to public Firestore collections.
 * The server must enforce authentication, authorization, and publication safety.
 * All UI feature flags remain disabled until backend integration is verified.
 */
import {
  httpsCallable
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";

const DRAFT_ID = /^[A-Za-z0-9_-]{1,128}$/;

export async function publishPrivateDraftViaCallable({
  functions,
  user,
  draftId,
  publicationEnabled = false
}) {
  if (publicationEnabled !== true) {
    throw new Error("Private draft publication is disabled.");
  }
  if (!functions) {
    throw new Error("Firebase Functions instance required.");
  }
  if (!user || user.isAnonymous || !user.uid) {
    throw new Error("Administrator sign-in required.");
  }
  if (typeof draftId !== "string" || !DRAFT_ID.test(draftId)) {
    throw new Error("Invalid private draft ID.");
  }
  // The server must perform all admin authorization and data validation.
  const callable = httpsCallable(functions, "publishMrsWolfiePrivateFight");
  const response = await callable({ draftId });
  return response.data;
}
