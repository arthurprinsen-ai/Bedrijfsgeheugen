import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCompletion } from '../platform/agents/completion-supervisor.mjs';

const trustedEvidence = {
  trusted:true,
  identityBound:true,
  candidateIdentity:'candidate-abc',
  productionIdentity:'deploy-123:candidate-abc',
  readbackIdentity:'readback-456:candidate-abc',
  functionalReadback:true,
  learningWriteback:true,
  capabilityHandoff:true
};

const recoveryPacket = {
  blocker:'Provider permission required',
  rootCause:'Provider denied an automated permission mutation',
  evidenceRefs:['provider-readback-1'],
  attemptedFixes:['retry-with-supported-route'],
  safeRemainingActions:['resume after permission grant'],
  minimumHumanAction:'Grant provider permission',
  fixAgentHandoff:'agent-provider-recovery',
  boundaryFingerprint:'provider-permission-v1',
  resumeWhen:'provider_permission_granted'
};

test('committed or merged claims remain active and promote next', () => {
  for (const claim of ['COMMITTED','MERGED','PREVIEW_READY','DEELS LIVE','NOT_CLAIMED']) {
    const result = evaluateCompletion({
      identity:'change-1',
      claim,
      materialObligations:[{ id:'production', status:'OPEN' }]
    });
    assert.equal(result.success, false);
    assert.notEqual(result.normalized_state, 'LIVE_VERIFIED');
    assert.ok(['CONTINUE','PROMOTE','READBACK','RECOVER','WRITEBACK'].includes(result.next_action));
  }
});

test('a complete hard-boundary packet yields WAIT_EXTERNAL without success', () => {
  const result = evaluateCompletion({
    identity:'change-2',
    claim:'DEELS LIVE',
    materialObligations:[{ id:'production', status:'OPEN' }],
    hardBoundary:{
      present:true,
      proven:true,
      evidence:'Provider denied the required control change.',
      recoveryPacket
    }
  });
  assert.equal(result.success, false);
  assert.equal(result.normalized_state, 'BLOCKED_HARD_BOUNDARY');
  assert.equal(result.next_action, 'WAIT_EXTERNAL');
  assert.deepEqual(result.recovery_packet, recoveryPacket);
  assert.equal(result.resume_when, recoveryPacket.resumeWhen);
});

test('an incomplete hard-boundary packet stays in recovery', () => {
  const result = evaluateCompletion({
    identity:'change-3',
    claim:'FAILED',
    materialObligations:[{ id:'production', status:'OPEN' }],
    hardBoundary:{
      present:true,
      proven:true,
      evidence:'Provider denied the required control change.',
      recoveryPacket:{ blocker:'Provider permission required' }
    }
  });
  assert.equal(result.success, false);
  assert.equal(result.next_action, 'RECOVER');
  assert.ok(result.required_evidence.includes('completeRecoveryPacket'));
});

test('only complete live evidence and closed obligations normalize to LIVE_VERIFIED', () => {
  const result = evaluateCompletion({
    identity:'change-4',
    claim:'DEPLOYED_UNVERIFIED',
    materialObligations:[
      { id:'tests', status:'GREEN' },
      { id:'production', status:'VERIFIED' },
      { id:'learning', status:'COMPLETED' }
    ],
    completionEvidence:trustedEvidence
  });
  assert.equal(result.success, true);
  assert.equal(result.normalized_state, 'LIVE_VERIFIED');
  assert.equal(result.next_action, null);
  assert.deepEqual(result.open_obligations, []);
});

test('a third identical recovery attempt requires a new hypothesis or proven fallback', () => {
  const result = evaluateCompletion({
    identity:'change-5',
    claim:'FAILED',
    materialObligations:[{ id:'production', status:'OPEN' }],
    retryHypothesis:'same-fix-v1',
    attemptCount:2
  });
  assert.equal(result.success, false);
  assert.equal(result.next_action, 'RECOVER');
  assert.ok(result.required_evidence.includes('newRetryHypothesisOrFallback'));
});
