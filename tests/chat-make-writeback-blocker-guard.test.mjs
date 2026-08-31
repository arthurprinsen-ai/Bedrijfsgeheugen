import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..');

const requiredFingerprints = [
  'portal|customer-auth|legacy-inline-login-jitter',
  'shared-memory|ci-scope|main-push-missing',
  'repository|manual-connector-write|default-main-bypass',
  'repository|append-only-ledger|historical-evidence-mutated-by-full-rewrite',
  'brain-writeback-make-team-paused-limit-v1'
];

test('canonical Make writeback blocker queues this chat learning without duplicate runtime routes', async () => {
  const raw = await readFile('brain/learning/chat-make-writeback-blocker-2026-08-31.json', 'utf8');
  const state = JSON.parse(raw);
  assert.equal(state.status, 'BLOCKED_REPLAY_PENDING');
  assert.equal(state.canonical_truth.brain_router.scenario_id, 7136176);
  assert.equal(state.canonical_truth.brain_router.downstream_ledger_scenario_id, 7135971);
  assert.equal(state.replay_obligation.max_replays_after_recovery, 1);
  assert.equal(state.replay_obligation.dedupe_required, true);
  assert.equal(state.replay_obligation.require_bg167_readback, true);
  const queued = new Set(state.replay_obligation.pending_fingerprints);
  for (const fingerprint of requiredFingerprints) assert.ok(queued.has(fingerprint), `missing pending runtime writeback ${fingerprint}`);
});

test('canonical Brain preflight loads the Make writeback blocker and its prevention knowledge', () => {
  const packet = compileChatLearningPreflight({ rootDir });
  const sources = new Set(packet.sources.map(source => source.path));
  assert.ok(sources.has('brain/learning/chat-make-writeback-blocker-2026-08-31.json'));
  for (const fingerprint of requiredFingerprints) assert.ok(packet.fingerprints.includes(fingerprint), `preflight missing ${fingerprint}`);
  assert.ok(packet.preventions.includes('NO_RETRY_STORM_ON_KNOWN_MAKE_CAPACITY_BLOCKER'));
  assert.ok(packet.preventions.includes('PRESERVE_APPEND_ONLY_HISTORY_AND_USE_EXPLICIT_CORRECTIONS'));
});
