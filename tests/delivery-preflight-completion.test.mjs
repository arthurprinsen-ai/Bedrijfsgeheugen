import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as preflight from '../tools/delivery-preflight.mjs';

test('delivery preflight blocks completion while material obligations remain open', () => {
  assert.equal(typeof preflight.evaluateCompletionReadiness, 'function');
  const decision = preflight.evaluateCompletionReadiness({
    localGreen: true,
    materialObligations: [
      { id: 'delivery', status: 'GREEN' },
      { id: 'production', status: 'OPEN' }
    ]
  });
  assert.equal(decision.canComplete, false);
  assert.equal(decision.state, 'CONTINUE');
  assert.deepEqual(decision.openObligations, ['production']);
});

test('delivery preflight allows completion only for all-terminal obligations or proven hard boundary', () => {
  assert.equal(typeof preflight.evaluateCompletionReadiness, 'function');
  const allGreen = preflight.evaluateCompletionReadiness({
    localGreen: true,
    materialObligations: [
      { id: 'delivery', status: 'GREEN' },
      { id: 'production', status: 'VERIFIED' }
    ]
  });
  assert.equal(allGreen.canComplete, true);
  assert.equal(allGreen.state, 'COMPLETE');

  const unprovenBoundary = preflight.evaluateCompletionReadiness({
    localGreen: true,
    materialObligations: [{ id: 'production', status: 'OPEN' }],
    hardBoundary: { present: true, proven: false }
  });
  assert.equal(unprovenBoundary.canComplete, false);
  assert.equal(unprovenBoundary.state, 'CONTINUE');

  const provenBoundary = preflight.evaluateCompletionReadiness({
    localGreen: false,
    materialObligations: [{ id: 'production', status: 'OPEN' }],
    hardBoundary: { present: true, proven: true, evidence: 'connector capability unavailable after read-only verification' }
  });
  assert.equal(provenBoundary.canComplete, true);
  assert.equal(provenBoundary.state, 'HARD_BOUNDARY');
});

test('completion readiness is a shared runtime policy, not owned by delivery tooling', async () => {
  const policy = await import('../brain/policy/completion-readiness.mjs');
  assert.equal(typeof policy.evaluateCompletionReadiness, 'function');
  const agentFabric = await readFile('platform/agents/agent-fabric.mjs', 'utf8');
  const deliveryPreflight = await readFile('tools/delivery-preflight.mjs', 'utf8');
  assert.match(agentFabric, /brain\/policy\/completion-readiness\.mjs/);
  assert.doesNotMatch(agentFabric, /tools\/delivery-preflight\.mjs/);
  assert.match(deliveryPreflight, /brain\/policy\/completion-readiness\.mjs/);
});
