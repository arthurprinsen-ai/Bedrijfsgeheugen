import test from 'node:test';
import assert from 'node:assert/strict';
import { createIntegrationStateEmitter } from '../brain/operating-loop/integration-state-emitter.mjs';

test('emitter maps one source snapshot to CurrentState and posts it idempotently', async () => {
  const posted=[];
  const client={post:async(record,options)=>{posted.push({record,options});return {duplicate:false,record};}};
  const emitter=createIntegrationStateEmitter({client});
  const result=await emitter.emit({
    tenantId:'tenant-a',source:'make',id:'state-bg139',component:'BG139',
    raw:{scenario_id:'7148743',execution_id:'exec-10',observed_at:'2026-08-30T18:30:00Z'},
    health:'healthy',owner:'BG159',revision:'v13',executionStatus:'ready',verified:true
  });
  assert.equal(posted.length,1);
  assert.equal(posted[0].record.type,'CurrentState');
  assert.equal(posted[0].record.provenance.sourceId,'7148743:exec-10');
  assert.equal(posted[0].options.idempotencyKey,'current-state:make:7148743:exec-10');
  assert.equal(result.record.payload.integration.component,'BG139');
});

test('emitter requires a post-capable client and source identity remains fail-closed', async () => {
  assert.throws(()=>createIntegrationStateEmitter({client:{}}),/client/i);
  const emitter=createIntegrationStateEmitter({client:{post:async()=>({})}});
  await assert.rejects(()=>emitter.emit({tenantId:'t',source:'github',id:'x',component:'repo',raw:{repository:'r'}}),/identity incomplete/);
});
