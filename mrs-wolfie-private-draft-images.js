/*
=========================================================
MRS WOLFIE - PRIVATE DRAFT IMAGE MANAGEMENT
=========================================================

Private Storage:
mrs-wolfie-private-fight-drafts/{fightId}/{fileName}

No public download-token URLs are generated.

This module is not connected to the admin dashboard.
=========================================================
*/

import {
  ref,
  uploadBytes,
  getBlob,
  deleteObject
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

export const PRIVATE_IMAGE_PREFIX =
  "mrs-wolfie-private-fight-drafts";

export const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const ADMIN_UIDS = new Set([
  "PRGa9TsCW0QDn1QtoUXyYjEi7YB3",
  "SlpEQYl94DaH6j42QUyl8Kv2ujJ3"
]);

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

function validateDraftId(draftId) {
  if (
    typeof draftId !== "string" ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(draftId)
  ) {
    throw new Error("Invalid private draft ID.");
  }
}

function validateImage(file) {
  if (!file) {
    throw new Error("An image file is required.");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(
      "Only JPG, PNG and WebP images are supported."
    );
  }

  if (
    !Number.isFinite(file.size) ||
    file.size <= 0 ||
    file.size > MAX_IMAGE_SIZE
  ) {
    throw new Error(
      "Image must be larger than 0 bytes and no more than 8 MB."
    );
  }
}

function validateImageKind(kind) {
  if (!["fighter", "opponent"].includes(kind)) {
    throw new Error("Invalid image type.");
  }
}

function validatePrivatePath(draftId, path) {
  validateDraftId(draftId);

  if (typeof path !== "string") {
    throw new Error("Invalid private image path.");
  }

  const prefix =
    PRIVATE_IMAGE_PREFIX + "/" + draftId + "/";

  if (!path.startsWith(prefix)) {
    throw new Error(
      "Image does not belong to the selected private draft."
    );
  }

  const filename = path.slice(prefix.length);

  if (
    !/^(fighter|opponent)-[a-f0-9-]{36}\.(jpg|png|webp)$/.test(
      filename
    )
  ) {
    throw new Error("Invalid private image filename.");
  }

  return path;
}

export async function uploadPrivateDraftImage(
  storage,
  user,
  draftId,
  kind,
  file
) {
  requireAdmin(user);
  validateDraftId(draftId);
  validateImageKind(kind);
  validateImage(file);

  if (!storage) {
    throw new Error("Firebase Storage instance required.");
  }

  const extension =
    file.type === "image/jpeg"
      ? "jpg"
      : file.type === "image/png"
        ? "png"
        : "webp";

  const filename =
    kind + "-" + crypto.randomUUID() + "." + extension;

  const path =
    PRIVATE_IMAGE_PREFIX +
    "/" +
    draftId +
    "/" +
    filename;

  const destination = ref(storage, path);

  await uploadBytes(destination, file, {
    contentType: file.type,
    customMetadata: {
      draftId,
      imageKind: kind
    }
  });

  // Return the Storage path, never a download-token URL.
  return path;
}

export async function getPrivateDraftImageBlob(
  storage,
  user,
  draftId,
  path
) {
  requireAdmin(user);

  if (!storage) {
    throw new Error("Firebase Storage instance required.");
  }

  const safePath = validatePrivatePath(draftId, path);

  return getBlob(ref(storage, safePath));
}

export async function deletePrivateDraftImage(
  storage,
  user,
  draftId,
  path
) {
  requireAdmin(user);

  if (!storage) {
    throw new Error("Firebase Storage instance required.");
  }

  const safePath = validatePrivatePath(draftId, path);

  await deleteObject(ref(storage, safePath));

  return true;
}

/*
  For secure image previews:

  const blob = await getPrivateDraftImageBlob(...);
  const url = URL.createObjectURL(blob);

  Set the image element's src to the object URL.

  Call URL.revokeObjectURL(url) when the preview
  is no longer required.

  Never use getDownloadURL() for private draft images.
*/