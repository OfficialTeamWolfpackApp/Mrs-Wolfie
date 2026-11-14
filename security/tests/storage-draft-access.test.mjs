/**
 * Step 84 — Firebase Storage private fight draft rules tests.
 * TEST ONLY: requires @firebase/rules-unit-testing, firebase, and a running
 * ISOLATED local Storage emulator. Never target a live Firebase bucket.
 *
 * Save the complete existing Storage rules PLUS the proposed private-draft
 * match as security/storage.rules.test (not deployed).
 *
 * Start the emulator with a separate firebase.json pointing to this rules
 * file and project ID demo-mrs-wolfie-draft-security.
 *
 * STORAGE_EMULATOR_HOST=127.0.0.1:9199 node --test security/tests/storage-draft-access.test.mjs
 *
 * This file does not deploy rules, modify the real bucket or start emulators.
 */
import { test, after } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { ref, uploadBytes, getBytes, deleteObject, listAll } from 'firebase/storage';

const host = process.env.STORAGE_EMULATOR_HOST;
if (!host || !/^(127\.0\.0\.1|localhost):\d+$/.test(host)) {
  throw new Error('STORAGE_EMULATOR_HOST must be a local emulator host:port.');
}
const rules = readFileSync(new URL('../storage.rules.test', import.meta.url), 'utf8');
if (!rules.includes('match /mrs-wolfie-private-fight-drafts/{fightId}/{fileName}')) {
  throw new Error('Test rules must contain the private draft image match.');
}
const [emulatorHost, emulatorPort] = host.split(':');
const env = await initializeTestEnvironment({
  projectId: 'demo-mrs-wolfie-draft-security',
  storage: { host: emulatorHost, port: Number(emulatorPort), rules }
});
after(async () => { await env.cleanup(); });

const adminUids = ['PRGa9TsCW0QDn1QtoUXyYjEi7YB3', 'SlpEQYl94DaH6j42QUyl8Kv2ujJ3'];
const actors = [
  ['anonymous', null, false],
  ['ordinary-user', 'ordinary-test-user', false],
  ...adminUids.map((uid, i) => ['admin-' + (i + 1), uid, true])
];
const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0]);
const mime = { contentType: 'image/png' };

for (const [label, uid, allowed] of actors) {
  test(`private draft Storage permissions: ${label}`, async () => {
    const storage = uid ? env.authenticatedContext(uid).storage() : env.unauthenticatedContext().storage();
    const object = ref(storage, `mrs-wolfie-private-fight-drafts/test-${label}/image.png`);
    const directory = ref(storage, `mrs-wolfie-private-fight-drafts/test-${label}`);
    // Seed via admin bypass; read/delete/list must be evaluated on a real object.
    await env.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), `mrs-wolfie-private-fight-drafts/test-${label}/image.png`), pngBytes, mime);
    });
    const expect = allowed ? assertSucceeds : assertFails;
    await expect(getBytes(object));
    await expect(listAll(directory));
    await expect(uploadBytes(object, pngBytes, mime));
    await expect(deleteObject(object));
  });
}

test('admins cannot upload unsupported MIME types or oversized files', async () => {
  const storage = env.authenticatedContext(adminUids[0]).storage();
  await assertFails(uploadBytes(
    ref(storage, 'mrs-wolfie-private-fight-drafts/mime-reject/file.svg'),
    new TextEncoder().encode('<svg></svg>'), { contentType: 'image/svg+xml' }
  ));
  await assertFails(uploadBytes(
    ref(storage, 'mrs-wolfie-private-fight-drafts/size-reject/file.png'),
    new Uint8Array(8 * 1024 * 1024 + 1), mime
  ));
});

test('public fight images remain publicly readable', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await uploadBytes(ref(ctx.storage(), 'fight-images/public-regression.png'), pngBytes, mime);
  });
  await assertSucceeds(getBytes(ref(env.unauthenticatedContext().storage(), 'fight-images/public-regression.png')));
});
