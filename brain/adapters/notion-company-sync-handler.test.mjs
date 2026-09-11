import test from 'node:test';
import assert from 'node:assert/strict';
import {createNotionCompanySyncHandler} from '../../platform/api/notion-company-sync-handler.mjs';

const request=()=>new Request('https://example.test/api/company-decision-notion-sync',{method:'POST'});
const projection={tenantId:'t1',companyDecisions:[{id:'d1',title:'X'}],approvalQueue:[],decisionEconomics:{realizedProfit:0},auditTimeline:[]};

test('sync handler is authenticated, tenant scoped and publishes only canonical projection',async()=>{
  const seen=[];
  const handler=createNotionCompanySyncHandler({
    getUser:async()=>({id:'u1',app_metadata:{tenant_id:'t1'}}),
    resolveTenant:()=> 't1',
    store:{getProjection:async tenantId=>{assert.equal(tenantId,'t1');return projection;}},
    sync:async canonical=>{seen.push(canonical);return {attempted:1,succeeded:1,failed:0,errors:[]};}
  });
  const response=await handler(request());
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.status,'SYNCED');
  assert.equal(seen[0],projection);
});

test('sync handler fails closed for unauthenticated or unavailable configuration',async()=>{
  const unauthenticated=createNotionCompanySyncHandler({getUser:async()=>null,resolveTenant:()=>null,store:{getProjection:async()=>projection},sync:async()=>({})});
  assert.equal((await unauthenticated(request())).status,401);

  const broken=createNotionCompanySyncHandler({getUser:async()=>({id:'u1'}),resolveTenant:()=> 't1',store:{getProjection:async()=>projection},sync:async()=>{throw new Error('NOTION_TOKEN is required');}});
  const response=await broken(request());
  assert.equal(response.status,503);
  const body=await response.json();
  assert.equal(body.status,'BLOCKED');
  assert.match(body.error,/NOTION_TOKEN/);
});

test('partial Notion failures never return SYNCED',async()=>{
  const handler=createNotionCompanySyncHandler({getUser:async()=>({id:'u1'}),resolveTenant:()=> 't1',store:{getProjection:async()=>projection},sync:async()=>({attempted:1,succeeded:0,failed:1,errors:[{message:'boom'}]})});
  const response=await handler(request());
  assert.equal(response.status,502);
  assert.equal((await response.json()).status,'PARTIAL_FAILURE');
});
