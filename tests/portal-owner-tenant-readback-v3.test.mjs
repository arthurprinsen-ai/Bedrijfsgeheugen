import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalForecastHandler} from '../platform/api/portal-forecast-handler.mjs';
import {ownerDecisionIdempotencyKey} from '../portal-v2/owner-operating-system.js';

const tenantId='tenant-verified-a',user={id:'user-42',app_metadata:{tenantId}};
const request=new Request('https://www.bedrijfsgeheugen.nl/api/portal-forecasts');
const json=async response=>({status:response.status,body:await response.json()});

test('authenticated forecast route passes exact request to Netlify Identity',async()=>{
 let actual=null,readTenant=null;
 const handler=createPortalForecastHandler({
  getUser:async req=>{actual=req;return user;},
  getCanonical:async tenant=>{readTenant=tenant;return null;}
 });
 const result=await json(await handler(request));
 assert.equal(actual,request);
 assert.equal(readTenant,tenantId);
 assert.equal(result.status,200);
 assert.deepEqual(result.body,{tenantId,forecasts:[],status:'NO_CANONICAL_FORECASTS'});
});
test('every non-error empty forecast response binds its authenticated tenant',async()=>{
 const handler=createPortalForecastHandler({getUser:async()=>user,getCanonical:async()=>({tenantId,forecasts:[{verified:false,tenantId}]})});
 const result=await json(await handler(request));
 assert.equal(result.status,200);
 assert.deepEqual(result.body,{tenantId,forecasts:[],status:'NO_VALIDATED_FINANCIAL_FORECASTS'});
});
test('wrong-scope review is never shown as customer finance',async()=>{
 const handler=createPortalForecastHandler({getUser:async()=>user,getCanonical:async()=>({
  tenantId:'foreign-tenant',forecasts:[{tenantId:'foreign-tenant',verified:true}]
 })});
 const result=await json(await handler(request));
 assert.equal(result.status,200);
 assert.equal(result.body.tenantId,tenantId);
 assert.deepEqual(result.body.forecasts,[]);
});
test('unverified identity cannot access forecast tenant or canonical store',async()=>{
 let read=false;
 const handler=createPortalForecastHandler({getUser:async()=>null,getCanonical:async()=>{read=true;}});
 const result=await json(await handler(request));
 assert.equal(result.status,401);
 assert.equal(read,false);
 const post=await handler(new Request(request.url,{method:'POST'}));
 assert.equal(post.status,405);
});
test('stable per-decision idempotency survives network or Brain readback timeout',()=>{
 const key=ownerDecisionIdempotencyKey('APPROVE','PH-P006:decision-14','PROPOSED');
 assert.equal(key,ownerDecisionIdempotencyKey('APPROVE','PH-P006:decision-14','PROPOSED'));
 assert.notEqual(key,ownerDecisionIdempotencyKey('REJECT','PH-P006:decision-14','PROPOSED'));
 assert.notEqual(key,ownerDecisionIdempotencyKey('APPROVE','PH-P007:decision-14','PROPOSED'));
 assert.match(key,/^owner:v3:approve:/);
 assert.throws(()=>ownerDecisionIdempotencyKey('START','PH-P006'),/OWNER_DECISION_INVALID/);
 assert.throws(()=>ownerDecisionIdempotencyKey('APPROVE',''),/OWNER_DECISION_INVALID/);
 assert.throws(()=>ownerDecisionIdempotencyKey('APPROVE','PH-P006','DONE'),/OWNER_DECISION_INVALID/);
});
