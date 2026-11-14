# Mrs Wolfie admin release verification (draft PR #1)

## Repository inspection — 14 November 2026
- Admin login is present in `mrs-wolfie-dashboard.html` and uses Firebase email/password authentication.
- Dashboard and both management pages gate their UI on two authorised non-anonymous Firebase UIDs.
- Fight data collection: `mrsWolfieFights` (Cloud Firestore).
- Update data collection: `mrsWolfieUpdates` (Cloud Firestore).
- Fight image upload prefix: `fight-images/` (Firebase Storage).
- Update image upload prefix: `mrs-wolfie-updates/` (Firebase Storage).
- Both upload interfaces accept JPEG, PNG, WebP and enforce an 8 MB client-side size limit.
- The separate profile editor uses Firebase Realtime Database. Verify its actual database path and rules independently.
- No `firestore.rules`, `storage.rules` or `database.rules.json` was found at the root of this repository. The deployed Firebase rules **have not been inspected**.
- This is a code review, **not** proof of production permissions or successful uploads.

## Required Firebase console / emulator checks — do not merge before completion
- [ ] Confirm the current **deployed** Firestore rules for `mrsWolfieFights/{id}` and `mrsWolfieUpdates/{id}`.
- [ ] Confirm the current **deployed** Storage rules for `fight-images/{path=**}` and `mrs-wolfie-updates/{path=**}`, including MIME and size constraints.
- [ ] Confirm the Realtime Database rules for Mrs Wolfie profile records and uploads.
- [ ] Check that only the two approved authenticated admin accounts may create/update/delete these records; anonymous users and ordinary supporters must be denied by backend rules.
- [ ] Confirm that public read permissions match what the app needs and that no private notes or internal admin data are exposed.
- [ ] Test read/write denials using Firebase Emulator Suite or a dedicated test project; never test destructive actions against production data.
- [ ] Verify Firebase Authentication email/password provider is enabled, and the Mrs Wolfie hosting origin is an authorised domain where applicable.
- [ ] Verify both administrators can log in, log out and navigate from the homepage to all three admin tools.
- [ ] Test creating, editing and postponing a fight; verify public fight cards and the TBA silhouette display correctly.
- [ ] Test fighter and opponent photo upload from PC and mobile, including invalid type, >8 MB, denied-user and network-failure cases.
- [ ] Test creating/editing updates and image upload; confirm the public app displays changes.
- [ ] Confirm notification Cloud Functions accept only authorised requests and do not send duplicate notifications.
- [ ] Check the browser console and network tab for missing assets, broken links and service-worker cache issues.
- [ ] Check mobile viewport layouts and touch controls on a real phone.
- [ ] Obtain approval before merging PR #1 or deploying to the live app.

## Security note
The client-side UID allowlist is a user-interface guard, **not** an authorisation boundary. Firestore, Realtime Database, Storage and Cloud Functions must independently enforce access control. No live Firebase rules were changed or deployed by this pull request.
