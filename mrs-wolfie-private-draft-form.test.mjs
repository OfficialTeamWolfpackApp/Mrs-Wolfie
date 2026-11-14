import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
  "./mrs-wolfie-private-draft-form.js",
  "utf8"
);

const transformed = source.replace(
  /^export\s+(?=function\b)/gm,
  ""
);

const context = vm.createContext({});

vm.runInContext(
  transformed + `
    globalThis.testExports = {
      collectPrivateDraftForm,
      populatePrivateDraftForm
    };
  `,
  context,
  { timeout: 1000 }
);

const {
  collectPrivateDraftForm,
  populatePrivateDraftForm
} = context.testExports;

const defaults = {
  promotion: "Private Promotion",
  event: "Confidential Fight Night",
  opponent: "Secret Opponent",
  fightType: "TITLE FIGHT",
  fightDate: "2027-03-27",
  endDate: "",
  displayDate: "27 March 2027",
  resultMethod: "",
  fightTitle: "Private Championship",
  venue: "Confidential Venue",
  ticketUrl: "",
  fightStatus: "UPCOMING",
  fightResult: "",
  notes: "Private administrator information"
};

function makeDocument(overrides = {}, images = {}) {
  const values = {
    ...defaults,
    ...overrides
  };

  const elements = {};

  for (const [id, value] of Object.entries(values)) {
    elements[id] = { value };
  }

  elements.fighterImageUpload = {
    value: "",
    files: images.fighter ? [images.fighter] : []
  };

  elements.opponentImageUpload = {
    value: "",
    files: images.opponent ? [images.opponent] : []
  };

  return {
    elements,
    getElementById(id) {
      return elements[id] ?? null;
    }
  };
}

function pass(message) {
  console.log("PASS:", message);
}

console.log("");
console.log("PRIVATE DRAFT FORM FUNCTIONAL TESTS");
console.log("------------------------------------------");

// 1. Collect complete draft information.
const documentOne = makeDocument();

const collected = collectPrivateDraftForm(documentOne);

assert.equal(
  collected.data.opponent,
  "Secret Opponent"
);

assert.equal(
  collected.data.fightTitle,
  "Private Championship"
);

assert.equal(
  collected.data.venue,
  "Confidential Venue"
);

pass("Confidential fight details collected");

// 2. Empty opponents become TBA.
const tba = collectPrivateDraftForm(
  makeDocument({ opponent: "" })
);

assert.equal(tba.data.opponent, "TBA");

pass("Empty opponent becomes TBA");

// 3. End date cannot precede start date.
assert.throws(
  () => collectPrivateDraftForm(
    makeDocument({
      fightDate: "2027-03-27",
      endDate: "2027-03-26"
    })
  ),
  /end date cannot precede/
);

pass("Invalid date range rejected");

// 4. End date requires a start date.
assert.throws(
  () => collectPrivateDraftForm(
    makeDocument({
      fightDate: "",
      endDate: "2027-03-27"
    })
  ),
  /start date is required/
);

pass("End date without start date rejected");

// 5. Completed fights require a result.
assert.throws(
  () => collectPrivateDraftForm(
    makeDocument({
      fightStatus: "COMPLETED",
      fightResult: ""
    })
  ),
  /requires a valid result/
);

pass("Completed fight without result rejected");

// 6. Results require completed status.
assert.throws(
  () => collectPrivateDraftForm(
    makeDocument({
      fightStatus: "UPCOMING",
      fightResult: "W"
    })
  ),
  /require COMPLETED status/
);

pass("Result on upcoming fight rejected");

// 7. Photographs remain separate from draft data.
const fighterFile = {
  name: "fighter.jpg",
  type: "image/jpeg",
  size: 1024
};

const opponentFile = {
  name: "opponent.png",
  type: "image/png",
  size: 2048
};

const withImages = collectPrivateDraftForm(
  makeDocument({}, {
    fighter: fighterFile,
    opponent: opponentFile
  })
);

assert.equal(
  withImages.images.fighter,
  fighterFile
);

assert.equal(
  withImages.images.opponent,
  opponentFile
);

assert.equal(
  Object.hasOwn(withImages.data, "images"),
  false
);

pass("Photographs kept separate from Firestore data");

// 8. Populate the form from an existing draft.
const documentTwo = makeDocument({
  opponent: "",
  fightTitle: ""
});

populatePrivateDraftForm(
  documentTwo,
  collected.data
);

assert.equal(
  documentTwo.elements.opponent.value,
  "Secret Opponent"
);

assert.equal(
  documentTwo.elements.fightTitle.value,
  "Private Championship"
);

pass("Existing private draft populates form");

// 9. File inputs are cleared when loading a draft.
assert.equal(
  documentTwo.elements.fighterImageUpload.value,
  ""
);

assert.equal(
  documentTwo.elements.opponentImageUpload.value,
  ""
);

pass("File inputs cleared when loading draft");

// 10. Missing required form elements are rejected.
const brokenDocument = makeDocument();

delete brokenDocument.elements.promotion;

assert.throws(
  () => collectPrivateDraftForm(brokenDocument),
  /Missing fight form element/
);

pass("Missing form elements rejected");

console.log("------------------------------------------");
console.log("ALL 10 FUNCTIONAL FORM TESTS PASSED");
console.log("NO FIREBASE CONNECTIONS OR WRITES");