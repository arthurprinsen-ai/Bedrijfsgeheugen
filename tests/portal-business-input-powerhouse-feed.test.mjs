import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortalBusinessInputHandler } from '../platform/api/portal-business-input-handler.mjs';

const requestFor=body=>new Request('https://example.test/api/portal-business-input',{
  method:'POST',
  headers:{'content-type':'application/json','authorization':'Bearer test'},
  body:JSON.stringify(body)
});

function harness({append}={}){
  const writes=[];
  const authority={async append(input){writes.push(input);if(append)return append(input,writes);return{authority:'supabase:brain_records',record:input.record};}};
  const store={async getLayer(){return null;},async putCanonical(_tenantId,record){return{stored:true,stale:false,record};}};
  const handler=createPortalBusinessInputHandler({
    getUser:async()=>({id:'user-1',app_metadata:{tenantId:'tenant-1'}}),
    store,
    authority,
    now:()=> '2026-09-17T19:20:00.000Z'
  });
  return {handler,writes};
}

test('authenticated portal input feeds Powerhouse as one idempotent CurrentState derived from immutable BusinessInput',async()=>{
  const {handler,writes}=harness();
  const response=await handler(requestFor({inputType:'AIActAssessment',modelId:'eu-ai-act',answers:{usesAI:true,humanOversight:false},sourcePortal:'portal-v2'}));
  const payload=await response.json();
  assert.equal(response.status,200);
  assert.equal(writes.length,2);
  const [source,current]=writes;
  assert.equal(source.record.type,'BusinessInput');
  assert.equal(source.record.kind,'SourceTruth');
  assert.equal(current.record.type,'CurrentState');
  assert.equal(current.record.kind,'current_state');
  assert.deepEqual(current.record.predecessorIds,[source.record.id]);
  assert.deepEqual(current.record.evidenceIds,[source.record.id]);
  assert.equal(current.record.correlationId,source.record.correlationId);
  assert.equal(current.record.subjectId,source.record.subjectId);
  assert.equal(current.record.payload.sourceRecordId,source.record.id);
  assert.equal(current.record.payload.sourceRevision,payload.sourceRevision);
  assert.equal(current.record.payload.inputType,'AIActAssessment');
  assert.deepEqual(current.record.payload.answers,{usesAI:true,humanOversight:false});
  assert.equal(current.idempotencyKey,`portal-business-current-state:${payload.sourceRevision}`);
  assert.equal(payload.powerhouseFeedStored,true);
  assert.equal(payload.currentStateRecordId,current.record.id);
});

test('portal projection stays fail-closed when Powerhouse CurrentState feed cannot be stored',async()=>{
  let projectionWrites=0;
  const writes=[];
  const authority={async append(input){writes.push(input);if(input.record.type==='CurrentState')throw new Error('feed unavailable');return{authority:'supabase:brain_records',record:input.record};}};
  const store={async getLayer(){return null;},async putCanonical(){projectionWrites++;return{stored:true};}};
  const handler=createPortalBusinessInputHandler({getUser:async()=>({id:'user-1',app_metadata:{tenantId:'tenant-1'}}),store,authority,now:()=> '2026-09-17T19:20:00.000Z'});
  const response=await handler(requestFor({inputType:'StrategyCanvas',modelId:'strategy-dna',answers:{ambition:'Grow'},sourcePortal:'portal-v2'}));
  const payload=await response.json();
  assert.equal(response.status,502);
  assert.equal(payload.error,'POWERHOUSE_FEED_WRITE_FAILED');
  assert.equal(payload.authorityStored,true);
  assert.equal(payload.powerhouseFeedStored,false);
  assert.equal(projectionWrites,0);
  assert.equal(writes.length,2);
});
