import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..');

test('blocked BG168 chat writeback remains a replayable Brain outcome obligation', async () => {
  const raw = await readFile('brain/learning/chat-runtime-writeback-obligation-2026-08-31.json', 'utf8');
  const state = JSON.parse(raw);

  assert.equal(state.type, 'BRAIN_CHAT_WRITEBACK_OUTCOME_OBLIGATION');
  assert.equal(state.status, 'BLOCKED_EXTERNAL_CAPACITY');
  assert.equal(state.blocker.fingerprint, 'brain-writeback-make-team-paused-limit-v1');
  assert.equal(state.route.routerScenarioId, 7136176);
  assert.equal(state.route.ledgerScenarioId, 7135971);
  assert.equal(state.route.contextScenarioId, 7136045);
  assert.equal(state.replay.maxRunsAfterRecovery, 1);
  assert.equal(state.replay.requireDedupe, true);
  assert.equal(state.replay.requireBG167Readback, true);

  const fingerprints = new Set(state.events.map(event => event.fingerprint));
  for (const fingerprint of [
    'portal|customer-auth|legacy-inline-login-jitter',
    'shared-memory|ci-scope|main-push-missing',
    'repository|manual-connector-write|default-main-bypass',
    'repository|append-only-ledger|historical-evidence-mutated-by-full-rewrite'
  ]) assert.ok(fingerprints.has(fingerprint), `missing queued chat learning ${fingerprint}`);

  assert.equal(state.security.secretsPersisted, false);
  assert.equal(state.security.credentialsPersisted, false);
  assert.equal(state.security.piiPersisted, false);
});

test('runtime writeback obligation is discoverable by canonical Brain preflight', () => {
  const packet = compileChatLearningPreflight({ rootDir });
  const paths = new Set(packet.sources.map(source => source.path));
  assert.ok(paths.has('brain/learning/chat-runtime-writeback-obligation-2026-08-31.json'));
  assert.ok(packet.fingerprints.includes('brain-writeback-make-team-paused-limit-v1'));
  assert.ok(packet.fingerprints.includes('portal|customer-auth|legacy-inline-login-jitter'));
  assert.ok(packet.preventions.includes('NO_RETRY_STORM_ON_KNOWN_MAKE_CAPACITY_BLOCKER'));
});
