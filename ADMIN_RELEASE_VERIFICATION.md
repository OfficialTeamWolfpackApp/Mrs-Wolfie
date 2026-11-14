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

## Step 20 — release blockers and verification evidence (14 November 2026)

### Verified from the development branch
- The public updates adapter queries `mrsWolfieUpdates` with `where("active", "==", true)`; backend rules must still be checked in the deployed project.
- Fight and update photo uploaders restrict client-selected images to JPEG, PNG or WebP, maximum 8 MiB.
- The public fight adapter passes `fighterImage`, `opponentImage`, `fightTitle`, `displayDate` and `method` from Firestore into the public fight model.
- The service worker precache no longer lists the three absent PWA icons; this prevents those absent paths from causing `cache.addAll()` to reject the installation.
- The admin dashboard banner now points to an existing repository image.

### Open release blockers
- [ ] Supply and verify `images/icon-192.png`, `images/icon-512.png` and `images/icon-maskable-512.png`; all three are referenced by `manifest.json`. The notification service worker also refers to `images/icon-192.png`.
- [ ] Check the **currently deployed** Firebase rules in the actual Firebase project; this repository does not establish production rule state.
- [ ] Decide whether unpublished fights are permitted in `mrsWolfieFights`. The existing public fight listener reads the entire collection; a client-only draft flag does not protect private announcements.
- [ ] Test that the deployed public Firestore query for active updates is permitted by the current backend rules.
- [ ] Run automated JavaScript/HTML checks and browser smoke tests, including service worker registration, admin login, uploads, TBA states, postponement, and mobile layouts.
- [ ] Verify the notification Cloud Function's backend authorisation and deduplication.
- [ ] Review and approve the complete PR diff before merging or deploying.

### Release decision
**NOT READY TO MERGE OR DEPLOY.** Repository inspection and commits are not substitutes for emulator tests, deployed-rule inspection or real-device verification. No production changes authorised.

## Step 44 — push device backend review (14 November 2026)

### Confirmed client contract
- `notifications.js` posts `{ "token": "<FCM registration token>" }` to the HTTPS Cloud Function `registerMrsWolfiePushDevice` in `europe-west1`.
- The request includes an `X-Firebase-AppCheck` header obtained from Firebase App Check. App Check attests the app environment; **it does not identify an individual supporter or replace backend authorisation**.
- The client expects a successful HTTP status and JSON `{ "success": true }` before saving a local registration marker.
- If browser permission is revoked during registration, the client now avoids saving a success marker. This does **not** unregister a previously stored backend token.

### Backend verification blocked — source not available in inspected GitHub repositories
- GitHub code search did not locate the Cloud Function implementation, and the expected `functions/index.js` path was not found in the Team Wolfpack app repository. **No backend security or cleanup behaviour has been verified.**
- [ ] Obtain the actual deployed function source, its Firebase project configuration and deployment revision for `registerMrsWolfiePushDevice`.
- [ ] Confirm server-side Firebase App Check verification, CORS origin allowlist, method checks, request-size limits and FCM token format validation.
- [ ] Confirm abuse controls (rate limiting, registration quotas and anti-spam) and ensure token values are never logged.
- [ ] Verify that registration is idempotent and that duplicate/rotated tokens do not create duplicate sends.
- [ ] Define a server-side invalid-token cleanup path for FCM `registration-token-not-registered` and other permanent delivery failures; distinguish temporary delivery failures.
- [ ] Design an explicit opt-out/unregister endpoint or equivalent revocation process. Clearing browser localStorage does not revoke the backend registration.
- [ ] Verify how backend records expire or are renewed for returning supporters, including tokens that remain unchanged.
- [ ] Exercise invalid/missing App Check tokens, malformed requests, rate limits, duplicate registrations, revoked permission, and rotated tokens in a non-production environment.

**Release blocker:** Do not describe notification registration as end-to-end verified or deploy these changes until the backend checks above and live device tests pass.

## Step 56 — notification lifecycle audit (14 November 2026)

### Confirmed in the current client branch
- Registration requests permission only through an explicit call to the enable function. The homepage calls it from a button click; returning devices are not prompted automatically.
- A successful backend response is required before the client stores the FCM token in localStorage.
- An existing local token is retained on transient registration or refresh failures while permission remains granted. A failed first registration does not create a local success marker.
- Token rechecks run when the app becomes visible and when the browser reports an online transition, but only for devices with a saved token and granted permission.
- When a changed FCM token is detected, the client registers it with the backend before replacing the saved token. Concurrent refresh checks are deduplicated within the page.
- Revoking browser permission clears the **local** marker when checked. This does **not** prove that the old token was removed from the server.

### Remaining release blockers — must be tested against the actual backend
- [ ] Confirm how the server replaces or retires the previous FCM token after rotation; otherwise old and new tokens could both receive a notification.
- [ ] Confirm server-side registration expiry/renewal for unchanged tokens. The client does not periodically re-submit an unchanged token.
- [ ] Confirm an opt-out/unregister mechanism that removes backend records after permission revocation; localStorage removal alone is insufficient.
- [ ] Verify behaviour after browser data clearing, app reinstall, service-worker replacement and offline-to-online transitions.
- [ ] Simulate transient backend failures and verify existing opt-ins are preserved without reporting an unconfirmed new registration as successful.
- [ ] Test duplicate click attempts, token-refresh races and permission revocation during a pending backend request on real supported browsers.

**Audit result:** Client-side lifecycle handling is improved, but the notification system is **not** verified end-to-end. The actual Cloud Function implementation and non-production tests are required before release.
