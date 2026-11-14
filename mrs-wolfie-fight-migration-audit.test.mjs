import test from "node:test";
import assert from "node:assert/strict";

import {
  mapMrsWolfieFight,
  buildMrsWolfieMigrationAudit
} from "./mrs-wolfie-fight-migration-audit.js";

test("maps Mrs Wolfie Firestore field names to Team Wolfpack schema", () => {
  const row = mapMrsWolfieFight("fight-1", {
    promotion: "SBF",
    event: "TITLE NIGHT",
    opponent: "KAYLEIGH GIBSON",
    type: "TITLE FIGHT",
    date: "2026-11-20",
    venue: "WALSALL",
    status: "UPCOMING",
    result: "",
    fightTitle: "LADIES SUPER MIDDLEWEIGHT NOVICE TITLE",
    ticketUrl: "https://example.test/tickets",
    fighterImage: "https://example.test/zoey.webp",
    opponentImage: "https://example.test/opponent.webp"
  });

  assert.equal(row.mapped.fighterId, "mrs-wolfie");
  assert.equal(row.mapped.fightDate, "2026-11-20");
  assert.equal(row.mapped.eventName, "TITLE NIGHT");
  assert.equal(row.mapped.fightType, "TITLE FIGHT");
  assert.equal(row.mapped.fightTitle, "LADIES SUPER MIDDLEWEIGHT NOVICE TITLE");
  assert.equal(row.mapped.opponentImage, "https://example.test/opponent.webp");
  assert.equal(row.decision, undefined);
});

test("keeps TBA dates and unknown opponents explicit", () => {
  const row = mapMrsWolfieFight("fight-tba", {
    promotion: "EBO",
    event: "FUTURE EVENT",
    opponent: "",
    date: "",
    status: "UPCOMING"
  });

  assert.equal(row.mapped.dateTba, true);
  assert.equal(row.mapped.fightAgreed, true);
  assert.equal(row.mapped.displayDate, "TBA");
  assert.equal(row.mapped.opponent, "TBA");
  assert.equal(row.mapped.dateTimestamp, null);
  assert.ok(row.reviewReasons.includes("OPPONENT_TBA"));
});

test("does not copy private or legacy public notes into mapped fight", () => {
  const row = mapMrsWolfieFight("fight-private", {
    promotion: "EBO",
    notes: "CONFIDENTIAL",
    adminNotes: "DO NOT COPY",
    privateNotes: "DO NOT COPY"
  });

  assert.equal("notes" in row.mapped, false);
  assert.equal("adminNotes" in row.mapped, false);
  assert.equal("privateNotes" in row.mapped, false);
  assert.equal(row.privateNotesExcluded, true);
});

test("marks an existing target ID as a duplicate hold", () => {
  const report = buildMrsWolfieMigrationAudit(
    [{
      id: "same-id",
      data: { promotion: "EBO", event: "NIGHT", opponent: "BOXER",
        date: "2026-12-01", venue: "ARENA", status: "UPCOMING" }
    }],
    {
      "same-id": {
        fighterId: "mrs-wolfie",
        promotion: "EBO",
        eventName: "NIGHT",
        opponent: "BOXER",
        fightDate: "2026-12-01"
      }
    }
  );

  assert.equal(report.mode, "READ_ONLY_DRY_RUN");
  assert.equal(report.heldForDuplicateReview, 1);
  assert.ok(report.rows[0].reviewReasons.includes("TARGET_ID_ALREADY_EXISTS"));
});

test("marks matching fight details under another ID as possible duplicate", () => {
  const report = buildMrsWolfieMigrationAudit(
    [{
      id: "firestore-id",
      data: { promotion: "EBO", event: "NIGHT", opponent: "BOXER",
        date: "2026-12-01", venue: "ARENA", status: "UPCOMING" }
    }],
    {
      "realtime-id": {
        fighterId: "mrs-wolfie",
        promotion: "EBO",
        eventName: "NIGHT",
        opponent: "BOXER",
        fightDate: "2026-12-01"
      }
    }
  );

  assert.equal(report.heldForDuplicateReview, 1);
  assert.ok(report.rows[0].reviewReasons.includes("POSSIBLE_EXISTING_DUPLICATE"));
});

test("ignores other fighters when checking target collisions", () => {
  const report = buildMrsWolfieMigrationAudit(
    [{
      id: "other-fighter-id",
      data: { promotion: "EBO", event: "NIGHT", opponent: "BOXER",
        date: "2026-12-01", venue: "ARENA", status: "UPCOMING" }
    }],
    {
      "other-fighter-id": {
        fighterId: "greig-sloan",
        promotion: "EBO",
        eventName: "NIGHT",
        opponent: "BOXER",
        fightDate: "2026-12-01"
      }
    }
  );

  assert.equal(report.heldForDuplicateReview, 0);
  assert.equal(report.readyForManualReview, 1);
});

test("holds completed fights with no result and unknown statuses", () => {
  const report = buildMrsWolfieMigrationAudit(
    [
      { id: "completed-no-result", data: { status: "COMPLETED" } },
      { id: "unknown-status", data: { status: "MAYBE" } }
    ],
    {}
  );

  assert.equal(report.heldForDataReview, 2);
  assert.ok(report.rows[0].reviewReasons.includes("COMPLETED_WITHOUT_RESULT"));
  assert.ok(report.rows[1].reviewReasons.includes("UNRECOGNISED_STATUS"));
});

test("does not mutate source Firestore or Realtime Database objects", () => {
  const source = Object.freeze({
    promotion: "EBO",
    event: "NIGHT",
    opponent: "BOXER",
    date: "2026-12-01",
    venue: "ARENA",
    status: "UPCOMING"
  });
  const target = Object.freeze({});
  const docs = Object.freeze([Object.freeze({ id: "f1", data: source })]);

  const report = buildMrsWolfieMigrationAudit(docs, target);
  assert.equal(report.sourceCount, 1);
  assert.equal(source.date, "2026-12-01");
  assert.equal(Object.keys(target).length, 0);
});
