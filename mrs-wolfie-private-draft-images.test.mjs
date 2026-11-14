import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("./mrs-wolfie-private-draft-images.js", "utf8");
const calls = [];
const stored = new Map();

const mocks = {
  ref: (_storage, path) => ({ fullPath: path }),
  uploadBytes: async (reference, file, metadata) => {
    calls.push({ op: "upload", path: reference.fullPath, file, metadata });
    stored.set(reference.fullPath, file);
    return { ref: reference };
  },
  getBlob: async reference => {
    calls.push({ op: "getBlob", path: reference.fullPath });
    if (!stored.has(reference.fullPath)) throw new Error("object-not-found");
    return stored.get(reference.fullPath);
  },
  deleteObject: async reference => {
    calls.push({ op: "delete", path: reference.fullPath });
    stored.delete(reference.fullPath);
  }
};

const executable = source
  .replace(/^import\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];/m, "")
  .replace(/^export\s+(?=(?:const|function|async function)\b)/gm, "");

const context = vm.createContext({
  ...mocks,
  Set,
  Number,
  String,
  Error,
  RegExp,
  crypto: { randomUUID: () => "12345678-1234-4234-8234-123456789abc" }
});
vm.runInContext(executable + `
  globalThis.imageApi = {
    uploadPrivateDraftImage,
    getPrivateDraftImageBlob,
    deletePrivateDraftImage,
    PRIVATE_IMAGE_PREFIX,
    MAX_IMAGE_SIZE
  };
`, context, { timeout: 1000 });

const api = context.imageApi;
const admin = { uid: "PRGa9TsCW0QDn1QtoUXyYjEi7YB3", isAnonymous: false };
const secondAdmin = { uid: "SlpEQYl94DaH6j42QUyl8Kv2ujJ3", isAnonymous: false };
const supporter = { uid: "ordinary-user", isAnonymous: false };
const storage = {};
const validDraftId = "draft_2027_001";
const validFile = { name: "fighter.jpg", type: "image/jpeg", size: 1024, bytes: "test-image" };

function pass(label) { console.log("PASS:", label); }

const fighterPath = await api.uploadPrivateDraftImage(storage, admin, validDraftId, "fighter", validFile);
assert.equal(fighterPath, "mrs-wolfie-private-fight-drafts/draft_2027_001/fighter-12345678-1234-4234-8234-123456789abc.jpg");
assert.equal(calls[0].metadata.contentType, "image/jpeg");
assert.equal(calls[0].metadata.customMetadata.draftId, validDraftId);
assert.equal(calls[0].metadata.customMetadata.imageKind, "fighter");
pass("Fighter image uploads to the isolated private Storage prefix");

const opponentPath = await api.uploadPrivateDraftImage(storage, secondAdmin, validDraftId, "opponent", { ...validFile, type: "image/png" });
assert.match(opponentPath, /\/opponent-[0-9a-f-]+\.png$/);
pass("Second authorised administrator can upload opponent image");

const blob = await api.getPrivateDraftImageBlob(storage, admin, validDraftId, fighterPath);
assert.equal(blob, validFile);
pass("Private image is retrieved as a Blob without a public download URL");

await api.deletePrivateDraftImage(storage, admin, validDraftId, fighterPath);
assert.equal(stored.has(fighterPath), false);
pass("Private image deletion uses the validated object path");

await assert.rejects(() => api.uploadPrivateDraftImage(storage, supporter, validDraftId, "fighter", validFile), /Authorised administrator/);
pass("Ordinary supporter cannot upload private images");

await assert.rejects(() => api.uploadPrivateDraftImage(storage, { ...admin, isAnonymous: true }, validDraftId, "fighter", validFile), /Authorised administrator/);
pass("Anonymous session cannot upload private images");

await assert.rejects(() => api.uploadPrivateDraftImage(storage, admin, "../public", "fighter", validFile), /Invalid private draft ID/);
pass("Path traversal draft ID rejected");

await assert.rejects(() => api.uploadPrivateDraftImage(storage, admin, validDraftId, "other", validFile), /Invalid image type/);
pass("Unsupported image category rejected");

await assert.rejects(() => api.uploadPrivateDraftImage(storage, admin, validDraftId, "fighter", { ...validFile, type: "image/gif" }), /Only JPG, PNG and WebP/);
pass("Unsupported MIME type rejected");

await assert.rejects(() => api.uploadPrivateDraftImage(storage, admin, validDraftId, "fighter", { ...validFile, size: 0 }), /larger than 0 bytes/);
pass("Empty image rejected");

await assert.rejects(() => api.uploadPrivateDraftImage(storage, admin, validDraftId, "fighter", { ...validFile, size: 8 * 1024 * 1024 + 1 }), /no more than 8 MB/);
pass("Image larger than 8 MB rejected");

await assert.rejects(() => api.getPrivateDraftImageBlob(storage, supporter, validDraftId, fighterPath), /Authorised administrator/);
pass("Ordinary supporter cannot retrieve private image");

await assert.rejects(() => api.getPrivateDraftImageBlob(storage, admin, "another-draft", fighterPath), /does not belong to the selected private draft/);
pass("Cross-draft image path rejected");

await assert.rejects(() => api.getPrivateDraftImageBlob(storage, admin, validDraftId, "mrs-wolfie-private-fight-drafts/" + validDraftId + "/fighter-not-a-uuid.jpg"), /Invalid private image filename/);
pass("Malformed private image filename rejected");

await assert.rejects(() => api.deletePrivateDraftImage(storage, admin, validDraftId, "fight-images/public.jpg"), /does not belong to the selected private draft/);
pass("Public fight-images path cannot be deleted through private image API");

assert.equal(api.PRIVATE_IMAGE_PREFIX, "mrs-wolfie-private-fight-drafts");
assert.equal(api.MAX_IMAGE_SIZE, 8 * 1024 * 1024);
assert.doesNotMatch(source, /getDownloadURL/);
pass("No public download-token URL API is used");

console.log("------------------------------------------");
console.log("ALL PRIVATE IMAGE MODULE TESTS PASSED");
console.log("MOCK STORAGE ONLY - NO FIREBASE NETWORK OPERATIONS");
