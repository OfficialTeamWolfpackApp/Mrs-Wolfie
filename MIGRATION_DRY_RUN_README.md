# Mrs Wolfie Fight Migration — Read-only Dry-run Mapper

This branch contains a pure JavaScript mapping and audit module for planning the move from the Firestore `mrsWolfieFights` collection to the Team Wolfpack Realtime Database `/fights` path.

## Safety boundary

- No Firebase SDK imports.
- No network access.
- No Firestore or Realtime Database writes.
- No Storage operations.
- Private admin-note collections are not read or mapped.
- The mapper returns a preview and duplicate/review flags only.

## Field mapping

- `date` → `fightDate`
- `event` → `eventName`
- `type` → `fightType`
- `dateEnd` → `dateEnd`
- `result` → `result`
- `method` / `resultMethod` → `method`
- `fightTitle` → `fightTitle`
- `fighterImage`, `opponentImage`, `ticketUrl` → same names
- Adds `fighterId: "mrs-wolfie"`, `fighterName`, `fighterProfile`, and `team`.

Every mapped row is flagged for manual review. Matching IDs and matching fight fingerprints are held for duplicate review. Missing or inconsistent data is held for data review.

## Run tests

```powershell
node --test .\mrs-wolfie-fight-migration-audit.test.mjs
```

This tests the mapping logic against synthetic fixtures only. It is not a live-data audit and must not be described as a production migration dry-run until read-only snapshots of both databases have been supplied and checked.
