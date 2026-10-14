import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalForecastHandler,verifiedForecasts} from '../platform/api/portal-forecast-handler.mjs';
const point=(date,value)=>({date,value});
const valid={id:'revenue',metric:'revenue',source:'Finance ledger',model:'time-series-v1',updatedAt:'2026-10-14T10:00:00Z',verified:true,validation:{status:'passed',tenantBound:true},history:[point('2026-08',90)],forecast:[point('2026-11',110)]};
test('unauthenticated request never touches canonical data',async()=>{
 let calls=0;const h=createPortalForecastHandler({getUser:async()=>null,getCanonical:async()=>{calls++}});
 const r=await h(new Request('https://example.test/api/portal-forecasts'));
 assert.equal(r.status,401);assert.equal(calls,0);
});
test('authenticated forecast route scopes lookups to identity tenant',async()=>{
 let seen='';const h=createPortalForecastHandler({getUser:async()=>({id:'user42',app_metadata:{tenantId:'tenant42'}}),getCanonical:async tenant=>{seen=tenant;return{forecasts:[valid]}}});
 const r=await h(new Request('https://example.test/api/portal-forecasts'));
 assert.equal(r.status,200);assert.equal(seen,'tenant42');
 assert.equal((await r.json()).forecasts.length,1);
 assert.equal(r.headers.get('cache-control'),'private, no-store');
});
test('unvalidated numeric data are never exposed as model forecasts',()=>{
 const forecasts=verifiedForecasts({forecasts:[{...valid,validation:{status:'pending',tenantBound:true}},{...valid,history:[point('aug',null)]}]});
 assert.equal(forecasts.length,0);
});
test('upstream failure fails closed with 503',async()=>{
 const h=createPortalForecastHandler({getUser:async()=>({id:'user42'}),getCanonical:async()=>{throw Error('upstream unavailable')}});
 const r=await h(new Request('https://example.test/api/portal-forecasts'));
 assert.equal(r.status,503);
});
