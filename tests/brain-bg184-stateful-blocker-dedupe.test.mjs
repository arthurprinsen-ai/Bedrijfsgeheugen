import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const policyPath = 'config/bg184-stateful-blocker-dedupe.json';
const incidentPath = 'brain/learning/incidents/bg184-repeated-known-blocker-dispatch-2026-08-30.json';

test('BG184 repeated blocker dedupe is fail-closed and state-aware', async () => {
  const policy = JSON.parse(await readFile(policyPath, 'utf8'));
  assert.equal(policy.version, 'BG184-STATEFUL-BLOCKER-DEDUPE-v1');
  assert.equal(policy.productionScenarioId, 7147086);
  assert.equal(policy.stagingScenarioId, 7165551);
  assert.equal(policy.promotionAllowed, false);
  assert.equal(policy.state, 'BLOCKED_PENDING_RUNTIME_EVIDENCE');
  assert.equal(policy.reservation.windowSeconds, 21600);
  assert.deepEqual(policy.reservation.identityParts, ['record_id', 'blocker_state_hash', 'six_hour_bucket']);
  assert.equal(policy.invariants.sameStateWithinWindowDownstreamDispatchesMax, 1);
  assert.equal(policy.invariants.stateChangeMayDispatchImmediately, true);
  assert.equal(policy.invariants.duplicateReservationRunsBG168, false);
  assert.equal(policy.invariants.duplicateReservationRunsRecoveryOrchestrator, false);
  assert.equal(policy.runtimeEvidence.requiredBeforePromotion, true);
});

test('BG184 repeated known blocker incident retains root cause and prevention', async () => {
  const incident = JSON.parse(await readFile(incidentPath, 'utf8'));
  assert.equal(incident.fingerprint, 'make|bg184|repeated-known-blocker-paid-redispatch-v1');
  assert.equal(incident.pattern, 'repeated-known-blocker-no-state-v1');
  assert.equal(incident.status, 'CONTAINED_IN_INACTIVE_STAGING_NOT_PROMOTED');
  assert.ok(incident.observed.sameRecordRepeatedExecutions >= 2);
  assert.ok(incident.failedApproaches.includes('Use shared Notion Laatste run as a new blocker-dedupe ownership field without proving exclusive ownership.'));
  assert.ok(incident.preventionRules.includes('Persist a caller-side reservation before BG168 and recovery-orchestrator dispatch, keyed by record plus blocker state plus bounded time bucket.'));
});
