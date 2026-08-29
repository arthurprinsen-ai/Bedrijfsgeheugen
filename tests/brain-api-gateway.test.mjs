import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrainGateway, BRAIN_COMMANDS, BRAIN_QUERIES } from '../platform/api/brain-gateway.mjs';

test('brain gateway exposes one explicit command surface and never arbitrary runtime methods', async () => {
  const calls = [];
  const runtime = Object.freeze({
    ingest(payload, meta) { calls.push(['ingest', payload, meta]); return { ok:true }; },
    async analyze(payload) { calls.push(['analyze', payload]); return { recommendation:{ id:'R1' } }; },
    recordDecision(payload) { calls.push(['decision', payload]); return { decision:{ id:'D1' } }; },
    async executeChange(payload) { calls.push(['execute', payload]); return { change:{ id:'C1' } }; },
    verifyAndLearn(payload) { calls.push(['verify', payload]); return { verification:{ status:'Verified' } }; },
    async selfHeal(payload) { calls.push(['heal', payload]); return { state:'Resolved' }; },
    snapshot() { return { events:[1,2], activeObjects:new Map([['A',{}]]), workingObjects:new Map(), recommendations:new Map(), decisions:new Map(), learning:[{}], agentWork:new Map() }; },
    dangerousInternalMethod() { throw new Error('must never be reachable'); },
  });
  const gateway = createBrainGateway({ runtime });

  await gateway.command({ type:BRAIN_COMMANDS.INGEST_SIGNAL, payload:{ id:'S1' }, actorId:'source-adapter' });
  await gateway.command({ type:BRAIN_COMMANDS.ANALYZE_SIGNAL, payload:{ signalId:'S1' } });
  await gateway.command({ type:BRAIN_COMMANDS.RECORD_DECISION, payload:{ recommendationId:'R1' } });
  await gateway.command({ type:BRAIN_COMMANDS.EXECUTE_CHANGE, payload:{ changeId:'C1' } });
  await gateway.command({ type:BRAIN_COMMANDS.VERIFY_AND_LEARN, payload:{ changeId:'C1' } });
  await gateway.command({ type:BRAIN_COMMANDS.SELF_HEAL, payload:{ failureId:'F1' } });
  assert.deepEqual(calls.map(c => c[0]), ['ingest','analyze','decision','execute','verify','heal']);
  await assert.rejects(() => gateway.command({ type:'dangerousInternalMethod', payload:{} }), /unsupported|unknown/i);
});

test('brain status query returns metadata counts only, never raw canonical/business payloads', () => {
  const runtime = Object.freeze({
    snapshot() {
      return {
        events:[{ raw:'SECRET' }], activeObjects:new Map([['A',{ private:'SECRET' }]]), workingObjects:new Map([['W',{}]]),
        recommendations:new Map([['R',{}]]), decisions:new Map([['D',{}]]), learning:[{ private:'SECRET' }], agentWork:new Map([['J',{}]]),
      };
    },
  });
  const gateway = createBrainGateway({ runtime });
  const status = gateway.query({ type:BRAIN_QUERIES.STATUS });
  assert.deepEqual(status, { events:1, activeObjects:1, workingObjects:1, recommendations:1, decisions:1, learning:1, agentWork:1 });
  assert.equal(JSON.stringify(status).includes('SECRET'), false);
  assert.throws(() => gateway.query({ type:'SNAPSHOT_RAW' }), /unsupported|unknown/i);
});
