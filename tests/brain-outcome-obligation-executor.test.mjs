import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeExecutionIdentity,
  evaluateOutcomeObligation,
} from '../tools/outcome-obligation-executor.mjs';

const daily = Object.freeze({
  id:'supabase-performance-evidence-daily',
  domain:'performance',
  dueAt:'daily_and_after_relevant_supabase_change',
  ownerAgent:'agent-performance',
  expected:'performance evidence',
  evidencePolicy:'independent evidence',
  idempotencyKey:'supabase-performance|finding-key|measurement-date|source-fingerprint',
  recoveryPolicy:'recover safely',
});
const agent = Object.freeze({ id:'agent-performance', enabled:true });

function scheduled(now='2026-08-30T08:00:00Z') {
  return { obligation:daily, now, trigger:{ type:'scheduled-sweep', fingerprint:'daily' }, agent };
}

test('future/non-due obligation returns NOT_DUE without dispatch', () => {
  const result = evaluateOutcomeObligation({ ...scheduled(), due:false });
  assert.equal(result.status, 'NOT_DUE');
  assert.equal(result.dispatch, null);
});

test('due daily obligation is PENDING until durable owner work exists', () => {
  const result = evaluateOutcomeObligation({ ...scheduled(), due:true });
  assert.equal(result.status, 'PENDING');
  assert.equal(result.dispatch?.type, 'AgentWork');
  assert.equal(result.dispatch?.ownerAgent, 'agent-performance');
});

test('durable work moves obligation to AWAITING_OUTCOME', () => {
  const identity = computeExecutionIdentity(scheduled());
  const result = evaluateOutcomeObligation({ ...scheduled(), due:true, priorWork:{ idempotencyKey:identity.idempotencyKey } });
  assert.equal(result.status, 'AWAITING_OUTCOME');
  assert.equal(result.dispatch, null);
});

test('scheduled wakeups on the same Amsterdam business date share one identity, including DST offset changes', () => {
  const beforeUtcSwitch = computeExecutionIdentity(scheduled('2026-10-25T00:30:00Z'));
  const afterUtcSwitch = computeExecutionIdentity(scheduled('2026-10-25T22:30:00Z'));
  assert.equal(beforeUtcSwitch.executionWindow, '2026-10-25');
  assert.equal(afterUtcSwitch.executionWindow, '2026-10-25');
  assert.equal(beforeUtcSwitch.idempotencyKey, afterUtcSwitch.idempotencyKey);
});

test('replayed event fingerprint reuses the same identity', () => {
  const input = { obligation:daily, now:'2026-08-30T12:00:00Z', trigger:{ type:'event-trigger', fingerprint:'supabase-change:abc' }, agent };
  assert.equal(computeExecutionIdentity(input).idempotencyKey, computeExecutionIdentity(input).idempotencyKey);
});

test('scheduled and equivalent event triggers coalesce when a coalesce key is supplied', () => {
  const scheduledId = computeExecutionIdentity({ ...scheduled(), coalesceKey:'measurement:2026-08-30' });
  const eventId = computeExecutionIdentity({ obligation:daily, now:'2026-08-30T14:00:00Z', trigger:{ type:'event-trigger', fingerprint:'supabase-change:def' }, agent, coalesceKey:'measurement:2026-08-30' });
  assert.equal(scheduledId.idempotencyKey, eventId.idempotencyKey);
});

test('unknown or disabled owner agent fails closed', () => {
  for (const badAgent of [null, { id:'agent-other', enabled:true }, { id:'agent-performance', enabled:false }]) {
    const result = evaluateOutcomeObligation({ ...scheduled(), due:true, agent:badAgent });
    assert.equal(result.status, 'BLOCKED_HARD_BOUNDARY');
    assert.equal(result.hardBoundary, 'unknown_or_disabled_owner_agent');
  }
});

test('explicit hard boundary fails closed', () => {
  const result = evaluateOutcomeObligation({ ...scheduled(), due:true, hardBoundary:'credentials_or_account_connection' });
  assert.equal(result.status, 'BLOCKED_HARD_BOUNDARY');
  assert.equal(result.hardBoundary, 'credentials_or_account_connection');
});

test('owner activity evidence alone cannot complete an obligation', () => {
  const result = evaluateOutcomeObligation({ ...scheduled(), due:true, priorWork:{ idempotencyKey:'x' }, evidence:[{ type:'activity', ref:'agent:self-report', independent:false }] });
  assert.equal(result.status, 'AWAITING_OUTCOME');
});

test('independent evidence completes when production proof is not required', () => {
  const result = evaluateOutcomeObligation({ ...scheduled(), due:true, productionProofRequired:false, evidence:[{ type:'outcome', ref:'evidence:1', independent:true, accepted:true }] });
  assert.equal(result.status, 'COMPLETED');
  assert.deepEqual(result.acceptedEvidenceRefs, ['evidence:1']);
});

test('production-facing obligation waits for exact production proof', () => {
  const result = evaluateOutcomeObligation({ ...scheduled(), due:true, productionProofRequired:true, evidence:[{ type:'outcome', ref:'evidence:1', independent:true, accepted:true }] });
  assert.equal(result.status, 'AWAITING_OUTCOME');
});

test('exact accepted production evidence completes production-facing obligation', () => {
  const result = evaluateOutcomeObligation({ ...scheduled(), due:true, productionProofRequired:true, evidence:[{ type:'production', ref:'netlify:deploy:sha', independent:true, accepted:true, exactProduction:true }] });
  assert.equal(result.status, 'COMPLETED');
});

test('expired evidence deadline becomes MISSED_OBLIGATION', () => {
  const result = evaluateOutcomeObligation({ ...scheduled('2026-08-30T12:00:00Z'), due:true, priorWork:{ idempotencyKey:'x' }, evidenceDeadline:'2026-08-30T11:59:59Z' });
  assert.equal(result.status, 'MISSED_OBLIGATION');
  assert.equal(result.recovery?.type, 'RecoveryWork');
});

test('existing recovery is RECOVERING and does not create a duplicate recovery identity', () => {
  const identity = computeExecutionIdentity(scheduled());
  const recovery = { idempotencyKey:`recovery|${identity.idempotencyKey}` };
  const result = evaluateOutcomeObligation({ ...scheduled('2026-08-30T12:00:00Z'), due:true, priorWork:{ idempotencyKey:identity.idempotencyKey }, priorRecovery:recovery, evidenceDeadline:'2026-08-30T11:59:59Z' });
  assert.equal(result.status, 'RECOVERING');
  assert.equal(result.recovery, null);
});

test('executor never emits direct production mutation commands', () => {
  const result = evaluateOutcomeObligation({ ...scheduled(), due:true });
  const forbidden = ['sql','ddl','httpMutation','deploy','productionMutation'];
  for (const field of forbidden) assert.equal(Object.hasOwn(result, field), false, `${field} must not exist`);
});
