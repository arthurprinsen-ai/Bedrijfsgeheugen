import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateCompletion,
  validateRecoveryPacket,
} from '../platform/agents/completion-supervisor.mjs';

const CANDIDATE = 'candidate-abc123';
const PRODUCTION = 'production-def456';

function proof(type, producer, extra = {}) {
  return {
    type,
    producer,
    accepted:true,
    independent:true,
    taskIdentity:'O1',
    candidateIdentity:CANDIDATE,
    ...extra,
  };
}

function liveVerifiedFixture(overrides = {}) {
  return {
    obligationId:'O1',
    workId:'W1',
    claim:'DEPLOYED_UNVERIFIED',
    candidateIdentity:CANDIDATE,
    productionIdentity:PRODUCTION,
    materialObligations:[{ id:'O1', status:'COMPLETED' }],
    evidence:[
      proof('CANDIDATE_TESTS', 'BRAIN_DELIVERY'),
      proof('PROTECTED_DELIVERY', 'BG169', { productionIdentity:PRODUCTION }),
      proof('PRODUCTION_IDENTITY', 'BG169', { productionIdentity:PRODUCTION }),
      proof('FUNCTIONAL_READBACK', 'PRODUCTION_READBACK', { productionIdentity:PRODUCTION }),
      proof('OBLIGATIONS_COMPLETE', 'OUTCOME_OBLIGATION_RUNTIME', { productionIdentity:PRODUCTION }),
      proof('CAPABILITY_HANDOFF', 'BG167', { productionIdentity:PRODUCTION }),
      proof('LEARNING_WRITEBACK', 'BG168_BG166', { productionIdentity:PRODUCTION }),
    ],
    ...overrides,
  };
}

function recoveryPacket(overrides = {}) {
  return {
    blocker:'Provider permission is unavailable',
    root_cause:'Provider denied the exact required operation',
    evidence_refs:['provider-readback:403'],
    attempted_repairs:['read current provider state'],
    safe_remaining_actions:['retain last-known-good production'],
    minimum_human_action:'grant the existing provider permission',
    fix_agent_handoff:'resume obligation O1 after provider permission readback',
    boundary_fingerprint:'provider|permission|403',
    resume_when:{ type:'evidence', ref:'provider-permission:available' },
    ...overrides,
  };
}

test('localGreen and every partial claim remain active without trusted production evidence', () => {
  for (const claim of ['GREEN','COMMITTED','MERGED','PREVIEW_READY','DEPLOYED_UNVERIFIED','NOT_CLAIMED','DEELS LIVE','NIET GEDAAN','FAILED','RED','AWAITING_OUTCOME','MISSED_OBLIGATION','RECOVERING']) {
    const result = evaluateCompletion({ obligationId:'O1', workId:'W1', claim, localGreen:true, candidateIdentity:CANDIDATE });
    assert.equal(result.success, false, claim);
    assert.notEqual(result.normalized_state, 'LIVE_VERIFIED', claim);
    assert.ok(['CONTINUE','RECOVER','PROMOTE','READBACK','WRITEBACK'].includes(result.next_action), claim);
  }
});

test('only a complete identity-bound trusted evidence bundle becomes LIVE_VERIFIED', () => {
  const result = evaluateCompletion(liveVerifiedFixture());
  assert.equal(result.success, true);
  assert.equal(result.normalized_state, 'LIVE_VERIFIED');
  assert.equal(result.next_action, 'NONE');
  assert.deepEqual(result.open_obligations, []);
  assert.deepEqual(result.required_evidence, []);
  assert.equal(result.canWait, false);
  assert.equal(result.candidateIdentity, CANDIDATE);
  assert.equal(result.productionIdentity, PRODUCTION);
});

test('identity mismatch stays active and requests readback', () => {
  const input = liveVerifiedFixture({ productionIdentity:'production-new789' });
  const result = evaluateCompletion(input);
  assert.equal(result.success, false);
  assert.equal(result.next_action, 'READBACK');
  assert.ok(result.required_evidence.includes('IDENTITY_MATCH'));
});

test('untrusted local evidence cannot close a completion obligation', () => {
  const input = liveVerifiedFixture();
  input.evidence = input.evidence.map(item => item.type === 'FUNCTIONAL_READBACK'
    ? { ...item, producer:'LOCAL_AGENT' }
    : item);
  const result = evaluateCompletion(input);
  assert.equal(result.success, false);
  assert.ok(result.required_evidence.includes('FUNCTIONAL_READBACK'));
});

test('a proven hard boundary waits but never completes', () => {
  const result = evaluateCompletion({
    obligationId:'O1',
    workId:'W1',
    claim:'BLOCKED_HARD_BOUNDARY',
    candidateIdentity:CANDIDATE,
    hardBoundary:{ present:true, proven:true, evidence:'provider-readback:403', recovery_packet:recoveryPacket() },
  });
  assert.equal(result.success, false);
  assert.equal(result.canWait, true);
  assert.equal(result.normalized_state, 'WAIT_EXTERNAL');
  assert.equal(result.next_action, 'WAIT_EXTERNAL');
  assert.deepEqual(result.recovery_packet, recoveryPacket());
  assert.deepEqual(result.resume_when, recoveryPacket().resume_when);
});

test('an incomplete hard-boundary packet remains recovery work', () => {
  const packet = recoveryPacket();
  delete packet.minimum_human_action;
  const result = evaluateCompletion({
    obligationId:'O1',
    workId:'W1',
    hardBoundary:{ present:true, proven:true, evidence:'provider-readback:403', recovery_packet:packet },
  });
  assert.equal(result.success, false);
  assert.equal(result.canWait, false);
  assert.equal(result.next_action, 'RECOVER');
  assert.ok(result.required_evidence.includes('RECOVERY_PACKET'));
});

test('recovery packet validation reports exact missing fields', () => {
  const packet = recoveryPacket({ blocker:'' });
  delete packet.resume_when;
  assert.deepEqual(validateRecoveryPacket(packet), {
    valid:false,
    missing:['blocker','resume_when'],
  });
});

test('retry budget requires a new hypothesis after two identical attempts', () => {
  const result = evaluateCompletion({
    obligationId:'O1',
    workId:'W1',
    candidateIdentity:CANDIDATE,
    retry:{ hypothesis:'retry-the-same-deploy', attemptCount:2, newEvidence:false },
  });
  assert.equal(result.success, false);
  assert.equal(result.next_action, 'RECOVER');
  assert.ok(result.required_evidence.includes('NEW_HYPOTHESIS_OR_FALLBACK'));
});

test('same logical evidence produces the same idempotency key regardless of evidence order', () => {
  const first = evaluateCompletion(liveVerifiedFixture());
  const secondInput = liveVerifiedFixture();
  secondInput.evidence = [...secondInput.evidence].reverse();
  const second = evaluateCompletion(secondInput);
  assert.equal(first.idempotency_key, second.idempotency_key);
});
