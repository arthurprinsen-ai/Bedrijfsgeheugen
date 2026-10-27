import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalStateHandler} from '../platform/api/portal-state-handler.mjs';

const user={id:'person-1',appMetadata:{tenantId:'tenant-A'}};
const record={data:{company:{name:'Private tenant'}},sourceUpdatedAt:'2026-10-25T00:00:00Z'};
test('commercial feedback remains bound to authenticated tenant and period',async()=>{
 const calls=[];
 const store={get:async()=>record,put:async()=>({stored:true}),
   getCommercialFeedback:async(tenant,options)=>{calls.push([tenant,options.days]);return {tenantId:tenant,series:[],verificationStatus:'UNVERIFIED',verifiedRevenueEur:0}}};
 const handler=createPortalStateHandler({getUser:async()=>user,store});
 const response=await handler(new Request('https://example.test/api/portal-state?commercialDays=90'));
 const body=await response.json();
 assert.equal(response.status,200);
 assert.deepEqual(calls,[['tenant-A',90]]);
 assert.equal(body.commercialFeedback.verifiedRevenueEur,0);
 assert.equal(body.commercialFeedback.verificationStatus,'UNVERIFIED');
 assert.equal(response.headers.get('cache-control'),'private, no-store');
});
test('invalid periods never query commercial source',async()=>{
 let reads=0;
 const handler=createPortalStateHandler({getUser:async()=>user,store:{get:async()=>record,put:async()=>({stored:true}),getCommercialFeedback:async()=>{reads++}}});
 const response=await handler(new Request('https://example.test/api/portal-state?commercialDays=9000'));
 assert.equal(response.status,400);
 assert.equal(reads,0);
});
test('cross-tenant result fails closed',async()=>{
 const handler=createPortalStateHandler({getUser:async()=>user,store:{get:async()=>record,put:async()=>({stored:true}),getCommercialFeedback:async()=>({tenantId:'tenant-B',series:[]})}});
 const response=await handler(new Request('https://example.test/api/portal-state'));
 assert.equal(response.status,502);
});
