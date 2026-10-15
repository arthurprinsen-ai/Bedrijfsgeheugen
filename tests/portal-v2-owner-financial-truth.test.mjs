import test from 'node:test';
import assert from 'node:assert/strict';
import {ownerFinancialReadouts,createOwnerFinancialClient} from '../portal-v2/owner-financial-truth.js';

const now=Date.parse('2026-10-15T15:00:00Z');
const tenantId='tenant-abc';
const history=Array.from({length:6},(_,i)=>({date:`2026-${String(i+4).padStart(2,'0')}`,value:10_000+i*1_000}));
const future=[{date:'2026-10',value:17_000},{date:'2026-11',value:18_000}];
const forecast=(metric='revenue',other={})=>({
 id:metric,tenantId,metric,title:metric,unit:metric.includes('margin')?'percent':'EUR',
 source:'erp:verified',model:'forecast:v2',
 updatedAt:'2026-10-14T12:00:00Z',verified:true,
 validation:{status:'passed',tenantBound:true,tenantId,verifiedAt:'2026-10-14T14:00:00Z'},
 history,forecast:future,...other
});
test('separate reviewed historical actual period from future verified cash projection',()=>{
 const input={status:'OK',forecasts:[
  forecast('revenue'),forecast('cash_balance',{history:history.map(p=>({...p,value:18_000})),forecast:[{date:'2026-10',value:9000},{date:'2026-11',value:8000}]}),
  forecast('gross_margin_pct',{history:history.map(p=>({...p,value:33.7})),forecast:[{date:'2026-10',value:32},{date:'2026-11',value:31}]})
 ]};
 const value=ownerFinancialReadouts(input,{tenantId,now});
 assert.equal(value.records,3);
 assert.equal(value.revenue.period,'2026-09');
 assert.equal(value.revenue.forecast,false);
 assert.match(value.revenue.value,/15\.000/);
 assert.equal(value.cash.period,'2026-10');
 assert.equal(value.cash.forecast,true);
 assert.match(value.margin.value,/33,7%/);
});
test('reject missing/cross-tenant/unreviewed/stale/invalid series rather than invent money',()=>{
 const variations=[
  {tenantId:'other'},
  {verified:false},
  {source:''},
  {model:''},
  {validation:{status:'passed',tenantBound:true,tenantId:'other',verifiedAt:'2026-10-14T14:00:00Z'}},
  {updatedAt:'2026-08-01T00:00:00Z'},
  {history:[{date:'2026-02-30',value:8},...history.slice(1)]},
  {history:history.slice(2)},
  {forecast:[{date:'2026-09',value:20_000}]},
  {updatedAt:'2026-10-14T18:00:00Z'},
 ];
 for(const variant of variations){
  const result=ownerFinancialReadouts({status:'OK',forecasts:[forecast('revenue',variant)]},{tenantId,now});
  assert.equal(result.revenue,null,JSON.stringify(variant));
 }
});
test('unknown metrics and invalid financial unit are not printed',()=>{
 const x=ownerFinancialReadouts({status:'OK',forecasts:[forecast('sales',{unit:'USD'}),forecast('gross_margin_pct',{unit:'EUR'})]},{tenantId,now});
 assert.equal(x.revenue,null);assert.equal(x.margin,null);assert.equal(x.cash,null);
});
test('browser only fetches finance with authenticated tenant context and no retry fallback',async()=>{
 let calls=0;
 const c=createOwnerFinancialClient({
  authHeadersProvider:async()=>({authorization:'Bearer sample',accept:'application/json'}),
  fetchImpl:async(url,options)=>{calls++;assert.equal(url,'/api/portal-forecasts');assert.equal(options.cache,'no-store');assert.equal(options.credentials,'same-origin');assert.equal(options.headers.authorization,'Bearer sample');return {ok:true,json:async()=>({status:'OK',forecasts:[forecast('revenue')]})};}
 });
 const out=await c.load(tenantId);
 assert.equal(calls,1);assert.equal(out.records,1);
 const forbidden=createOwnerFinancialClient({authHeadersProvider:async()=>({}),fetchImpl:async()=>{throw Error('should never fetch')}});
 await assert.rejects(()=>forbidden.load(tenantId),/AUTH_REQUIRED/);
});
