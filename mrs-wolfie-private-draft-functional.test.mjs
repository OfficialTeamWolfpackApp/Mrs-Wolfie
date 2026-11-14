import fs from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";

const source = fs.readFileSync(
  "./mrs-wolfie-private-draft-controller.js",
  "utf8"
);

const transformed = source
  .replace(
    /^import\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];/gm,
    ""
  )
  .replace(
    /^export\s+(?=(?:const|function)\b)/gm,
    ""
  );

const firebaseCalls = [];

const mockedFunctions = [
  "createPrivateDraft",
  "updatePrivateDraft",
  "getPrivateDraft",
  "loadPrivateDrafts",
  "deletePrivateDraft",
  "uploadPrivateDraftImage",
  "getPrivateDraftImageBlob",
  "deletePrivateDraftImage"
];

const mocks = Object.fromEntries(
  mockedFunctions.map(name => [
    name,
    () => {
      firebaseCalls.push(name);
      throw new Error(
        "Unexpected Firebase operation: " + name
      );
    }
  ])
);

const context = vm.createContext({
  ...mocks
});

vm.runInContext(
  transformed + `
    globalThis.testExports = {
      initialisePrivateDraftController,
      PRIVATE_DRAFT_WRITES_ENABLED,
      PRIVATE_DRAFT_PUBLICATION_ENABLED
    };
  `,
  context,
  { timeout: 1000 }
);

const {
  initialisePrivateDraftController,
  PRIVATE_DRAFT_WRITES_ENABLED,
  PRIVATE_DRAFT_PUBLICATION_ENABLED
} = context.testExports;

function pass(message) {
  console.log("PASS:", message);
}

async function expectBlocked(name, operation) {
  await assert.rejects(
    operation,
    /not enabled|not implemented/
  );

  pass(name);
}

console.log("");
console.log("FUNCTIONAL CONTROLLER TESTS");
console.log("------------------------------------------");

assert.equal(
  PRIVATE_DRAFT_WRITES_ENABLED,
  false
);

pass("Private draft writes disabled");

assert.equal(
  PRIVATE_DRAFT_PUBLICATION_ENABLED,
  false
);

pass("Publication disabled");

const saveButton = {
  disabled: false,
  textContent: ""
};

const draftList = {};

const controller = initialisePrivateDraftController({
  db: {},
  storage: {},
  auth: {
    currentUser: {
      uid: "LOCAL_TEST_ADMIN"
    }
  },
  saveButton,
  draftList
});

assert.equal(saveButton.disabled, true);

pass("Save Private Draft button automatically disabled");

assert.match(
  saveButton.textContent,
  /COMING SOON/
);

pass("Disabled button displays development status");

await expectBlocked(
  "Create draft blocked",
  () => controller.createDraft({})
);

await expectBlocked(
  "Update draft blocked",
  () => controller.updateDraft("test-id", {})
);

await expectBlocked(
  "Delete draft blocked",
  () => controller.deleteDraft("test-id")
);

await expectBlocked(
  "Private photograph upload blocked",
  () => controller.uploadImage(
    "test-id",
    "opponent",
    {}
  )
);

await expectBlocked(
  "Private photograph deletion blocked",
  () => controller.deleteImage(
    "test-id",
    "private-path"
  )
);

await expectBlocked(
  "Private photograph preview blocked",
  () => controller.getImage(
    "test-id",
    "private-path"
  )
);

await expectBlocked(
  "Private draft loading blocked",
  () => controller.loadDrafts()
);

await expectBlocked(
  "Publication blocked",
  () => controller.publishDraft("test-id")
);

assert.equal(
  firebaseCalls.length,
  0,
  "No Firebase functions should execute"
);

pass("Zero Firebase operations attempted");

console.log("------------------------------------------");
console.log("ALL FUNCTIONAL SAFEGUARD TESTS PASSED");
console.log("NO FIREBASE CONNECTIONS OR WRITES");