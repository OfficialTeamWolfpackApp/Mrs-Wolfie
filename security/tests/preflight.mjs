/**
 * Step 88: offline, read-only preflight for the isolated Firebase test setup.
 * Does not start emulators, install dependencies, or contact Firebase.
 * Run from security/: node tests/preflight.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import assert from 'node:assert/strict';
import net from 'node:net';

const base = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(resolve(base, 'firebase.isolated.json'), 'utf8'));
const expectedProject = 'demo-mrs-wolfie-draft-security';
const fixtures = [
  [config.firestore.rules, 'service cloud.firestore', 'match /mrsWolfieFightDrafts/{fightId}'],
  [config.storage.rules, 'service firebase.storage', 'match /mrs-wolfie-private-fight-drafts/{fightId}/{fileName}']
];
for (const [path, service, draftMatch] of fixtures) {
  const fullPath = resolve(base, path);
  assert.ok(fullPath.startsWith(base + '/'), 'Rules path must stay within security/');
  assert.ok(existsSync(fullPath), 'Missing rules fixture: ' + path);
  const content = readFileSync(fullPath, 'utf8');
  assert.ok(content.includes(service), 'Wrong rules service: ' + path);
  assert.ok(content.includes(draftMatch), 'Missing private draft match: ' + path);
  console.log('PASS fixture:', path);
}
assert.equal(config.emulators.ui.enabled, false);
for (const service of ['firestore', 'storage']) {
  const { host, port } = config.emulators[service];
  assert.equal(host, '127.0.0.1', 'Emulator must bind loopback');
  assert.ok(Number.isInteger(port) && port >= 1024 && port <= 65535);
  const available = await new Promise((done) => {
    const server = net.createServer();
    server.once('error', () => done(false));
    server.listen(port, host, () => server.close(() => done(true)));
  });
  console.log(available ? 'PASS port available:' : 'BLOCKED port in use:', service, port);
  if (!available) process.exitCode = 1;
}
assert.ok(expectedProject.startsWith('demo-'));
console.log('Preflight only; no rules compilation, emulator tests or production access performed.');
