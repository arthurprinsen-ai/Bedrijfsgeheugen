import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as preflight from '../tools/delivery-preflight.mjs';

const trustedCompletionEvidence = Object.freeze({
  trusted: true,
  identityBound: true,
  candidateIdentity: 'candidate-sha-123',
  productionIdentity: 'deploy-456:candidate-sha-123',
  readbackIdentity: 'readback-789:candidate-sha-123',
  functionalReadback: true,
  learningWriteback: true,
  capabilityHandoff: true
});

test('delivery preflight blocks completion while material obligations remain open', () => {
  assert.equal(typeof preflight.evaluateCompletionReadiness, 'function');
  const decision = preflight.evaluateCompletionReadiness({
    localGreen: true,
    materialObligations: [
      { id: 'delivery', status: 'GREEN' },
      { id: 'production', status: 'OPEN' }
    ],
    completionEvidence: trustedCompletionEvidence
  });
  assert.equal(decision.canComplete, false);
  assert.equal(decision.state, 'CONTINUE');
  assert.deepEqual(decision.openObligations, ['production']);
});

test('delivery preflight completes only with trusted live evidence; a proven hard boundary remains active wait', () => {
  assert.equal(typeof preflight.evaluateCompletionReadiness, 'function');
  const allGreen = preflight.evaluateCompletionReadiness({
    materialObligations: [
      { id: 'delivery', status: 'GREEN' },
      { id: 'production', status: 'VERIFIED' }
    ],
    completionEvidence: trustedCompletionEvidence
  });
  assert.equal(allGreen.canComplete, true);
  assert.equal(allGreen.canWait, false);
  assert.equal(allGreen.state, 'LIVE_VERIFIED');

  const unprovenBoundary = preflight.evaluateCompletionReadiness({
    materialObligations: [{ id: 'production', status: 'OPEN' }],
    hardBoundary: { present: true, proven: false }
  });
  assert.equal(unprovenBoundary.canComplete, false);
  assert.equal(unprovenBoundary.canWait, false);
  assert.equal(unprovenBoundary.state, 'CONTINUE');

  const provenBoundary = preflight.evaluateCompletionReadiness({
    materialObligations: [{ id: 'production', status: 'OPEN' }],
    hardBoundary: { present: true, proven: true, evidence: 'connector capability unavailable after read-only verification' }
  });
  assert.equal(provenBoundary.canComplete, false);
  assert.equal(provenBoundary.canWait, true);
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
