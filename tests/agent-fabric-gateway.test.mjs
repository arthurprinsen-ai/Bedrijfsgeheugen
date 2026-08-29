import test from 'node:test';
import assert from 'node:assert/strict';
import { AGENT_FABRIC_COMMANDS, AGENT_FABRIC_QUERIES, createAgentFabricGateway } from '../platform/api/agent-fabric-gateway.mjs';

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
  assert.equal((await gateway.command({ type:AGENT_FABRIC_COMMANDS.INTAKE_SIGNAL, payload:{ tenantId:'A' } })).op, 'intake');
  assert.equal((await gateway.command({ type:AGENT_FABRIC_COMMANDS.INTAKE_OPPORTUNITY, payload:{ tenantId:'A' } })).op, 'opportunity');
  assert.equal((await gateway.command({ type:AGENT_FABRIC_COMMANDS.TRANSITION_WORK, payload:{ workId:'W1' } })).op, 'transition');
  assert.equal((await gateway.command({ type:AGENT_FABRIC_COMMANDS.RECORD_LEARNING, payload:{ workId:'W1' } })).op, 'record-learning');
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

test('unknown operations fail closed', async () => {
  const gateway = createAgentFabricGateway({ fabric:fakeFabric() });
  await assert.rejects(() => gateway.command({ type:'EXECUTE_CHANGE', payload:{} }), /unsupported Agent Fabric command/i);
  assert.throws(() => gateway.query({ type:'RAW_MEMORY', payload:{} }), /unsupported Agent Fabric query/i);
});

test('gateway validates the complete Fabric contract at construction', () => {
  assert.throws(() => createAgentFabricGateway({ fabric:{ intake(){} } }), /fabric\.intakeOpportunity is required/i);
});
