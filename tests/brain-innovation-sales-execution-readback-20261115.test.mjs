import test from 'node:test';
import assert from 'node:assert/strict';
import {readOriginalSalesExecutionAudit,projectPowerhouseIntegrationReadback}
  from '../platform/portal/powerhouse-existing-integration-read-model.mjs';

const a='11111111-1111-4111-8111-111111111111';
const b='22222222-2222-4222-8222-222222222222';
const at='2026-11-15T12:00:00Z';

test('original action-source join distinguishes internal execution from an unproved event',async()=>{
 const calls=[];
 const audit=await readOriginalSalesExecutionAudit({
   baseUrl:'https://example.supabase.co',key:'sample-key',at,
   fetchImpl:async(url,options)=>{
     calls.push({url,method:options.method});
     const table=new URL(url).pathname.split('/').at(-1);
     if(table==='powerhouse_cycle_events'){
       assert.equal(options.headers.prefer,'count=exact');
       return {ok:true,headers:{get:()=> '0-1/2'},json:async()=>[
         {entity_id:a,occurred_at:'2026-11-15T11:00:00Z'},
         {entity_id:b,occurred_at:'2026-11-15T10:30:00Z'}
       ]};
     }
     assert.equal(table,'powerhouse_sales_actions');
     return {ok:true,json:async()=>[
       {action_id:a,status:'done',executed_at:'2026-11-15T10:59:00Z'},
       {action_id:b,status:'expired',executed_at:null}
     ]};
   }
 });
 assert.equal(calls.length,2);
 assert.ok(calls.every(call=>call.method===undefined));
 assert.equal(audit.state,'SOURCE_EXECUTION_GAP');
 assert.equal(audit.totalEvents7d,2);
 assert.equal(audit.actionBackedSample,1);
 assert.equal(audit.unsupportedSample,1);
 assert.equal(audit.externalProviderProof,false);
 const projected=projectPowerhouseIntegrationReadback({salesExecutionAudit:audit});
 assert.ok(projected.gapCodes.includes('SALES_EXECUTION_EVENTS_WITHOUT_CURRENT_ACTION_PROOF'));
 assert.doesNotMatch(JSON.stringify(audit),/sample-key|11111111-1111|22222222-2222/);
});

test('partial provider count and invalid identity cannot generate positive execution proof',async()=>{
 const cases=[
   {range:null,events:[{entity_id:a,occurred_at:'2026-11-15T11:00:00Z'}]},
   {range:'0-1/2',events:[{entity_id:a,occurred_at:'2026-11-15T11:00:00Z'}]},
   {range:'0-0/1',events:[{entity_id:'invalid',occurred_at:'2026-11-15T11:00:00Z'}]},
 ];
 for(const item of cases){
   const result=await readOriginalSalesExecutionAudit({
     baseUrl:'https://example.supabase.co',key:'sample-key',at,
     fetchImpl:async()=>({ok:true,headers:{get:()=>item.range},json:async()=>item.events})
   });
   assert.equal(result.state,'SOURCE_UNAVAILABLE');
   assert.equal(result.actionBackedSample,null);
 }
});

test('empty event source reports observed zero without claiming end-to-end delivery',async()=>{
 const result=await readOriginalSalesExecutionAudit({
   baseUrl:'https://example.supabase.co',key:'sample-key',at,
   fetchImpl:async()=>({ok:true,headers:{get:()=> '*/0'},json:async()=>[]})
 });
 assert.equal(result.state,'NO_EXECUTION_EVENTS_OBSERVED');
 assert.equal(result.totalEvents7d,0);
 assert.equal(result.externalProviderProof,false);
});
