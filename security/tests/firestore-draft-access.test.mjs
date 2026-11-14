/**
 * Step 83 — Firestore private-draft security emulator checks.
 *
 * Requires Node >=20, @firebase/rules-unit-testing and firebase.
 * Run ONLY against an isolated Firestore emulator, never production.
 *
 * 1. Merge proposed draft match into a COMPLETE COPY of the Firestore rules
 *    supplied by the user, saved as ./firestore.rules.test (not deployed).
 * 2. Start an isolated emulator: firebase emulators:start --only firestore
 *    --project demo-mrs-wolfie-draft-security --config <isolated-config.json>
 * 3. FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node --test security/tests/firestore-draft-access.test.mjs
 *
 * Configure the emulator port to match FIRESTORE_EMULATOR_HOST.
 * The test refuses to run without an emulator host.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';

const host = process.env.FIRESTORE_EMULATOR_HOST;
if (!host || !/^(127\.0\.0\.1|localhost):\d+$/.test(host)) {
  throw new Error('FIRESTORE_EMULATOR_HOST must point to a local isolated emulator (e.g. 127.0.0.1:8080).');
}
const rules = readFileSync(new URL('../firestore.rules.test', import.meta.url), 'utf8');
if (!rules.includes('match /mrsWolfieFightDrafts/{fightId}')) {
  throw new Error('Test rules must include the proposed private-draft match.');
}
const [emulatorHost, emulatorPort] = host.split(':');
const env = await initializeTestEnvironment({
  projectId: 'demo-mrs-wolfie-draft-security',
  firestore: { host: emulatorHost, port: Number(emulatorPort), rules }
});
after(async () => { await env.cleanup(); });

const admins = ['PRGa9TsCW0QDn1QtoUXyYjEi7YB3', 'SlpEQYl94DaH6j42QUyl8Kv2ujJ3'];
const identities = [
  ['anonymous', null, false],
  ['non-admin', 'not-an-admin-user', false],
  ...admins.map((uid, i) => ['admin-' + (i + 1), uid, true])
];

for (const [label, uid, allowed] of identities) {
  test(`private draft get/list/write/delete: ${label}`, async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'mrsWolfieFightDrafts', 'draft-access-check'), { opponent: 'SEEDED PRIVATE TEST' });
    });
    const db = uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore();
    const draft = doc(db, 'mrsWolfieFightDrafts', 'draft-access-check');
    const list = collection(db, 'mrsWolfieFightDrafts');
    const check = allowed ? assertSucceeds : assertFails;
    await check(getDoc(draft));
    await check(getDocs(list));
    await check(setDoc(draft, { opponent: 'UNANNOUNCED TEST ONLY' }));
    await check(updateDoc(draft, { opponent: 'PRIVATE TEST' }));
    await check(deleteDoc(draft));
  });
}

test('published fights stay publicly readable but not publicly writable', async () => {
  const publicDb = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDocs(collection(publicDb, 'mrsWolfieFights')));
  await assertFails(setDoc(doc(publicDb, 'mrsWolfieFights', 'unauthorized-write'), { opponent: 'test' }));
});

test('private notes remain inaccessible to unauthenticated visitors', async () => {
  const publicDb = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(publicDb, 'mrsWolfieFightAdminNotes', 'private-note')));
});
