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

## Step 57 — wider pull request release-readiness review (14 November 2026)

### Verified from the current development branch and PR #1 file list
- PR #1 currently changes 11 files: `ADMIN_RELEASE_VERIFICATION.md`, `fight-data.js`, `fight.html`, `home.html`, `mrs-wolfie-dashboard.html`, `mrs-wolfie-fights-admin.html`, `mrs-wolfie-updates-admin.html`, `notifications.js`, `schedule.html`, `service-worker.js` and `updates.html`.
- The public fight adapter has an empty local announced-fights fallback (`MRS_WOLFIE_FALLBACK_FIGHTS = []`); it must still be tested against actual Firestore records and failure conditions.
- The public updates adapter filters Firestore updates with `active == true`; deployed Firestore rules and indexes remain unverified.
- The three PWA icon paths referenced in `manifest.json` are **not included in PR #1's changed-file list**. Do not infer their image contents, branding or installability from this review; verify the actual binary assets separately.
- GitHub's combined commit-status endpoint returned **no status entries** for the inspected development commit. This is not evidence that CI or browser tests passed.

### Release gates still open
- [ ] Obtain real test evidence for admin sign-in, Firestore/Storage authorisation, image uploads and public rendering on desktop and mobile.
- [ ] Exercise announced, TBA, postponed and cancelled fight states using non-production data; check every public page for stale opponent names, dates or title text.
- [ ] Verify manifest icon files and branding from actual image bytes and test installation on Android and iOS.
- [ ] Confirm the deployed Firebase rules and push-registration Cloud Function source, then run negative security tests.
- [ ] Run automated syntax checks and browser smoke tests; record results and any failures in this document.
- [ ] Review the complete PR diff and obtain explicit approval before merge or deployment.

**Step 57 decision: NOT READY TO MERGE OR DEPLOY.** This is a repository review and documentation update only; no automated test suite or real-device test was executed in this step.

## Step 58 — fight display and status audit (14 November 2026)

### Verified from current source
- The fight editor offers `UPCOMING`, `POSTPONED`, `COMPLETED` and `CANCELLED` statuses and an optional `fightTitle` field.
- `fight-data.js` normalises Firestore status to uppercase and passes `fightTitle`, `fighterImage`, `opponentImage` and `displayDate` to the public model.
- `MRS_WOLFIE_GET_NEXT_FIGHT` and `MRS_WOLFIE_GET_UPCOMING_FIGHTS` exclude postponed, cancelled and completed/result fights; they also require a valid final date that has not passed.
- `home.html` resets the next-fight opponent to `TBA` and hides the title card when there is no eligible next fight. The opponent photo is only used for a named opponent on an `UPCOMING` fight; otherwise the silhouette remains.
- `fight.html` and `schedule.html` contain separate postponed-fight rendering sections; these must still be exercised with representative Firestore records.

### Behaviour requiring a product decision or test
- [ ] **Undated announcements:** The next-fight and upcoming-fights selectors require a valid `date` or `dateEnd`. Decide whether an announced `UPCOMING` fight with date TBA should appear in the public schedule before a date is confirmed. Do not silently change this policy.
- [ ] **Publication control:** The public Firestore adapter reads the entire `mrsWolfieFights` collection. If drafts or private opponent details are stored there, client-side hiding is not sufficient; enforce publication access in Firestore rules or separate private records.
- [ ] **Postponed data:** Test that postponed cards show their historical opponent/date/title as intended, but never leak those values into the active next-fight card when there is no announced fight.
- [ ] **Title and image reset:** Switch live test records from title fight to ordinary fight to no upcoming fight and verify title card, opponent name and image all reset correctly on each page.
- [ ] **Status transitions:** Test `UPCOMING → POSTPONED → UPCOMING`, `UPCOMING → CANCELLED`, and `UPCOMING → COMPLETED` using isolated test data.

**Step 58 result:** Static source audit only. No Firebase records were modified and no live UI tests were run. Release remains blocked pending these checks.


## Step 74 — fight-management test matrix and release gates (14 November 2026)

**Scope:** Repository-level review of the fight editor, Firestore fight adapter and the Step 73 deletion changes. The following are **test cases to execute**, not claims of successful browser or Firebase tests.

### Admin form and data integrity — desktop and mobile
- [ ] Sign in as each authorised admin; confirm an unauthorised account cannot read private notes or write fights/images.
- [ ] Create an UPCOMING fight with confirmed date, opponent and title; verify every saved field after page refresh.
- [ ] Create an UPCOMING fight with DATE TBA and opponent TBA; verify the mystery silhouette and absence of stale opponent/title data.
- [ ] Upload JPG, PNG and WebP images from desktop file picker and mobile photo library; verify preview, final public image, 8 MB limit and invalid-file rejection.
- [ ] Replace and remove fighter/opponent images; confirm old image URLs are no longer used by that fight, while historical Storage objects remain untouched.
- [ ] Change opponent name and set opponent to TBA; verify the former opponent image is not carried forward.
- [ ] Verify image uploads are not repeated when public fight save succeeds but private-note save fails; inspect the actual saved URLs after refreshing.
- [ ] Simulate upload failure, Firestore save failure, lost connectivity and permission denial. Verify best-effort cleanup and inspect Storage for orphans; **deployed Storage delete permission is unverified**.
- [ ] While a save is pending, try edit/cancel/result/delete actions and repeated submission. Verify the controls cannot cause conflicting writes.
- [ ] Test narrow mobile layouts, keyboard focus, touch targets, error messages and scrolling on Android and iOS browsers.

### Status transitions and public displays
- [ ] UPCOMING → POSTPONED: historical card remains visible where intended; next-fight hero no longer shows the postponed opponent or title.
- [ ] POSTPONED → UPCOMING: re-announced fight returns to active displays only when eligible.
- [ ] UPCOMING → CANCELLED: cancelled fight is excluded from active next-fight selection.
- [ ] UPCOMING → COMPLETED: WIN/LOSS/DRAW and result method render correctly; postponed/cancelled quick-result actions are rejected.
- [ ] Confirmed-date and undated UPCOMING records: confirmed dates sort first; DATE TBA records appear in the intended schedule/Next Up locations but do not become the dated next-fight hero.
- [ ] Verify home.html, fight.html and schedule.html with zero fights, one fight, multiple fights, postponed-only and title-fight-to-ordinary-fight transitions.
- [ ] Check both desktop and mobile for stale text, broken image URLs, incorrect silhouettes and cache-related outdated data.

### Deletion and security
- [ ] Delete a test fight with a private note; confirm both Firestore documents disappear together after the atomic batch commits.
- [ ] Force a Firestore permission error during batch deletion; confirm neither document is removed.
- [ ] Verify deletion confirmation clearly identifies the selected fight and warns about historical statuses.
- [ ] Confirm Storage images are retained after fight deletion; separately design a reference-aware cleanup policy if deletion of unused images is required.
- [ ] Confirm actual deployed Firestore and Storage rules, including admin-only note access, image upload/delete permissions and whether unpublished fights can be read publicly.
- [ ] Review push-notification backend registration and permissions before enabling real notification delivery.

### Outstanding risks requiring resolution
- **Public draft privacy:** Public collection reads may expose unannounced records. Do not store confidential drafts in a publicly readable collection without a server-enforced publication model.
- **Ambiguous network outcome:** A write that succeeds server-side but loses its response may be retried, potentially duplicating a new fight or leaving uploaded images. Client-side success flags do not eliminate this risk.
- **Image cleanup:** Step 67's best-effort delete requires deployed Storage rules that permit the admin to delete newly uploaded objects; this has not been verified.
- **Cross-client concurrency:** UI button locks only prevent actions in the current page, not simultaneous edits from different devices.
- **Binary PWA icons:** Actual Mrs Wolfie icon branding and installation still require inspection and device testing.
- **CI and browser coverage:** No successful automated suite, real Firebase integration test or real-device smoke test is recorded here.

**Step 74 decision: NOT READY TO MERGE OR DEPLOY.** This step adds a reproducible acceptance-test plan; it does not execute the tests, change Firebase rules, merge the PR or deploy production code.


## Step 76 — secure draft/publish architecture decision (14 November 2026)

**Source findings:** The current admin editor writes directly to `mrsWolfieFights`, and the public `fight-data.js` subscribes to that entire collection. No `firestore.rules` file was found at the root of this development branch. Consequently, **a client-side `draft` flag alone must not be used to store confidential fight information**.

### Recommended phased architecture (not yet implemented)
1. Keep `mrsWolfieFights/{id}` as the **published, publicly readable projection only**, preserving compatibility with the current homepage, schedule, fight page and postponed history.
2. Create `mrsWolfieFightDrafts/{id}` for **admin-only** unpublished content. Do not write private opponent names, unpublished dates, or draft images to the public fight document.
3. Verify and deploy Firestore rules that restrict **all reads and writes** on `mrsWolfieFightDrafts/{id}` to the two approved admin identities. Public reads of `mrsWolfieFights/{id}` should remain limited to explicitly public data.
4. Use a stable shared document ID and a deliberate **Publish** action that copies only approved public fields to `mrsWolfieFights/{id}`. Publishing must be idempotent; avoid `addDoc` retries that create duplicates.
5. **Unpublish** should remove or archive the public projection without deleting the admin-only draft. Preserve historical postponed/completed fights according to the team's explicit policy; do not silently unpublish them.
6. Store private draft images under a separate Storage prefix with **admin-only read and write** rules; current `fight-images/` URLs are publicly readable and are not appropriate for confidential draft imagery.
7. Define publication audit fields (`publishedAt`, `publishedBy`, `lastPublishedAt`) and handle concurrent edits, partial publication failures, and notification delivery only after confirmed publication.
8. Migrate existing records cautiously: treat current `mrsWolfieFights` entries as **already public**, do not assume they are drafts, and back up data before any migration. Review legacy notes and any unpublished sensitive fields first.

### Release gate and order of operations
- [ ] Obtain the exact **deployed** Firestore and Storage rules and verify the authorised admin identity model.
- [ ] Agree whether unpublished fights should have private images, and whether postponed records remain publicly visible.
- [ ] Implement and test admin-only draft collection and private-image Storage rules in an isolated Firebase project.
- [ ] Add admin Draft / Publish / Unpublish controls and update the admin listing to distinguish public versus private records.
- [ ] Verify public unauthenticated clients cannot read draft documents **or** draft images, including direct document and Storage URL attempts.
- [ ] Test publish, republish, unpublish, rollback, multi-device conflict and network-interruption scenarios.
- [ ] Only after security tests pass, approve any data migration and production deployment.

**Step 76 decision:** Architecture documented, but **no draft data model or new publication control is enabled**. This deliberately avoids creating a false sense of privacy before Firebase security rules are verified and deployed. **NOT READY TO MERGE OR DEPLOY.**
