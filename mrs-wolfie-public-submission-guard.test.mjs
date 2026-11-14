import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createFightEditorModeManager } from "./mrs-wolfie-editor-mode.js";

const html = fs.readFileSync(
  "./mrs-wolfie-fights-admin.html",
  "utf8"
);

const modeMatch = html.match(
  /const PRIVATE_DRAFT_MODE_ENABLED = false;[\s\S]*?function preparePrivateDraftFromForm\(\)/
);

assert.ok(
  modeMatch,
  "Private Draft Mode protection must exist."
);

const modeSource = modeMatch[0].replace(
  /function preparePrivateDraftFromForm\(\)$/,
  ""
);

const guardMatch = html.match(
  /\/\* PRIVATE DRAFT PUBLIC SUBMISSION GUARD \*\/[\s\S]*?^\s*\}/m
);

assert.ok(
  guardMatch,
  "Public submission guard must exist."
);

const guardSource = guardMatch[0];

function createEnvironment(mode) {
  const messages = [];
  const warnings = [];

  const context = vm.createContext({
    createFightEditorModeManager: (options) => {
      const requestedEnabled = options?.privateModeEnabled === true;

      return createFightEditorModeManager({
        privateModeEnabled: requestedEnabled || mode === "PRIVATE"
      });
    },
    console: {
      warn(message) {
        warnings.push(message);
      }
    },
    showMessage(message, type) {
      messages.push({ message, type });
    }
  });

  vm.runInContext(
    modeSource,
    context,
    { timeout: 1000 }
  );

  if (mode === "PRIVATE") {
    vm.runInContext(
      'setFightEditorMode("PRIVATE");',
      context,
      { timeout: 1000 }
    );
  }

  const result = vm.runInContext(
    `
    (() => {
      let reachedPublicWorkflow = false;

      function simulateSubmit() {
        ${guardSource}

        reachedPublicWorkflow = true;
      }

      simulateSubmit();

      return {
        reachedPublicWorkflow,
        mode: fightEditorModeManager.getMode()
      };
    })()
    `,
    context,
    { timeout: 1000 }
  );

  return {
    result,
    messages,
    warnings
  };
}

function pass(message) {
  console.log("PASS:", message);
}

console.log("");
console.log("PUBLIC SUBMISSION GUARD TESTS");
console.log("------------------------------------------");

// 1. Public mode remains the default.
const publicEnvironment = createEnvironment("PUBLIC");

assert.equal(
  publicEnvironment.result.mode,
  "PUBLIC"
);

pass("Public Mode is the default");

// 2. Public Mode is not blocked by the guard.
assert.equal(
  publicEnvironment.result.reachedPublicWorkflow,
  true
);

pass("Public submission continues in Public Mode");

// 3. Private Mode blocks public submission.
const privateEnvironment = createEnvironment("PRIVATE");

assert.equal(
  privateEnvironment.result.reachedPublicWorkflow,
  false
);

pass("Private Mode blocks public submission");

// 4. Private Mode displays an error.
assert.equal(
  privateEnvironment.messages.length,
  1
);

assert.match(
  privateEnvironment.messages[0].message,
  /PUBLIC SUBMISSION BLOCKED/
);

pass("Private Mode displays blocking message");

// 5. Private Mode logs a warning.
assert.equal(
  privateEnvironment.warnings.length,
  1
);

pass("Private Mode logs warning");

// 6. Public Mode displays no blocking message.
assert.equal(
  publicEnvironment.messages.length,
  0
);

pass("Public Mode displays no blocking error");

// 7. Private Mode remains disabled in configuration.
assert.match(
  modeSource,
  /PRIVATE_DRAFT_MODE_ENABLED = false/
);

pass("Private Draft Mode remains disabled");

// 8. Public submission guard exists exactly once.
const guardCount = (
  html.match(
    /\/\* PRIVATE DRAFT PUBLIC SUBMISSION GUARD \*\//g
  ) ?? []
).length;

assert.equal(guardCount, 1);

pass("Submission guard installed exactly once");

console.log("------------------------------------------");
console.log("ALL 8 SUBMISSION GUARD TESTS PASSED");
console.log("NO FIREBASE CONNECTIONS OR WRITES");