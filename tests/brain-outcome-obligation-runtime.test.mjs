import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultAgentRegistry } from '../platform/agents/agent-team.mjs';
import {
  loadCanonicalObligations,
  createOutcomeObligationRuntime,
} from '../tools/outcome-obligation-runtime.mjs';

function memoryStore() {
  const records = new Map();
  return {
    records,
    async get(key) { return records.get(key) ?? null; },
    async putIfAbsent(record) {
      if (records.has(record.idempotencyKey)) return { created:false, record:records.get(record.idempotencyKey) };
      records.set(record.idempotencyKey, Object.freeze({ ...record }));
      return { created:true, record:records.get(record.idempotencyKey) };
    },
  };
}

function evidenceStore() {
  const records = new Map();
  return {
    set(key, evidence) { records.set(key, evidence); },
    async list(key) { return records.get(key) ?? []; },
    async putIfAbsent(record) {
      const current = records.get(record.idempotencyKey) ?? [];
      const found = current.find(item => item.ref === record.ref);
      if (found) return { created:false, record:found };
      const persisted = Object.freeze({ ...record });
      records.set(record.idempotencyKey, [...current, persisted]);
      return { created:true, record:persisted };
    },
  };
}

function trustedCompletionEvidence(obligationId, candidateIdentity, productionIdentity) {
  return [
    { ref:'candidate-tests', type:'CANDIDATE_TESTS', producer:'BRAIN_DELIVERY', accepted:true, independent:true, taskIdentity:obligationId, candidateIdentity },
    ...['PROTECTED_DELIVERY:BG169','PRODUCTION_IDENTITY:BG169','FUNCTIONAL_READBACK:PRODUCTION_READBACK','OBLIGATIONS_COMPLETE:OUTCOME_OBLIGATION_RUNTIME','CAPABILITY_HANDOFF:BG167','LEARNING_WRITEBACK:BG168_BG166'].map(value => {
      const [type, producer] = value.split(':');
      return { ref:type.toLowerCase(), type, producer, accepted:true, independent:true, taskIdentity:obligationId, candidateIdentity, productionIdentity };
    }),
  ];
}

const NOW = '2026-08-30T08:00:00Z';

test('canonical Supabase performance obligation routes to the existing performance agent', async () => {
  const obligations = await loadCanonicalObligations();
  const obligation = obligations.find(item => item.id === 'supabase-performance-evidence-daily');
  assert.ok(obligation);
  const agent = createDefaultAgentRegistry().get(obligation.ownerAgent);
  assert.equal(agent?.id, 'agent-performance');
  for (const task of ['measure-runtime-performance','detect-performance-regression','verify-latency-and-memory']) {
    assert.ok(agent.tasks.includes(task), `${task} must remain an existing performance-agent task`);
  }
});

test('canonical material-change obligation is owned by the existing reliability agent', async () => {
  const obligations = await loadCanonicalObligations();
  const obligation = obligations.find(item => item.id === 'material-change-live-verification');
  assert.ok(obligation);
  assert.equal(obligation.ownerAgent, 'agent-reliability');
  assert.match(obligation.evidencePolicy, /CANDIDATE_TESTS/);
  assert.match(obligation.evidencePolicy, /LEARNING_WRITEBACK/);
});

test('due sweep creates exactly one durable AgentWork and repeat sweep reuses it', async () => {
  const workStore = memoryStore();
  const runtime = createOutcomeObligationRuntime({
    registry:createDefaultAgentRegistry(),
    workStore,
    evidenceStore:evidenceStore(),
    recoveryStore:memoryStore(),
    clock:() => new Date(NOW),
  });
  const first = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger:{ type:'scheduled-sweep', fingerprint:'daily' } });
  const second = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger:{ type:'scheduled-sweep', fingerprint:'daily' } });
  assert.equal(workStore.records.size, 1);
  assert.equal(first[0].ownerAgent, 'agent-performance');
  assert.equal(first[0].status, 'AWAITING_OUTCOME');
  assert.equal(second[0].status, 'AWAITING_OUTCOME');
  assert.equal(first[0].idempotencyKey, second[0].idempotencyKey);
});

test('relevant Supabase event uses the same runtime and replay is idempotent', async () => {
  const workStore = memoryStore();
  const runtime = createOutcomeObligationRuntime({ registry:createDefaultAgentRegistry(), workStore, evidenceStore:evidenceStore(), recoveryStore:memoryStore(), clock:() => new Date(NOW) });
  const trigger = { type:'event-trigger', fingerprint:'supabase-schema:abc123' };
  const first = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger });
  const second = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger });
  assert.equal(workStore.records.size, 1);
  assert.equal(first[0].idempotencyKey, second[0].idempotencyKey);
});

test('activity evidence cannot complete but independent evidence can complete an observation', async () => {
  const workStore = memoryStore();
  const evidence = evidenceStore();
  const runtime = createOutcomeObligationRuntime({ registry:createDefaultAgentRegistry(), workStore, evidenceStore:evidence, recoveryStore:memoryStore(), clock:() => new Date(NOW) });
  const [initial] = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger:{ type:'scheduled-sweep', fingerprint:'daily' } });
  evidence.set(initial.idempotencyKey, [{ type:'activity', ref:'agent:self-report', independent:false }]);
  const [activityOnly] = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger:{ type:'scheduled-sweep', fingerprint:'daily' } });
  assert.equal(activityOnly.status, 'AWAITING_OUTCOME');
  evidence.set(initial.idempotencyKey, [{ type:'outcome', ref:'performance:measurement:1', independent:true, accepted:true }]);
  const [completed] = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger:{ type:'scheduled-sweep', fingerprint:'daily' } });
  assert.equal(completed.status, 'COMPLETED');
});

test('production remeasurement requirement prevents premature completion', async () => {
  const workStore = memoryStore();
  const evidence = evidenceStore();
  const runtime = createOutcomeObligationRuntime({ registry:createDefaultAgentRegistry(), workStore, evidenceStore:evidence, recoveryStore:memoryStore(), clock:() => new Date(NOW) });
  const [initial] = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger:{ type:'scheduled-sweep', fingerprint:'daily' }, productionProofRequired:true });
  evidence.set(initial.idempotencyKey, [{ type:'outcome', ref:'candidate:measurement', independent:true, accepted:true }]);
  const [waiting] = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger:{ type:'scheduled-sweep', fingerprint:'daily' }, productionProofRequired:true });
  assert.equal(waiting.status, 'AWAITING_OUTCOME');
  evidence.set(initial.idempotencyKey, [{ type:'production', ref:'production:exact-sha', independent:true, accepted:true, exactProduction:true }]);
  const [completed] = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger:{ type:'scheduled-sweep', fingerprint:'daily' }, productionProofRequired:true });
  assert.equal(completed.status, 'COMPLETED');
});

test('runtime emits governed metadata only and never direct production mutation commands', async () => {
  const runtime = createOutcomeObligationRuntime({ registry:createDefaultAgentRegistry(), workStore:memoryStore(), evidenceStore:evidenceStore(), recoveryStore:memoryStore(), clock:() => new Date(NOW) });
  const results = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger:{ type:'scheduled-sweep', fingerprint:'daily' } });
  const serialized = JSON.stringify(results);
  for (const token of ['"sql"','"ddl"','"httpMutation"','"deploy"','"productionMutation"']) assert.equal(serialized.includes(token), false);
});

test('partial claims are idempotently persisted and remain active', async () => {
  const evidence = evidenceStore();
  const runtime = createOutcomeObligationRuntime({ registry:createDefaultAgentRegistry(), workStore:memoryStore(), evidenceStore:evidence, recoveryStore:memoryStore(), clock:() => new Date(NOW) });
  const options = { obligationIds:['supabase-performance-evidence-daily'], trigger:{ type:'event-trigger', fingerprint:'delivery:sha-1' }, completionContext:{ claim:'DEELS LIVE', candidateIdentity:'sha-1' } };
  const [first] = await runtime.evaluateSweep(options);
  const [second] = await runtime.evaluateSweep(options);
  assert.equal(first.supervision.success, false);
  assert.notEqual(first.supervision.normalized_state, 'LIVE_VERIFIED');
  assert.equal(first.supervision.idempotency_key, second.supervision.idempotency_key);
  const rows = await evidence.list(first.idempotencyKey);
  assert.equal(rows.filter(item => item.type === 'PROGRESS_CLAIM').length, 1);
});

test('trusted exact evidence completes the same durable obligation as LIVE_VERIFIED', async () => {
  const workStore = memoryStore();
  const evidence = evidenceStore();
  const runtime = createOutcomeObligationRuntime({ registry:createDefaultAgentRegistry(), workStore, evidenceStore:evidence, recoveryStore:memoryStore(), clock:() => new Date(NOW) });
  const trigger = { type:'event-trigger', fingerprint:'delivery:sha-live' };
  const [initial] = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger, completionContext:{ claim:'MERGED', candidateIdentity:'sha-live', productionIdentity:'prod-live' } });
  evidence.set(initial.idempotencyKey, trustedCompletionEvidence('supabase-performance-evidence-daily', 'sha-live', 'prod-live'));
  const [completed] = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger, completionContext:{ claim:'DEPLOYED_UNVERIFIED', candidateIdentity:'sha-live', productionIdentity:'prod-live' } });
  assert.equal(workStore.records.size, 1);
  assert.equal(completed.supervision.success, true);
  assert.equal(completed.supervision.normalized_state, 'LIVE_VERIFIED');
});

test('runtime appends obligations-complete only after all other trusted production evidence is present', async () => {
  const workStore = memoryStore();
  const evidence = evidenceStore();
  const runtime = createOutcomeObligationRuntime({ registry:createDefaultAgentRegistry(), workStore, evidenceStore:evidence, recoveryStore:memoryStore(), clock:() => new Date(NOW) });
  const trigger = { type:'event-trigger', fingerprint:'readback:prod-live' };
  const coalesceKey = 'candidate:sha-live';
  const [initial] = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger, coalesceKey, completionContext:{ claim:'DEPLOYED_UNVERIFIED', candidateIdentity:'sha-live', productionIdentity:'prod-live', materialObligations:[] } });
  evidence.set(initial.idempotencyKey, trustedCompletionEvidence('supabase-performance-evidence-daily', 'sha-live', 'prod-live').filter(item => item.type !== 'OBLIGATIONS_COMPLETE'));
  const [completed] = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger, coalesceKey, completionContext:{ claim:'DEPLOYED_UNVERIFIED', candidateIdentity:'sha-live', productionIdentity:'prod-live', materialObligations:[] } });
  assert.equal(completed.supervision.normalized_state, 'LIVE_VERIFIED');
  const rows = await evidence.list(initial.idempotencyKey);
  assert.equal(rows.filter(item => item.type === 'OBLIGATIONS_COMPLETE').length, 1);
});

test('identity mismatch requests readback and cannot complete', async () => {
  const evidence = evidenceStore();
  const runtime = createOutcomeObligationRuntime({ registry:createDefaultAgentRegistry(), workStore:memoryStore(), evidenceStore:evidence, recoveryStore:memoryStore(), clock:() => new Date(NOW) });
  const trigger = { type:'event-trigger', fingerprint:'delivery:sha-mismatch' };
  const [initial] = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger, completionContext:{ claim:'MERGED', candidateIdentity:'sha-mismatch', productionIdentity:'prod-new' } });
  evidence.set(initial.idempotencyKey, trustedCompletionEvidence('supabase-performance-evidence-daily', 'sha-mismatch', 'prod-old'));
  const [result] = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger, completionContext:{ claim:'DEPLOYED_UNVERIFIED', candidateIdentity:'sha-mismatch', productionIdentity:'prod-new' } });
  assert.equal(result.supervision.success, false);
  assert.equal(result.supervision.next_action, 'READBACK');
  assert.ok(result.supervision.required_evidence.includes('IDENTITY_MATCH'));
});

test('boundary clear resumes the same durable AgentWork identity', async () => {
  const workStore = memoryStore();
  const runtime = createOutcomeObligationRuntime({ registry:createDefaultAgentRegistry(), workStore, evidenceStore:evidenceStore(), recoveryStore:memoryStore(), clock:() => new Date(NOW) });
  const trigger = { type:'event-trigger', fingerprint:'provider:permission' };
  const packet = { blocker:'Provider denied permission', root_cause:'Missing provider permission', evidence_refs:['provider:403'], attempted_repairs:['read provider state'], safe_remaining_actions:['retain last-known-good'], minimum_human_action:'restore existing permission', fix_agent_handoff:'resume same obligation after readback', boundary_fingerprint:'provider|permission|403', resume_when:{ type:'evidence', ref:'provider:permission:available' } };
  const [waiting] = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger, hardBoundary:{ present:true, proven:true, evidence:'provider:403', recovery_packet:packet }, completionContext:{ claim:'BLOCKED_HARD_BOUNDARY', candidateIdentity:'sha-boundary' } });
  const [resumed] = await runtime.evaluateSweep({ obligationIds:['supabase-performance-evidence-daily'], trigger, completionContext:{ claim:'RECOVERING', candidateIdentity:'sha-boundary' } });
  assert.equal(waiting.supervision.normalized_state, 'WAIT_EXTERNAL');
  assert.notEqual(resumed.supervision.normalized_state, 'WAIT_EXTERNAL');
  assert.equal(workStore.records.size, 1);
  assert.equal(waiting.idempotencyKey, resumed.idempotencyKey);
});
