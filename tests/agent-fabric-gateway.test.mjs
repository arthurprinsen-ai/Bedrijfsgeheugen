import test from 'node:test';
import assert from 'node:assert/strict';
import { AGENT_FABRIC_COMMANDS, AGENT_FABRIC_QUERIES, createAgentFabricGateway } from '../platform/api/agent-fabric-gateway.mjs';

const runtime = Object.freeze({ runId:'run-test', actorKind:'agent', actorId:'agent:test', candidateId:'sha-test' });

function fakeRuntimeIngress() {
  return {
    beginMaterialRun(input) {
      return Object.freeze({
        version:'POWERHOUSE-UNIVERSAL-INGRESS-v1',
        status:'ADMITTED',
        runId:input.runId,
        actorKind:input.actorKind,
        actorId:input.actorId,
        candidateId:input.candidateId,
        preflightVersion:'BRAIN-CHAT-LEARNING-PREFLIGHT-v1',
        preflightStatus:'READY',
        preflightDigest:'a'.repeat(64),
        receiptDigest:'b'.repeat(64),
        observedAt:'2026-09-17T18:45:00.000Z',
      });
    },
  };
}

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
  const gateway = createAgentFabricGateway({ fabric:fakeFabric(), runtimeIngress:fakeRuntimeIngress() });
  const intake = await gateway.command({ type:AGENT_FABRIC_COMMANDS.INTAKE_SIGNAL, runtime, payload:{ tenantId:'A' } });
  assert.equal(intake.op, 'intake');
  assert.equal(intake.payload.runtimeIngressReceipt.status, 'ADMITTED');
  assert.equal((await gateway.command({ type:AGENT_FABRIC_COMMANDS.INTAKE_OPPORTUNITY, runtime, payload:{ tenantId:'A' } })).op, 'opportunity');
  assert.equal((await gateway.command({ type:AGENT_FABRIC_COMMANDS.TRANSITION_WORK, runtime, payload:{ workId:'W1' } })).op, 'transition');
  assert.equal((await gateway.command({ type:AGENT_FABRIC_COMMANDS.RECORD_LEARNING, runtime, payload:{ workId:'W1' } })).op, 'record-learning');
  assert.equal(gateway.query({ type:AGENT_FABRIC_QUERIES.WORK, payload:{ id:'W1' } }).id, 'W1');
  assert.equal(gateway.query({ type:AGENT_FABRIC_QUERIES.WORK_LIST, payload:{ tenantId:'A' } })[0].tenantId, 'A');
  assert.equal(gateway.query({ type:AGENT_FABRIC_QUERIES.LEARNING_SUGGESTIONS, payload:{ workId:'W1' } })[0].op, 'learning');
});

test('gateway exposes no execution or internal-memory bypass', () => {
  const gateway = createAgentFabricGateway({ fabric:fakeFabric(), runtimeIngress:fakeRuntimeIngress() });
  assert.equal(gateway.execute, undefined);
  assert.equal(gateway.registry, undefined);
  assert.equal(gateway.learningMemory, undefined);
  assert.deepEqual(Object.keys(gateway).sort(), ['command','query']);
});

test('unknown operations fail closed', async () => {
  const gateway = createAgentFabricGateway({ fabric:fakeFabric(), runtimeIngress:fakeRuntimeIngress() });
  await assert.rejects(() => gateway.command({ type:'EXECUTE_CHANGE', runtime, payload:{} }), /unsupported Agent Fabric command/i);
  assert.throws(() => gateway.query({ type:'RAW_MEMORY', payload:{} }), /unsupported Agent Fabric query/i);
});

test('gateway validates the complete Fabric contract at construction', () => {
  assert.throws(() => createAgentFabricGateway({ fabric:{ intake(){} }, runtimeIngress:fakeRuntimeIngress() }), /fabric\.intakeOpportunity is required/i);
  assert.throws(() => createAgentFabricGateway({ fabric:fakeFabric() }), /runtimeIngress\.beginMaterialRun is required/i);
});

test('gateway fails closed when runtime identity is absent or receipt identity drifts', async () => {
  const gateway = createAgentFabricGateway({ fabric:fakeFabric(), runtimeIngress:fakeRuntimeIngress() });
  await assert.rejects(() => gateway.command({ type:AGENT_FABRIC_COMMANDS.INTAKE_SIGNAL, payload:{} }), /runtime identity is required/i);

  const driftingIngress = fakeRuntimeIngress();
  driftingIngress.beginMaterialRun = input => ({ ...fakeRuntimeIngress().beginMaterialRun(input), candidateId:'different-sha' });
  const driftingGateway = createAgentFabricGateway({ fabric:fakeFabric(), runtimeIngress:driftingIngress });
  await assert.rejects(
    () => driftingGateway.command({ type:AGENT_FABRIC_COMMANDS.INTAKE_SIGNAL, runtime, payload:{} }),
    /UNIVERSAL_INGRESS_ADMISSION_FAILED candidateId mismatch/,
  );
});
