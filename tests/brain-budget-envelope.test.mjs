import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentFabric } from '../platform/agents/agent-fabric.mjs';

const registry = { route: () => ({ primaryAgentId: 'agent-cost', supportAgentIds: [] }) };
const optionalSignal = {
  tenantId: 'T1',
  problemClass: 'optional-optimization',
  domains: ['Cost'],
  capabilities: ['optimize'],
  affectedObjectIds: ['make-all'],
  problem: 'reduce cost',
  optional: true,
};

test('optional AgentWork requires a current budget envelope', () => {
  const fabric = createAgentFabric({ registry });
  assert.throws(() => fabric.intake(optionalSignal), /budget envelope/i);
});

test('optional AgentWork is explicitly deferred when the shared budget guard says so', () => {
  const fabric = createAgentFabric({ registry });
  assert.throws(() => fabric.intake({
    ...optionalSignal,
    budgetEnvelope: {
      state: 'EXHAUSTED',
      decision: 'BUDGET_DEFERRED',
      remainingCredits: 0,
      dailyAllowance: 0,
      snapshotFingerprint: 'snapshot-1',
      current: true,
    },
  }), /BUDGET_DEFERRED/);
});

test('optional AgentWork runs on a current permitted shared envelope', () => {
  const fabric = createAgentFabric({ registry });
  const work = fabric.intake({
    ...optionalSignal,
    budgetEnvelope: {
      state: 'GREEN',
      decision: 'RUN',
      remainingCredits: 9_000,
      dailyAllowance: 300,
      snapshotFingerprint: 'snapshot-1',
      current: true,
    },
  });

  assert.equal(work.primaryAgentId, 'agent-cost');
});
