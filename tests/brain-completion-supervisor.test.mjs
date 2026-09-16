import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCompletion } from '../platform/agents/completion-supervisor.mjs';

const CANDIDATE = 'candidate-abc';
const PRODUCTION = 'deploy-123:candidate-abc';

function proof(type, producer, extra = {}) {
  return { type, producer, accepted:true, independent:true, taskIdentity:'change-4', candidateIdentity:CANDIDATE, ...extra };
}

function trustedEvidence() {
  const production = { productionIdentity:PRODUCTION };
  return [
    proof('CANDIDATE_TESTS', 'BRAIN_DELIVERY'),
    proof('PROTECTED_DELIVERY', 'BG169', production),
    proof('PRODUCTION_IDENTITY', 'BG169', production),
    proof('FUNCTIONAL_READBACK', 'PRODUCTION_READBACK', production),
    proof('OBLIGATIONS_COMPLETE', 'OUTCOME_OBLIGATION_RUNTIME', production),
    proof('CAPABILITY_HANDOFF', 'BG167', production),
    proof('LEARNING_WRITEBACK', 'BG168_BG166', production),
  ];
}

const recoveryPacket = {
  blocker:'Provider permission required',
  root_cause:'Provider denied an automated permission mutation',
  evidence_refs:['provider-readback-1'],
  attempted_repairs:['retry-with-supported-route'],
  safe_remaining_actions:['resume after permission grant'],
  minimum_human_action:'Grant provider permission',
  fix_agent_handoff:'agent-provider-recovery',
  boundary_fingerprint:'provider-permission-v1',
  resume_when:{ type:'provider_permission', state:'granted' },
};

test('committed or merged claims remain active and promote next', () => {
  for (const claim of ['COMMITTED','MERGED','PREVIEW_READY','DEELS LIVE','NOT_CLAIMED']) {
    const result = evaluateCompletion({ obligationId:'change-1', workId:'work-change-1', candidateIdentity:CANDIDATE, claim, materialObligations:[{ id:'production', status:'OPEN' }] });
    assert.equal(result.success, false);
    assert.notEqual(result.normalized_state, 'LIVE_VERIFIED');
    assert.ok(['CONTINUE','PROMOTE','READBACK','RECOVER','WRITEBACK'].includes(result.next_action));
  }
});

test('a complete hard-boundary packet yields WAIT_EXTERNAL without success', () => {
  const result = evaluateCompletion({
    obligationId:'change-2', workId:'work-change-2', candidateIdentity:CANDIDATE, claim:'DEELS LIVE',
    materialObligations:[{ id:'production', status:'OPEN' }],
    hardBoundary:{ present:true, proven:true, evidence:'Provider denied the required control change.', recovery_packet:recoveryPacket },
  });
  assert.equal(result.success, false);
  assert.equal(result.normalized_state, 'WAIT_EXTERNAL');
  assert.equal(result.next_action, 'WAIT_EXTERNAL');
  assert.deepEqual(result.recovery_packet, recoveryPacket);
  assert.deepEqual(result.resume_when, recoveryPacket.resume_when);
});

test('an incomplete hard-boundary packet stays in recovery', () => {
  const result = evaluateCompletion({
    obligationId:'change-3', workId:'work-change-3', candidateIdentity:CANDIDATE, claim:'FAILED',
    materialObligations:[{ id:'production', status:'OPEN' }],
    hardBoundary:{ present:true, proven:true, evidence:'Provider denied the required control change.', recovery_packet:{ blocker:'Provider permission required' } },
  });
  assert.equal(result.success, false);
  assert.equal(result.next_action, 'RECOVER');
  assert.ok(result.required_evidence.includes('RECOVERY_PACKET'));
});

test('only complete live evidence and closed obligations normalize to LIVE_VERIFIED', () => {
  const result = evaluateCompletion({
    obligationId:'change-4', workId:'work-change-4', candidateIdentity:CANDIDATE, productionIdentity:PRODUCTION,
    claim:'DEPLOYED_UNVERIFIED', materialObligations:[{ id:'production', status:'VERIFIED' }], evidence:trustedEvidence(),
  });
  assert.equal(result.success, true);
  assert.equal(result.normalized_state, 'LIVE_VERIFIED');
  assert.equal(result.next_action, 'NONE');
  assert.deepEqual(result.open_obligations, []);
});

test('a third identical recovery attempt requires a new hypothesis or proven fallback', () => {
  const result = evaluateCompletion({
    obligationId:'change-5', workId:'work-change-5', candidateIdentity:CANDIDATE, claim:'FAILED',
    materialObligations:[{ id:'production', status:'OPEN' }], retry:{ hypothesis:'same-fix-v1', attemptCount:2, newEvidence:false },
  });
  assert.equal(result.success, false);
  assert.equal(result.next_action, 'RECOVER');
  assert.ok(result.required_evidence.includes('NEW_HYPOTHESIS_OR_FALLBACK'));
});
