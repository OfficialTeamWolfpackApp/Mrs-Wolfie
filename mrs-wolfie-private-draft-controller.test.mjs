import fs from "node:fs";
import assert from "node:assert/strict";

const source = fs.readFileSync(
  "./mrs-wolfie-private-draft-controller.js",
  "utf8"
);

console.log("PRIVATE DRAFT CONTROLLER SAFEGUARDS");
console.log("------------------------------------------");

function check(name, condition) {
  assert.ok(condition, name);
  console.log("PASS:", name);
}

check(
  "Private draft writes disabled",
  source.includes(
    "PRIVATE_DRAFT_WRITES_ENABLED = false"
  )
);

check(
  "Publication disabled",
  source.includes(
    "PRIVATE_DRAFT_PUBLICATION_ENABLED = false"
  )
);

check(
  "Save button disabled",
  source.includes("saveButton.disabled = true")
);

check(
  "Create draft guarded",
  /async createDraft[\s\S]*?requireDraftWritesEnabled/.test(
    source
  )
);

check(
  "Update draft guarded",
  /async updateDraft[\s\S]*?requireDraftWritesEnabled/.test(
    source
  )
);

check(
  "Delete draft guarded",
  /async deleteDraft[\s\S]*?requireDraftWritesEnabled/.test(
    source
  )
);

check(
  "Image upload guarded",
  /async uploadImage[\s\S]*?requireDraftWritesEnabled/.test(
    source
  )
);

check(
  "Draft loading blocked",
  source.includes(
    "Private draft loading is not enabled."
  )
);

check(
  "Publication not implemented",
  source.includes(
    "Publication workflow not implemented."
  )
);

console.log("------------------------------------------");
console.log("ALL STATIC SAFEGUARD CHECKS PASSED");
console.log("NO FIREBASE OPERATIONS EXECUTED");