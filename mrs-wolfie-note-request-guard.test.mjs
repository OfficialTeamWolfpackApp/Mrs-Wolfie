import assert from "node:assert/strict";
import test from "node:test";

import {
  createPrivateNoteRequestGuard
} from "./mrs-wolfie-note-request-guard.js";

test("Mrs Wolfie private note request safeguards", () => {

  const guard = createPrivateNoteRequestGuard();

  assert.equal(
    guard.getState().hasActiveRequest,
    false
  );

  console.log("PASS: No active request initially");

  const requestA1 = guard.begin("fight-a");

  assert.equal(
    guard.isCurrent(requestA1, "fight-a"),
    true
  );

  console.log("PASS: First fight request accepted");

  assert.equal(
    guard.isCurrent(requestA1, "fight-b"),
    false
  );

  console.log("PASS: Different editing ID rejected");

  const requestB = guard.begin("fight-b");

  assert.equal(
    guard.isCurrent(requestA1, "fight-a"),
    false
  );

  assert.equal(
    guard.isCurrent(requestB, "fight-b"),
    true
  );

  console.log("PASS: Switching fights invalidates old request");

  const requestA2 = guard.begin("fight-a");

  assert.equal(
    guard.isCurrent(requestA1, "fight-a"),
    false
  );

  assert.equal(
    guard.isCurrent(requestA2, "fight-a"),
    true
  );

  console.log("PASS: Returning to same fight rejects old request");

  const requestA3 = guard.begin("fight-a");

  assert.equal(
    guard.isCurrent(requestA2, "fight-a"),
    false
  );

  assert.equal(
    guard.isCurrent(requestA3, "fight-a"),
    true
  );

  console.log("PASS: Repeated requests invalidate earlier requests");

  guard.invalidate();

  assert.equal(
    guard.isCurrent(requestA3, "fight-a"),
    false
  );

  assert.equal(
    guard.getState().hasActiveRequest,
    false
  );

  console.log("PASS: Reset invalidates active request");

  assert.equal(
    guard.isCurrent(null, "fight-a"),
    false
  );

  assert.equal(
    guard.isCurrent({}, "fight-a"),
    false
  );

  console.log("PASS: Invalid request tokens rejected");

  assert.throws(
    () => guard.begin(""),
    /A valid fight ID is required/
  );

  assert.throws(
    () => guard.begin(null),
    /A valid fight ID is required/
  );

  console.log("PASS: Invalid fight IDs rejected");

  const newRequest = guard.begin("fight-c");

  const fakeRequest = {
    fightId: "fight-c",
    generation: newRequest.generation
  };

  assert.equal(
    guard.isCurrent(fakeRequest, "fight-c"),
    false
  );

  console.log("PASS: Forged request token rejected");

  const secondGuard = createPrivateNoteRequestGuard();

  const independentRequest = secondGuard.begin("fight-c");

  assert.equal(
    secondGuard.isCurrent(independentRequest, "fight-c"),
    true
  );

  assert.equal(
    guard.isCurrent(independentRequest, "fight-c"),
    false
  );

  console.log("PASS: Independent guards remain isolated");

  const state = guard.getState();

  assert.equal(
    Object.isFrozen(state),
    true
  );

  console.log("PASS: Request state snapshot is immutable");

  console.log("------------------------------------------");
  console.log("ALL PRIVATE NOTE REQUEST TESTS PASSED");
  console.log("NO FIREBASE CONNECTIONS OR WRITES");
});