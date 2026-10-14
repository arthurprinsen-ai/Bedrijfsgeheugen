import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalForecastHandler,verifiedForecasts} from '../platform/api/portal-forecast-handler.mjs';
const point=(date,value)=>({date,value});
const valid={id:'revenue',metric:'revenue',source:'Finance ledger',model:'time-series-v1',updatedAt:'2026-10-14T10:00:00Z',verified:true,tenantId:'tenant42',validation:{status:'passed',tenantBound:true,tenantId:'tenant42',verifiedAt:'2026-10-14T12:00:00Z'},history:[point('2026-06',70),point('2026-07',80),point('2026-08',90)],forecast:[point('2026-11',110)]};
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
 const forecasts=verifiedForecasts({forecasts:[{...valid,validation:{status:'pending',tenantBound:true,tenantId:'tenant42'}},{...valid,history:[point('aug',null)]}]},'tenant42');
 assert.equal(forecasts.length,0);
});
test('upstream failure fails closed with 503',async()=>{
 const h=createPortalForecastHandler({getUser:async()=>({id:'user42'}),getCanonical:async()=>{throw Error('upstream unavailable')}});
 const r=await h(new Request('https://example.test/api/portal-forecasts'));
 assert.equal(r.status,503);
});

test('cross-tenant forecasts and assertions are rejected, even if marked verified',()=>{
 const records={forecasts:[
  {...valid,tenantId:'other-tenant'},
  {...valid,validation:{...valid.validation,tenantId:'other-tenant'}},
  {...valid,validation:{...valid.validation,tenantBound:false}}
 ]};
 assert.deepEqual(verifiedForecasts(records,'tenant42'),[]);
 assert.deepEqual(verifiedForecasts({forecasts:[valid]},''),[]);
});

test('forecast dates require a recent observed timestamp and reject future assertions',()=>{
 const now=new Date('2026-10-14T20:00:00Z');
 assert.equal(verifiedForecasts({forecasts:[valid]},'tenant42',{now}).length,1);
 assert.deepEqual(verifiedForecasts({forecasts:[{...valid,updatedAt:'2026-09-01T00:00:00Z'}]},'tenant42',{now}),[]);
 assert.deepEqual(verifiedForecasts({forecasts:[{...valid,updatedAt:'2026-10-16T00:00:00Z'}]},'tenant42',{now}),[]);
 assert.deepEqual(verifiedForecasts({forecasts:[{...valid,updatedAt:'invalid-date'}]},'tenant42',{now}),[]);
});
test('canonical projection tenant metadata must match authenticated identity',()=>{
 assert.deepEqual(verifiedForecasts({tenantId:'tenant43',forecasts:[valid]},'tenant42',{now:new Date('2026-10-14T20:00:00Z')}),[]);
 assert.deepEqual(verifiedForecasts({payload:{tenant_id:'tenant43',forecasts:[valid]}},'tenant42',{now:new Date('2026-10-14T20:00:00Z')}),[]);
});

test('expired or absent independent forecast verification cannot be presented as valid',()=>{
 const now=new Date('2026-10-14T20:00:00Z');
 assert.deepEqual(verifiedForecasts({forecasts:[{...valid,validation:{...valid.validation,verifiedAt:'2026-08-01T00:00:00Z'}}]},'tenant42',{now}),[]);
 assert.deepEqual(verifiedForecasts({forecasts:[{...valid,validation:{...valid.validation,verifiedAt:null}}]},'tenant42',{now}),[]);
});


test('authenticated tenant with no independently validated finance returns explicit unavailable state',async()=>{
  const h=createPortalForecastHandler({
    getUser:async()=>({id:'user42',app_metadata:{tenantId:'tenant42'}}),
    getCanonical:async()=>({forecasts:[]})
  });
  const r=await h(new Request('https://example.test/api/portal-forecasts'));
  assert.equal(r.status,200);
  assert.deepEqual(await r.json(),{forecasts:[],status:'NO_VALIDATED_FINANCIAL_FORECASTS'});
});

test('chronology, invalid calendar days and incomplete history cannot be labelled verified',()=>{
 const now=new Date('2026-10-14T20:00:00Z');
 const rejected=[
   {...valid,history:[point('2026-08',90)]},
   {...valid,history:[point('2026-06',70),point('2026-08',90),point('2026-08',100)]},
   {...valid,forecast:[point('2026-08',110)]},
   {...valid,forecast:[point('2026-02-30',110)]},
   {...valid,history:[point('2026-06-01',70),point('2026-07-01',80),point('2026-08-01',90)]},
   {...valid,forecast:[point('2026-11',NaN)]}
 ];
 for(const f of rejected)assert.deepEqual(verifiedForecasts({forecasts:[f]},'tenant42',{now}),[]);
});
test('uncertainty bands must align by period and enclose forecast point',()=>{
 const now=new Date('2026-10-14T20:00:00Z');
 const acceptable={...valid,low:[point('2026-11',100)],high:[point('2026-11',125)]};
 assert.equal(verifiedForecasts({tenantId:'tenant42',forecasts:[acceptable]},'tenant42',{now}).length,1);
 for(const f of [
  {...acceptable,high:undefined},
  {...acceptable,low:[point('2026-10',100)]},
  {...acceptable,low:[point('2026-11',120)]},
  {...acceptable,high:[point('2026-11',100)]}
 ])assert.deepEqual(verifiedForecasts({forecasts:[f]},'tenant42',{now}),[]);
});

test('review attestation survives the authenticated API boundary and enables the chart',async()=>{
 const {renderForecastPanel}=await import('../portal/forecast-panel.mjs');
 const h=createPortalForecastHandler({
  getUser:async()=>({id:'user42',app_metadata:{tenantId:'tenant42'}}),
  getCanonical:async()=>({tenantId:'tenant42',forecasts:[valid]})
 });
 const response=await h(new Request('https://example.test/api/portal-forecasts'));
 assert.equal(response.status,200);
 const data=await response.json();
 assert.equal(data.forecasts.length,1);
 const selected=data.forecasts[0];
 assert.equal(selected.tenantId,'tenant42');
 assert.deepEqual(selected.validation,{status:'passed',tenantBound:true,tenantId:'tenant42',verifiedAt:'2026-10-14T12:00:00Z'});
 assert.match(renderForecastPanel({forecasts:data.forecasts},'today'),/<svg /);
 assert.doesNotMatch(renderForecastPanel({forecasts:[{...selected,validation:undefined}]},'today'),/<svg /);
});
