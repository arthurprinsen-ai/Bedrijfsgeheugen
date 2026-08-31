import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const POLICY = 'brain/policies/chat-to-brain-completeness-v1.json';
const GUARD = 'config/chat-learning-completeness-guard.json';
const INCIDENT = 'brain/learning/incidents/moving-main-pr-status-stale-readback-2026-08-31.json';

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

test('one canonical chat-to-Brain policy owns semantics and the completeness guard is enforcement projection only', async () => {
  const policy = await readJson(POLICY);
  const guard = await readJson(GUARD);
  assert.equal(policy.authority.role, 'CANONICAL_POLICY');
  assert.equal(policy.authority.enforcementProjection, GUARD);
  assert.equal(guard.authority.role, 'ENFORCEMENT_PROJECTION');
  assert.equal(guard.authority.canonicalPolicy, POLICY);
  assert.equal(guard.authority.conflictResolution, 'CANONICAL_POLICY_WINS');
});

test('all PR lifecycle mutations require fresh authoritative PR readback immediately before mutation', async () => {
  const incident = await readJson(INCIDENT);
  assert.equal(incident.regressionContract.lifecycleMutationRequiresFreshPrRead, true);
  assert.deepEqual(incident.regressionContract.lifecycleMutationsCovered, ['close', 'reopen', 'supersede', 'replace']);
  assert.ok(Array.isArray(incident.additionalEvidence));
  assert.ok(incident.additionalEvidence.some(x => x.pullRequest === 853 && x.observation === 'parallel-close-invalidated-earlier-snapshot'));
});
