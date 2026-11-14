import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("./mrs-wolfie-private-drafts.js", "utf8");

const writes = [];
let existingDraft = {
  draftStatus: "DRAFT",
  fightDate: "2027-03-27",
  fightStatus: "UPCOMING"
};

const mocks = {
  collection: (_db, name) => ({ name }),
  doc: (parent, id) => ({ parent, id: id || "generated-draft-id" }),
  getDoc: async () => ({
    exists: () => Boolean(existingDraft),
    data: () => existingDraft
  }),
  getDocs: async () => ({ docs: [] }),
  setDoc: async (ref, data) => writes.push({ op: "set", ref, data }),
  updateDoc: async (ref, data) => writes.push({ op: "update", ref, data }),
  deleteDoc: async ref => writes.push({ op: "delete", ref }),
  serverTimestamp: () => "SERVER_TIMESTAMP"
};

const executable = source
  .replace(/^import\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];/m, "")
  .replace(/^export\s+(?=(?:async\s+function|const|function)\b)/gm, "");

const context = vm.createContext({ ...mocks, Set, Object, Array, String, Error });
vm.runInContext(executable + `
  globalThis.testApi = {
    createPrivateDraft,
    updatePrivateDraft,
    deletePrivateDraft,
    loadPrivateDrafts
  };
`, context, { timeout: 1000 });

const api = context.testApi;
const db = {};
const admin = { uid: "PRGa9TsCW0QDn1QtoUXyYjEi7YB3", isAnonymous: false };
const nonAdmin = { uid: "NOT_AN_ADMIN", isAnonymous: false };

const formData = {
  promotion: "Test Promotion",
  event: "Confidential Event",
  opponent: "Secret Opponent",
  fightType: "TITLE FIGHT",
  fightDate: "2027-03-27",
  endDate: "",
  displayDate: "27 MARCH 2027",
  resultMethod: "",
  fightTitle: "Private Championship",
  venue: "Confidential Venue",
  ticketUrl: "",
  fightStatus: "UPCOMING",
  fightResult: "",
  notes: "Confidential admin note",
  fighterImagePath: "mrs-wolfie-private-fight-drafts/generated-draft-id/fighter-12345678-1234-1234-1234-123456789012.jpg",
  opponentImagePath: "mrs-wolfie-private-fight-drafts/generated-draft-id/opponent-12345678-1234-1234-1234-123456789012.png"
};

function pass(label) {
  console.log("PASS:", label);
}

const id = await api.createPrivateDraft(db, admin, formData);
assert.equal(id, "generated-draft-id");
assert.equal(writes.length, 1);
assert.equal(writes[0].data.fightDate, formData.fightDate);
assert.equal(writes[0].data.fightType, formData.fightType);
assert.equal(writes[0].data.fightStatus, formData.fightStatus);
assert.equal(writes[0].data.fightResult, "");
assert.equal(writes[0].data.fighterImagePath, formData.fighterImagePath);
assert.equal(writes[0].data.opponentImagePath, formData.opponentImagePath);
assert.equal(writes[0].data.notes, formData.notes);
assert.equal(writes[0].data.draftStatus, "DRAFT");
pass("Create preserves the exact private fight-form schema");

assert.equal(writes[0].data.date, undefined);
assert.equal(writes[0].data.status, undefined);
assert.equal(writes[0].data.type, undefined);
pass("Legacy mismatched field names are not written");

await assert.rejects(
  () => api.createPrivateDraft(db, nonAdmin, formData),
  /Authorised administrator/
);
pass("Non-admin draft creation rejected");

await assert.rejects(
  () => api.createPrivateDraft(db, admin, {
    ...formData,
    fightDate: "2027-03-27",
    endDate: "2027-03-26"
  }),
  /end date cannot be earlier/
);
pass("Invalid fight date range rejected");

await assert.rejects(
  () => api.createPrivateDraft(db, admin, {
    ...formData,
    fightDate: "",
    endDate: "2027-03-27"
  }),
  /start date is required/
);
pass("End date without start date rejected");

await assert.rejects(
  () => api.createPrivateDraft(db, admin, {
    ...formData,
    fightStatus: "COMPLETED",
    fightResult: ""
  }),
  /requires a valid result/
);
pass("Completed draft without result rejected");

await assert.rejects(
  () => api.createPrivateDraft(db, admin, {
    ...formData,
    fightStatus: "UPCOMING",
    fightResult: "W"
  }),
  /require COMPLETED status/
);
pass("Result on a non-completed draft rejected");

await api.updatePrivateDraft(db, admin, "draft-123", {
  ...formData,
  opponent: "Updated Secret Opponent"
});
assert.equal(writes.at(-1).op, "update");
assert.equal(writes.at(-1).data.opponent, "Updated Secret Opponent");
pass("Update accepts and preserves the same form schema");

existingDraft = { draftStatus: "PUBLISHED" };
await assert.rejects(
  () => api.updatePrivateDraft(db, admin, "draft-123", formData),
  /Only unpublished drafts/
);
pass("Published draft cannot be edited as a draft");

existingDraft = { draftStatus: "PUBLISHED" };
await assert.rejects(
  () => api.deletePrivateDraft(db, admin, "draft-123"),
  /Published records cannot be deleted/
);
pass("Published record cannot be deleted through draft deletion");

console.log("------------------------------------------");
console.log("ALL PRIVATE DRAFT DATA-CONTRACT TESTS PASSED");
console.log("NO REAL FIREBASE CONNECTIONS OR WRITES");
