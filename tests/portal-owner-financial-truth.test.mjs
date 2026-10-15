import test from 'node:test';
import assert from 'node:assert/strict';
import {ownerFinancialReadouts,createOwnerFinancialClient} from '../portal-v2/owner-financial-truth.js';
import {createPortalForecastHandler} from '../platform/api/portal-forecast-handler.mjs';
import {renderOwnerOperatingHtml,renderOwnerCanonicalDecisions} from '../portal-v2/owner-operating-system.js';

const now=Date.parse('2026-10-15T17:00:00Z');
const tenantId='tenant-finance-a';
const row=(metric,unit,override={})=>({
  id:'forecast:'+metric,metric,unit,tenantId,
  verified:true,source:'ERP connector',model:'backtest-v2',
  updatedAt:'2026-10-14T12:00:00Z',
  validation:{status:'passed',tenantBound:true,tenantId,verifiedAt:'2026-10-14T13:00:00Z'},
  history:[1,2,3,4,5,6].map(i=>({date:`2026-0${i}`,value:i*1000})),
  forecast:[{date:'2026-07',value:7200},{date:'2026-08',value:8200}],
  ...override
});
const payload=forecasts=>({tenantId,status:'OK',forecasts});

test('owner financial readout uses only independently reviewed tenant-bound sources',()=>{
  const financial=ownerFinancialReadouts(payload([
    row('revenue','eur'),row('gross_margin_pct','percent',{history:row('a','a').history.map(p=>({...p,value:42}))}),
    row('cash_balance','eur')
  ]),{tenantId,now});
  assert.equal(financial.status,'VALIDATED');
  assert.equal(financial.records,3);
  assert.equal(financial.revenue.raw,6000);
  assert.equal(financial.margin.raw,42);
  assert.equal(financial.cash.raw,7200);
  assert.equal(financial.revenue.forecast,false);
  assert.equal(financial.cash.forecast,true);
  const markup=renderOwnerOperatingHtml({}, {financial,now});
  assert.match(markup,/Gevalideerde historische reeks/);
  assert.match(markup,/Gecontroleerde prognose/);
  assert.match(markup,/bron ERP connector/);
});

test('missing, stale, contradictory and cross-tenant claims never yield financial KPIs',()=>{
  const bad=[
    row('revenue','eur',{tenantId:'tenant-b'}),
    row('gross_margin_pct','percent',{validation:{status:'passed',tenantBound:false,tenantId,verifiedAt:'2026-10-14T13:00:00Z'}}),
    row('cash_balance','eur',{validation:{status:'passed',tenantBound:true,tenantId,verifiedAt:'2026-07-01T00:00:00Z'}}),
    row('revenue','eur',{history:row('revenue','eur').history.slice(0,3)}),
    row('revenue','eur',{history:[{date:'2026-01',value:1},...row('revenue','eur').history.slice(1).map(x=>({...x,date:'2026-01'}))]}),
    row('revenue','eur',{source:''}),
    row('revenue','eur',{history:row('revenue','eur').history.map(x=>({...x,value:'6000'}))})
  ];
  const output=ownerFinancialReadouts(payload(bad),{tenantId,now});
  assert.equal(output.records,0);
  assert.equal(output.revenue,null);
  assert.equal(output.cash,null);
  assert.equal(output.margin,null);
  assert.equal(output.status,'NOT_VERIFIED');
  assert.equal(ownerFinancialReadouts(payload([row('revenue','eur')]),{tenantId:'tenant-b',now}).revenue,null);
});

test('financial transport requires signed-in identity and authoritative scoped response',async()=>{
  const calls=[];
  const fetchImpl=async(url,opts)=>{calls.push({url,opts});return Response.json(payload([row('revenue','eur')]));};
  const client=createOwnerFinancialClient({fetchImpl,authHeadersProvider:async()=>({authorization:'Bearer token-placeholder'})});
  const result=await client.load(tenantId);
  assert.equal(result.revenue.raw,6000);
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'/api/portal-forecasts');
  assert.equal(calls[0].opts.credentials,'same-origin');
  assert.equal(calls[0].opts.cache,'no-store');
  await assert.rejects(createOwnerFinancialClient({fetchImpl,authHeadersProvider:async()=>({})}).load(tenantId),/AUTH_REQUIRED/);
  const other=createOwnerFinancialClient({fetchImpl:async()=>Response.json({...payload([row('revenue','eur')]),tenantId:'tenant-b'}),authHeadersProvider:async()=>({authorization:'Bearer valid'})});
  await assert.rejects(other.load(tenantId),/TENANT_SCOPE_MISMATCH/);
  await assert.rejects(other.load('tenant-c'),/TENANT_SCOPE_MISMATCH/);
});

test('empty financial response keeps its server-resolved tenant without inventing values',async()=>{
  const req=new Request('https://bedrijfsgeheugen.nl/api/portal-forecasts');
  const user={id:'u123',app_metadata:{tenantId}};
  let seen=null;
  const handler=createPortalForecastHandler({getUser:async(request)=>{seen=request;return user;},getCanonical:async()=>null});
  const response=await handler(req);const body=await response.json();
  assert.equal(seen,req);
  assert.equal(response.status,200);
  assert.deepEqual(body,{tenantId,forecasts:[],status:'NO_CANONICAL_FORECASTS'});
  const noReview=createPortalForecastHandler({getUser:async()=>user,getCanonical:async()=>({tenantId,forecasts:[{tenantId,verified:false}]})});
  assert.deepEqual(await (await noReview(req)).json(),{tenantId,forecasts:[],status:'NO_VALIDATED_FINANCIAL_FORECASTS'});
  const unknown=createPortalForecastHandler({getUser:async()=>null,getCanonical:async()=>{throw Error('must not read');}});
  assert.equal((await unknown(req)).status,401);
});

test('all proposed decisions are displayed as pending human approval, never provider sends',()=>{
 const markup=renderOwnerCanonicalDecisions({decisions:{items:[
  {id:'dec-1',title:'Klantofferte',status:'PROPOSED'},
  {id:'dec-2',title:'Contract',status:'PROPOSED',blockedBy:'MISSING_AGREEMENT'},
  {id:'dec-3',title:'Al gedaan',status:'DONE'}
 ]}});
 assert.equal((markup.match(/data-owner-command="APPROVE"/g)||[]).length,1);
 assert.equal((markup.match(/data-owner-command="REJECT"/g)||[]).length,1);
 assert.doesNotMatch(markup,/data-owner-command="START"/);
 assert.match(markup,/MISSING_AGREEMENT|Contract/);
});
