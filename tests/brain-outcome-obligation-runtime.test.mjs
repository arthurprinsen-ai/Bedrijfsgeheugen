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
  };
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
