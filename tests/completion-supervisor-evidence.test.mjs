import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveTrustedCompletionEvidence } from '../tools/completion-supervisor-evidence.mjs';

const CANDIDATE = 'a'.repeat(40);
const PRODUCTION = 'b'.repeat(40);
const base = { obligationId:'material-change-live-verification', candidateIdentity:CANDIDATE, productionIdentity:PRODUCTION, runId:'4242' };

test('successful candidate delivery mints candidate tests only', () => {
  const evidence = deriveTrustedCompletionEvidence({ ...base, sourceWorkflow:'Unified Brain Delivery', conclusion:'success' });
  assert.deepEqual(evidence.map(item => item.type), ['CANDIDATE_TESTS']);
  assert.equal(evidence[0].producer, 'BRAIN_DELIVERY');
});

test('validated BG169 artifact mints exact protected delivery identities', () => {
  const bg169 = { authority:'BG169', candidate_sha:CANDIDATE, expected_head_sha:CANDIDATE, production_sha:PRODUCTION, execution_proof:true, verified:true };
  const evidence = deriveTrustedCompletionEvidence({ ...base, sourceWorkflow:'Unified Brain Delivery', conclusion:'success', bg169 });
  assert.deepEqual(evidence.map(item => item.type), ['CANDIDATE_TESTS','PROTECTED_DELIVERY','PRODUCTION_IDENTITY']);
  assert.ok(evidence.every(item => item.candidateIdentity === CANDIDATE));
});

test('exact successful production readback mints readback, handoff and learning evidence', () => {
  const readback = { merge_sha:PRODUCTION, status:'LIVE_VERIFIED', routes_ok:true };
  const evidence = deriveTrustedCompletionEvidence({ ...base, sourceWorkflow:'Production Release Readback', conclusion:'success', readback, capabilityHandoff:true, learningWriteback:true });
  assert.deepEqual(evidence.map(item => item.type), ['FUNCTIONAL_READBACK','CAPABILITY_HANDOFF','LEARNING_WRITEBACK']);
});

test('failed or mismatched source evidence mints nothing and fails closed', () => {
  assert.deepEqual(deriveTrustedCompletionEvidence({ ...base, sourceWorkflow:'Unified Brain Delivery', conclusion:'failure' }), []);
  assert.throws(() => deriveTrustedCompletionEvidence({ ...base, sourceWorkflow:'Production Release Readback', conclusion:'success', readback:{ merge_sha:CANDIDATE, status:'LIVE_VERIFIED', routes_ok:true } }), /production identity mismatch/);
});
