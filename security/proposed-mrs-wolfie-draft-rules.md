# Step 82 — PROPOSED RULE PATCHES ONLY (NOT DEPLOYABLE AS STANDALONE RULESETS)

These snippets are based on the Firebase Firestore and Storage rules supplied on 14 November 2026. They are NOT active rules and must NOT be pasted over an entire existing ruleset. The supplied source is not independently verified as the deployed rules.

## Firestore addition

Insert inside the existing `service cloud.firestore { match /databases/{database}/documents { ... } }`, alongside `mrsWolfieFightAdminNotes`. Reuse the existing `isAdmin()` function:

```javascript
/* MRS WOLFIE PRIVATE FIGHT DRAFTS */
match /mrsWolfieFightDrafts/{fightId} {
  allow get, list, create, update, delete: if isAdmin();
}
```

Keep `mrsWolfieFights` publicly readable, `mrsWolfieFightAdminNotes` admin-only, and the default deny-all rule unchanged. The new collection is not referenced by the existing public clients.

## Storage addition

Insert inside the existing `service firebase.storage { match /b/{bucket}/o { ... } }`:

```javascript
/* MRS WOLFIE PRIVATE FIGHT DRAFT PHOTOS */
match /mrs-wolfie-private-fight-drafts/{fightId}/{fileName} {
  allow read, delete: if request.auth != null
    && request.auth.uid in [
      'PRGa9TsCW0QDn1QtoUXyYjEi7YB3',
      'SlpEQYl94DaH6j42QUyl8Kv2ujJ3'
    ];
  allow create, update: if request.auth != null
    && request.auth.uid in [
      'PRGa9TsCW0QDn1QtoUXyYjEi7YB3',
      'SlpEQYl94DaH6j42QUyl8Kv2ujJ3'
    ]
    && request.resource.size <= 8 * 1024 * 1024
    && request.resource.contentType.matches('image/(jpeg|png|webp)');
}
```

## Security verification before any production deployment

1. Compare the complete currently deployed rules to the supplied versions. Back up exact production rules first.
2. Check every overlapping/wildcard allow in the actual full rulesets; Firestore and Storage rules are permissive across overlapping matches.
3. Run isolated Firebase emulator tests for anonymous, signed-in non-admin, and BOTH admin UIDs.
4. Firestore: anonymous/non-admin must be denied draft get/list/create/update/delete; both admins must be allowed. Public published fights and private admin notes must retain current behaviour.
5. Storage: anonymous/non-admin must be denied private draft read/list/upload/update/delete; both admins must be allowed for valid JPEG/PNG/WebP <= 8 MiB. Invalid MIME and oversized uploads must be denied.
6. Verify public image URLs and download tokens do not expose draft images. Do not put private images under public `fight-images/`.
7. Verify Team Wolfpack and Mrs Wolfie admin pages, public fight pages, updates, supporter images, sponsors and postponed history.
8. Deploy rules only after explicit approval; implement UI draft/publish actions only after rules are deployed and access tests pass.

No deployed rules changed. No private draft writes enabled. No emulator tests executed.
