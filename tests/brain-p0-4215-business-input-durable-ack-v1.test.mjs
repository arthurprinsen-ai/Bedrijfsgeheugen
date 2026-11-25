import test from 'node:test';
import assert from 'node:assert/strict';
import {savePortalBusinessInput} from '../portal-v2/business-input-store.js';
import {createPortalBusinessInputHandler} from '../platform/api/portal-business-input-handler.mjs';

// Canonical learning compiler runs this test in historical replay, shadow and canary
// modes. All writes stay in isolated doubles: there are no fake live customer claims.
const input={inputType:'StrategyModel',modelId:'strategy-dna',answers:{goal:'Safe save'},sourcePortal:'portal-v2'};
const response=body=>({ok:true,status:200,json:async()=>body});
const ack={stored:true,stale:false,authorityStored:true,powerhouseFeedStored:true,organismImpactStored:true,sourceRevision:'revision-1',brainRecordId:'source-1',currentStateRecordId:'state-1',organismImpactRecordId:'impact-1'};

test('positive canonical + Brain lineage ACK is required even on HTTP 200',async()=>{
  const failing=[
    {...ack,stored:false},
    {...ack,stale:true},
    {...ack,powerhouseFeedStored:false},
    {...ack,organismImpactRecordId:undefined}
  ];
  for(const body of failing){
    await assert.rejects(
      ()=>savePortalBusinessInput(input,{authorization:'Bearer scoped',fetchFn:async()=>response(body)}),
      /PORTAL_BUSINESS_INPUT_ACK_INCOMPLETE/
    );
  }
  const result=await savePortalBusinessInput(input,{authorization:'Bearer scoped',fetchFn:async()=>response(ack)});
  assert.equal(result.brainRecordId,'source-1');
});

test('canonical projection refusal is not reported as a successful save by API',async()=>{
  for(const {storeAck,status,error} of [
    {storeAck:{stored:false,stale:true},status:409,error:'CANONICAL_PROJECTION_STALE'},
    {storeAck:{stored:false,stale:false},status:503,error:'CANONICAL_PROJECTION_NOT_STORED'}
  ]){
    let appendCount=0;
    const handler=createPortalBusinessInputHandler({
      getUser:async()=>({id:'u-1',app_metadata:{tenantId:'tenant-a'}}),
      store:{async getLayer(){return null},async putCanonical(){return storeAck}},
      authority:{async append({record}){appendCount++;return{authority:'supabase:brain_records',record}}},
      now:()=> '2026-10-09T08:00:00.000Z'
    });
    const request=new Request('https://example.test/api/portal-business-input',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer scoped'},body:JSON.stringify(input)});
    const result=await handler(request);
    const body=await result.json();
    assert.equal(result.status,status);
    assert.equal(body.error,error);
    assert.equal(body.authorityStored,true);
    assert.equal(appendCount,4);
  }
});
