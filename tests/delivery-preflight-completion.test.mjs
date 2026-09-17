import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as preflight from '../tools/delivery-preflight.mjs';
import { bindPowerhouseSession } from '../scripts/brain/powerhouse-session-gateway.mjs';

function sessionReceipt(runId = 'completion-1', candidateId = 'candidate-1') {
  return bindPowerhouseSession({
    sessionId:'delivery-preflight-test',
    runId,
    observedAt:'2026-09-17T11:50:00+02:00',
    candidateId,
    preflightPacket:{
      status:'READY',
      fastExecution:{ version:'POWERHOUSE-FAST-EXECUTION-v1' },
      universalCompletion:{ version:'POWERHOUSE-UNIVERSAL-COMPLETION-v1' },
      sessionBinding:{ version:'POWERHOUSE-SESSION-BINDING-v1' },
      sources:[], fingerprints:[], preventions:[], blockers:[], resume_contracts:[]
    }
  });
}

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
  assert.equal(decision.state, 'RECOVERING');
  assert.deepEqual(decision.openObligations, ['delivery','production']);
});

test('delivery preflight allows completion only for identity-bound LIVE_VERIFIED evidence', () => {
  assert.equal(typeof preflight.evaluateCompletionReadiness, 'function');
  const allGreen = preflight.evaluateCompletionReadiness({
    obligationId:'completion-1',
    workId:'work-1',
    candidateIdentity:'candidate-1',
    productionIdentity:'production-1',
    sessionReceipt:sessionReceipt(),
    materialObligations:[{ id:'completion-1', status:'COMPLETED' }],
    evidence:[
      { type:'CANDIDATE_TESTS', producer:'BRAIN_DELIVERY', accepted:true, independent:true, taskIdentity:'completion-1', candidateIdentity:'candidate-1' },
      ...['PROTECTED_DELIVERY:BG169','PRODUCTION_IDENTITY:BG169','FUNCTIONAL_READBACK:PRODUCTION_READBACK','OBLIGATIONS_COMPLETE:OUTCOME_OBLIGATION_RUNTIME','CAPABILITY_HANDOFF:BG167','LEARNING_WRITEBACK:BG168_BG166'].map(value => {
        const [type, producer] = value.split(':');
        return { type, producer, accepted:true, independent:true, taskIdentity:'completion-1', candidateIdentity:'candidate-1', productionIdentity:'production-1' };
      }),
    ],
  });
  assert.equal(allGreen.canComplete, true);
  assert.equal(allGreen.state, 'LIVE_VERIFIED');

  const unprovenBoundary = preflight.evaluateCompletionReadiness({
    localGreen: true,
    materialObligations: [{ id: 'production', status: 'OPEN' }],
    hardBoundary: { present: true, proven: false }
  });
  assert.equal(unprovenBoundary.canComplete, false);
  assert.equal(unprovenBoundary.state, 'RECOVERING');

  const provenBoundary = preflight.evaluateCompletionReadiness({
    obligationId:'completion-1',
    workId:'work-1',
    candidateIdentity:'candidate-1',
    sessionReceipt:sessionReceipt(),
    materialObligations: [{ id: 'production', status: 'OPEN' }],
    hardBoundary: {
      present:true,
      proven:true,
      evidence:'connector capability unavailable after read-only verification',
      recovery_packet:{
        blocker:'Connector capability unavailable',
        root_cause:'Provider denied the operation',
        evidence_refs:['provider:403'],
        attempted_repairs:['read current provider state'],
        safe_remaining_actions:['retain last-known-good'],
        minimum_human_action:'enable the existing capability',
        fix_agent_handoff:'resume completion-1 after capability readback',
        boundary_fingerprint:'provider|capability|403',
        resume_when:{ type:'evidence', ref:'provider:available' },
      },
    },
  });
  assert.equal(provenBoundary.canComplete, false);
  assert.equal(provenBoundary.canWait, true);
  assert.equal(provenBoundary.state, 'WAIT_EXTERNAL');
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
