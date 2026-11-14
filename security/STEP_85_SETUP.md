# Step 85 — isolated Firebase emulator setup (not production)

This directory contains an isolated emulator configuration and test scripts. **Do not run the tests until both full rules fixtures exist**:
- `security/firestore.rules.test`: exact supplied complete Cloud Firestore rules, with only the proposed `mrsWolfieFightDrafts` match inserted within `match /databases/{database}/documents`.
- `security/storage.rules.test`: exact supplied complete Firebase Storage rules, with only the proposed `mrs-wolfie-private-fight-drafts` match inserted within `match /b/{bucket}/o`.

The proposed snippets are in `security/proposed-mrs-wolfie-draft-rules.md`. Do not replace a full ruleset with a snippet. Review the full fixtures and confirm they reflect the *actual deployed* rules before relying on the results.

## Local prerequisites

Node.js, Java, Firebase CLI, and npm. Run in a separate terminal. **Do not use the existing production project or modify existing emulator processes.** The isolated project identifier is `demo-mrs-wolfie-draft-security`.

From the repository root:

```powershell
cd security
npm install
firebase emulators:start --only firestore,storage --project demo-mrs-wolfie-draft-security --config firebase.isolated.json
```

In a second terminal, from `security`:

```powershell
$env:FIRESTORE_EMULATOR_HOST = '127.0.0.1:18081'
$env:STORAGE_EMULATOR_HOST = '127.0.0.1:19498'
npm run test:firestore
npm run test:storage
```

Emulator ports deliberately differ from the previously used local profile-image isolation ports (Firestore 18080, Storage 19499). Confirm both new ports are free before starting. No production writes, deploys, or merges are authorised.

## Status

- [x] Isolated emulator configuration created.
- [x] Test dependency manifest created.
- [ ] Complete rules fixtures committed and reviewed.
- [ ] Tests executed against running emulators.
- [ ] Failures corrected, results captured.
- [ ] Production deployment separately approved.

**Caution:** Current test files are unexecuted and may require compatibility fixes before they pass. The `@firebase/rules-unit-testing` Storage API and emulator behaviour must be verified locally. Do not interpret the existence of tests as proof of access restrictions.
