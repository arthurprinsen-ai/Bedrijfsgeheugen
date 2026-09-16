import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentRegistry } from '../platform/agents/agent-registry.mjs';
import { createAgentFabric } from '../platform/agents/agent-fabric.mjs';

const registry = () => createAgentRegistry([
  { id:'agent-ux', domains:['Website'], capabilities:['analyze'] }
]);

function advanceToVerifying(fabric, workId) {
  fabric.transition({ workId, status:'Investigating' });
  fabric.transition({ workId, status:'FixPrepared' });
  fabric.transition({ workId, status:'Executing' });
  return fabric.transition({ workId, status:'Verifying' });
}

test('a proven hard boundary never resolves AgentWork and keeps the same item resumable', () => {
  const fabric = createAgentFabric({ registry:registry() });
  const signal = {
    tenantId:'TENANT-A',
    kind:'Failure',
    problemClass:'external-hard-boundary',
    priority:'P1',
    domains:['Website'],
    capabilities:['analyze'],
    affectedObjectIds:['portal'],
    problem:'External control blocks recovery'
  };

  const work = fabric.intake(signal);
  advanceToVerifying(fabric, work.id);

  const completionContext = {
    obligationId:'completion-hard-boundary',
    candidateIdentity:'candidate-hard-boundary',
    localGreen:false,
    materialObligations:[{ id:'production-smoke', status:'OPEN' }],
    hardBoundary:{
      present:true,
      proven:true,
      evidence:'External provider denied the required control change.',
      recovery_packet:{
        blocker:'External control blocks recovery',
        root_cause:'External provider denied the required control change',
        evidence_refs:['provider:denied'],
        attempted_repairs:['retry supported provider route'],
        safe_remaining_actions:['preserve last-known-good production'],
        minimum_human_action:'grant the existing provider permission',
        fix_agent_handoff:'resume the same completion-hard-boundary work item',
        boundary_fingerprint:'provider|control|denied',
        resume_when:{ type:'provider_permission', state:'granted' },
      },
    }
  };

  assert.throws(() => fabric.transition({
    workId:work.id,
    status:'Resolved',
    completionContext
  }), /completion readiness/i);

  const waiting = fabric.transition({
    workId:work.id,
    status:'WaitingApproval',
    completionContext
  });
  assert.equal(waiting.status, 'WaitingApproval');

  const duplicateSignal = fabric.intake(signal);
  assert.equal(duplicateSignal.id, work.id);
  assert.equal(fabric.listWork({ tenantId:'TENANT-A' }).length, 1);

  const resumed = fabric.transition({ workId:work.id, status:'Investigating' });
  assert.equal(resumed.id, work.id);
  assert.equal(resumed.status, 'Investigating');
});
