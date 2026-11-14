import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
  "./mrs-wolfie-private-draft-list.js",
  "utf8"
);

class MockElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.className = "";
    this.textContent = "";
    this.children = [];
    this.dataset = {};
    this.disabled = false;
    this.type = "";
  }

  append(...elements) {
    this.children.push(...elements);
  }

  replaceChildren(...elements) {
    this.children = [...elements];
  }

  querySelector(selector) {
    if (selector.startsWith(".")) {
      const className = selector.slice(1);

      if (this.className.split(/\s+/).includes(className)) {
        return this;
      }
    }

    for (const child of this.children) {
      const found = child.querySelector?.(selector);

      if (found) {
        return found;
      }
    }

    return null;
  }
}

const context = vm.createContext({
  document: {
    createElement(tag) {
      return new MockElement(tag);
    }
  },
  HTMLElement: MockElement,
  Date,
  Number,
  String
});

const executable = source
  .replaceAll("export function ", "function ");

vm.runInContext(
  executable,
  context,
  { timeout: 1000 }
);

function execute(expression) {
  return vm.runInContext(
    expression,
    context,
    { timeout: 1000 }
  );
}

function pass(message) {
  console.log("PASS:", message);
}

function collectText(element) {
  return [
    element.textContent,
    ...element.children.flatMap(collectText)
  ].join(" ");
}

function collectButtons(element) {
  const buttons = [];

  if (element.tagName === "BUTTON") {
    buttons.push(element);
  }

  for (const child of element.children) {
    buttons.push(...collectButtons(child));
  }

  return buttons;
}

console.log("");
console.log("PRIVATE DRAFT LIST FUNCTIONAL TESTS");
console.log("------------------------------------------");

const draft = {
  opponent: "Test Opponent",
  fightDate: "2027-03-27",
  promotion: "Test Promotion",
  event: "Test Event",
  venue: "Test Venue",
  fightType: "TITLE FIGHT",
  fightTitle: "Test Championship",
  fightStatus: "UPCOMING"
};

context.testDraft = draft;

const card = execute(
  "createPrivateDraftCard(testDraft)"
);

// TEST 1
assert.equal(card.tagName, "ARTICLE");
pass("Private draft card created");

// TEST 2
const cardText = collectText(card);

assert.match(cardText, /Test Opponent/);
assert.match(cardText, /Test Promotion/);
assert.match(cardText, /Test Venue/);
assert.match(cardText, /Test Championship/);

pass("Draft information displayed correctly");

// TEST 3
assert.match(cardText, /27 March 2027/);
pass("Fight date formatted correctly");

// TEST 4
const buttons = collectButtons(card);

assert.equal(buttons.length, 3);

assert.deepEqual(
  buttons.map(button => button.dataset.action),
  ["edit", "delete", "publish"]
);

pass("Edit, Delete and Publish controls created");

// TEST 5
assert.ok(
  buttons.every(button => button.disabled === true)
);

assert.ok(
  buttons.every(button => button.type === "button")
);

pass("All management controls disabled");

// TEST 6
const tbaCard = execute(
  'createPrivateDraftCard({ opponent: "" })'
);

assert.match(collectText(tbaCard), /TBA/);
pass("Unannounced opponent displays TBA");

// TEST 7
const unsafeText = '<script>alert("test")</script>';

context.unsafeDraft = {
  opponent: unsafeText
};

const unsafeCard = execute(
  "createPrivateDraftCard(unsafeDraft)"
);

assert.ok(
  collectText(unsafeCard).includes(unsafeText)
);

assert.equal(
  collectButtons(unsafeCard).length,
  3
);

pass("Untrusted text remains text content");

// TEST 8
assert.throws(
  () => execute("createPrivateDraftCard(null)"),
  /Invalid private draft/
);

pass("Invalid draft rejected");

// TEST 9
const container = new MockElement("div");
const list = new MockElement("div");

list.className = "private-draft-list";
container.append(list);

context.testContainer = container;

execute(
  "renderPrivateDraftList(testContainer, [])"
);

assert.match(
  collectText(container),
  /NO PRIVATE DRAFTS DISPLAYED/
);

pass("Empty draft list handled correctly");

// TEST 10
context.testDrafts = [draft];

execute(
  "renderPrivateDraftList(testContainer, testDrafts)"
);

assert.equal(list.children.length, 1);
assert.equal(list.children[0].tagName, "ARTICLE");

pass("Draft list renders supplied records");

// TEST 11
assert.throws(
  () => execute(
    'renderPrivateDraftList(testContainer, "invalid")'
  ),
  /Private drafts must be an array/
);

pass("Invalid draft collection rejected");

// TEST 12
assert.equal(
  execute("privateDraftListReady()"),
  false
);

pass("Private management actions remain disabled");

// TEST 13
assert.doesNotMatch(
  source,
  /from\s+["'][^"']*firebase/
);

assert.doesNotMatch(
  source,
  /innerHTML\s*=/
);

pass("No Firebase imports or innerHTML assignments");

console.log("------------------------------------------");
console.log("ALL 13 PRIVATE DRAFT LIST TESTS PASSED");
console.log("NO FIREBASE CONNECTIONS OR WRITES");