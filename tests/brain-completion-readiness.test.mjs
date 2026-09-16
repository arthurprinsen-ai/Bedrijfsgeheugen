import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCompletionReadiness } from '../brain/policy/completion-readiness.mjs';

const terminalObligations = [
  { id:'tests', status:'GREEN' },
  { id:'production-readback', status:'VERIFIED' },
  { id:'learning-writeback', status:'COMPLETED' }
];

test('legacy localGreen cannot mint completion without identity-bound production evidence', () => {
  const result = evaluateCompletionReadiness({
    localGreen:true,
    materialObligations:terminalObligations
  });
  assert.equal(result.canComplete, false);
  assert.equal(result.state, 'CONTINUE');
  assert.ok(result.requiredEvidence.includes('completionEvidence'));
});

test('proven hard boundary can wait but can never complete', () => {
  const result = evaluateCompletionReadiness({
    materialObligations:[{ id:'production-readback', status:'OPEN' }],
    hardBoundary:{ present:true, proven:true, evidence:'Provider requires a human permission change.' }
  });
  assert.equal(result.canComplete, false);
  assert.equal(result.canWait, true);
  assert.equal(result.state, 'HARD_BOUNDARY');
});

test('only trusted identity-bound live evidence plus terminal obligations can complete', () => {
  const result = evaluateCompletionReadiness({
    materialObligations:terminalObligations,
    completionEvidence:{
      trusted:true,
      identityBound:true,
      candidateIdentity:'candidate-sha-123',
      productionIdentity:'deploy-456:candidate-sha-123',
      readbackIdentity:'readback-789:candidate-sha-123',
      functionalReadback:true,
      learningWriteback:true,
      capabilityHandoff:true
    }
  });
  assert.equal(result.canComplete, true);
  assert.equal(result.canWait, false);
  assert.equal(result.state, 'LIVE_VERIFIED');
  assert.deepEqual(result.openObligations, []);
});
