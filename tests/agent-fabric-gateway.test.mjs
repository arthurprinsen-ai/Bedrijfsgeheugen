import test from 'node:test';
import assert from 'node:assert/strict';
import { AGENT_FABRIC_COMMANDS, AGENT_FABRIC_QUERIES, createAgentFabricGateway } from '../platform/api/agent-fabric-gateway.mjs';

const runtime = Object.freeze({ runId:'run-test', actorKind:'agent', actorId:'agent:test', candidateId:'sha-test' });

function fakeFabric() {
  return {
    intake:payload => ({ op:'intake', payload }),
    intakeOpportunity:payload => ({ op:'opportunity', payload }),
    transition:payload => ({ op:'transition', payload }),
    suggestLearning:payload => [{ op:'learning', payload }],
    recordLearning:payload => ({ op:'record-learning', payload }),
    getWork:id => ({ id }),
    listWork:query => [{ tenantId:query?.tenantId ?? null }],
    execute:() => { throw new Error('must never be reachable'); },
    registry:{ secret:true },
  };
}

test('gateway allowlists collaboration commands and queries', async () => {
  const gateway = createAgentFabricGateway({ fabric:fakeFabric() });
  const intake = await gateway.command({ type:AGENT_FABRIC_COMMANDS.INTAKE_SIGNAL, runtime, payload:{ tenantId:'A' } });
  assert.equal(intake.op, 'intake');
  assert.equal(intake.payload.runtimeIngressReceipt.status, 'ADMITTED');
  assert.equal(intake.payload.runtimeIngressReceipt.runId, runtime.runId);
  assert.equal(intake.payload.runtimeIngressReceipt.candidateId, runtime.candidateId);
  assert.equal(intake.payload.runtimeIngressReceipt.policyVersion, 'POWERHOUSE-UNIVERSAL-INGRESS-v1');
  assert.equal(intake.payload.runtimeIngressReceipt.completionPolicyVersion, 'POWERHOUSE-UNIVERSAL-COMPLETION-v1');
  assert.equal(intake.payload.runtimeIngressReceipt.skillVersion, 'POWERHOUSE-LEARNING-SKILL-INDEX-v1');
  assert.equal(intake.payload.runtimeIngressReceipt.deliveryVersion, 'POWERHOUSE-GITHUB-DELIVERY-STATE-MACHINE-v1');
  assert.match(intake.payload.runtimeIngressReceipt.skillProjectionDigest, /^[a-f0-9]{64}$/);
  assert.equal((await gateway.command({ type:AGENT_FABRIC_COMMANDS.INTAKE_OPPORTUNITY, runtime, payload:{ tenantId:'A' } })).op, 'opportunity');
  assert.equal((await gateway.command({ type:AGENT_FABRIC_COMMANDS.TRANSITION_WORK, runtime, payload:{ workId:'W1' } })).op, 'transition');
  assert.equal((await gateway.command({ type:AGENT_FABRIC_COMMANDS.RECORD_LEARNING, runtime, payload:{ workId:'W1' } })).op, 'record-learning');
  assert.equal(gateway.query({ type:AGENT_FABRIC_QUERIES.WORK, payload:{ id:'W1' } }).id, 'W1');
  assert.equal(gateway.query({ type:AGENT_FABRIC_QUERIES.WORK_LIST, payload:{ tenantId:'A' } })[0].tenantId, 'A');
  assert.equal(gateway.query({ type:AGENT_FABRIC_QUERIES.LEARNING_SUGGESTIONS, payload:{ workId:'W1' } })[0].op, 'learning');
});

test('gateway exposes no execution or internal-memory bypass', () => {
  const gateway = createAgentFabricGateway({ fabric:fakeFabric() });
  assert.equal(gateway.execute, undefined);
  assert.equal(gateway.registry, undefined);
  assert.equal(gateway.learningMemory, undefined);
  assert.deepEqual(Object.keys(gateway).sort(), ['command','query']);
});

test('unknown operations fail closed before runtime admission', async () => {
  const gateway = createAgentFabricGateway({ fabric:fakeFabric() });
  await assert.rejects(() => gateway.command({ type:'EXECUTE_CHANGE', runtime, payload:{} }), /unsupported Agent Fabric command/i);
  assert.throws(() => gateway.query({ type:'RAW_MEMORY', payload:{} }), /unsupported Agent Fabric query/i);
});

test('gateway validates the complete Fabric contract at construction', () => {
  assert.throws(() => createAgentFabricGateway({ fabric:{ intake(){} } }), /fabric\.intakeOpportunity is required/i);
});

test('gateway fails closed when material runtime identity is absent or incomplete', async () => {
  const gateway = createAgentFabricGateway({ fabric:fakeFabric() });
  await assert.rejects(() => gateway.command({ type:AGENT_FABRIC_COMMANDS.INTAKE_SIGNAL, payload:{} }), /runtime identity is required/i);
  await assert.rejects(
    () => gateway.command({ type:AGENT_FABRIC_COMMANDS.INTAKE_SIGNAL, runtime:{ ...runtime, candidateId:'' }, payload:{} }),
    /runtime\.candidateId is required/i,
  );
});


test('gateway enforces SaaS agent mode before Executing transition', async () => {
  const fabric=fakeFabric();
  fabric.getWork=()=>({id:'W1',tenantId:'TENANT-A'});
  const recommendGateway=createAgentFabricGateway({
    fabric,
    entitlementResolver:async()=>({organisation_id:'TENANT-A',plan_code:'control',status:'active',entitlements:{agent_mode:'recommend'}}),
  });
  await assert.rejects(
    ()=>recommendGateway.command({type:AGENT_FABRIC_COMMANDS.TRANSITION_WORK,runtime,payload:{workId:'W1',status:'Executing'}}),
    error=>error?.code==='PLAN_RECOMMEND_ONLY',
  );

  const approvalGateway=createAgentFabricGateway({
    fabric,
    entitlementResolver:async()=>({organisation_id:'TENANT-A',plan_code:'scale',status:'active',entitlements:{agent_mode:'approval_required'}}),
  });
  await assert.rejects(
    ()=>approvalGateway.command({type:AGENT_FABRIC_COMMANDS.TRANSITION_WORK,runtime,payload:{workId:'W1',status:'Executing'}}),
    error=>error?.code==='PLAN_APPROVAL_REQUIRED',
  );
  const approved=await approvalGateway.command({
    type:AGENT_FABRIC_COMMANDS.TRANSITION_WORK,
    runtime,
    payload:{workId:'W1',status:'Executing',approvalEvidence:{approved:true,approvedBy:'owner',approvedAt:'2026-09-21T07:00:00Z'}},
  });
  assert.equal(approved.op,'transition');
});

test('gateway fails closed for customer execution without entitlement resolver', async () => {
  const fabric=fakeFabric();
  fabric.getWork=()=>({id:'W1',tenantId:'TENANT-A'});
  const gateway=createAgentFabricGateway({fabric});
  await assert.rejects(
    ()=>gateway.command({type:AGENT_FABRIC_COMMANDS.TRANSITION_WORK,runtime,payload:{workId:'W1',status:'Executing'}}),
    error=>error?.code==='AGENT_ENTITLEMENT_RESOLVER_REQUIRED',
  );
});
