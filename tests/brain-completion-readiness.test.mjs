import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCompletionReadiness } from '../brain/policy/completion-readiness.mjs';

const CANDIDATE = 'candidate-sha-123';
const PRODUCTION = 'deploy-456:candidate-sha-123';

function proof(type, producer, extra = {}) {
  return { type, producer, accepted:true, independent:true, taskIdentity:'ob-1', candidateIdentity:CANDIDATE, ...extra };
}

const terminalObligations = [{ id:'production-readback', status:'VERIFIED' }];

test('legacy localGreen cannot mint completion without identity-bound production evidence', () => {
  const result = evaluateCompletionReadiness({ obligationId:'ob-1', workId:'work-1', candidateIdentity:CANDIDATE, localGreen:true, materialObligations:terminalObligations });
  assert.equal(result.canComplete, false);
  assert.notEqual(result.state, 'LIVE_VERIFIED');
  assert.ok(result.requiredEvidence.includes('CANDIDATE_TESTS'));
});

test('proven hard boundary with a complete recovery packet can wait but can never complete', () => {
  const result = evaluateCompletionReadiness({
    obligationId:'ob-1', workId:'work-1', candidateIdentity:CANDIDATE,
    materialObligations:[{ id:'production-readback', status:'OPEN' }],
    hardBoundary:{
      present:true, proven:true, evidence:'Provider requires a human permission change.',
      recovery_packet:{
        blocker:'provider permission', root_cause:'provider denied automation', evidence_refs:['provider:403'],
        attempted_repairs:['supported retry'], safe_remaining_actions:['preserve last-known-good'],
        minimum_human_action:'grant permission', fix_agent_handoff:'resume ob-1',
        boundary_fingerprint:'provider|permission|403', resume_when:{ type:'permission', state:'granted' },
      },
    },
  });
  assert.equal(result.canComplete, false);
  assert.equal(result.canWait, true);
  assert.equal(result.state, 'WAIT_EXTERNAL');
});

test('only all seven trusted identity-bound evidence classes plus terminal obligations can complete', () => {
  const production = { productionIdentity:PRODUCTION };
  const result = evaluateCompletionReadiness({
    obligationId:'ob-1', workId:'work-1', candidateIdentity:CANDIDATE, productionIdentity:PRODUCTION,
    materialObligations:terminalObligations,
    evidence:[
      proof('CANDIDATE_TESTS', 'BRAIN_DELIVERY'), proof('PROTECTED_DELIVERY', 'BG169', production),
      proof('PRODUCTION_IDENTITY', 'BG169', production), proof('FUNCTIONAL_READBACK', 'PRODUCTION_READBACK', production),
      proof('OBLIGATIONS_COMPLETE', 'OUTCOME_OBLIGATION_RUNTIME', production), proof('CAPABILITY_HANDOFF', 'BG167', production),
      proof('LEARNING_WRITEBACK', 'BG168_BG166', production),
    ],
  });
  assert.equal(result.canComplete, true);
  assert.equal(result.canWait, false);
  assert.equal(result.state, 'LIVE_VERIFIED');
  assert.deepEqual(result.openObligations, []);
});
