import test from 'node:test';
import assert from 'node:assert/strict';
import {project,confidence} from '../portal-v2/nextgen-intelligence.js';

test('historical replay: visible KPI digits cannot become a future or trust claim',()=>{
  const  legacyExamples=[
    {value:70,delta:2,label:'Omzet'},
    {value:98,delta:8,label:'Tijdwinst'},
    {value:64,delta:3,label:'Proces'},
    {value:0,delta:-4,label:'Risico'}
  ];
  for(const signal of legacyExamples){
    for(const horizon of [3,6,12]){
      assert.equal(project(signal,horizon,'base'),null);
      assert.equal(project(signal,horizon,'stress'),null);
      assert.equal(project(signal,horizon,'opportunity'),null);
    }
    assert.equal(confidence(signal),null);
  }
});
test('historical replay: unproven verified flag without tenant/source/backtest is not a forecast',()=>{
  const metric={value:70,canonicalForecast:{status:'VERIFIED',expected:95,
    origin:'authenticated_portal_forecast',horizonMonths:6}};
  assert.equal(project(metric,6,'base'),null);
  assert.equal(confidence(metric),null);
});


import {composePortalProjectionLayers} from '../platform/read-models/portal-projection-layers.mjs';

const layer=(tenantId,sourceUpdatedAt,portal,extra={})=>({tenantId,sourceUpdatedAt,data:{portal,...extra}});

test('newly acknowledged tenant edits survive stale canonical nested portal snapshots',()=>{
 const legacy=layer('tenant-1','2026-10-20T07:41:00Z',{
  profile:{employees:25,sector:'bouw'},
  aiCapabilities:{investmentApproved:false},metrics:{cash:0}
 });
 const canonical=layer('tenant-1','2026-10-20T07:40:00Z',{
  profile:{employees:10,legalEntity:'bv'},
  aiCapabilities:{investmentApproved:true,verifiedProvider:'eu-provider'},
  metrics:{cash:99},compliance:{csrd:{status:'REVIEW_REQUIRED'}}
 },{signals:[{id:'regulation-1',status:'OBSERVED'}]});
 const result=composePortalProjectionLayers({legacy,canonical});
 assert.equal(result.portal.profile.employees,25);
 assert.equal(result.portal.profile.legalEntity,'bv');
 assert.equal(result.portal.aiCapabilities.investmentApproved,false);
 assert.equal(result.portal.aiCapabilities.verifiedProvider,'eu-provider');
 assert.equal(result.portal.metrics.cash,0);
 assert.equal(result.portal.compliance.csrd.status,'REVIEW_REQUIRED');
 assert.deepEqual(result.signals,[{id:'regulation-1',status:'OBSERVED'}]);
 assert.equal(result.sourceMeta.updatedAt,'2026-10-20T07:41:00.000Z');
});

test('newer Brain source wins overlapping customer fields without deleting unrelated nested fields',()=>{
 const legacy=layer('tenant-2','2026-10-20T07:35:00Z',{
  profile:{employees:12,sector:'zorg'},
  aiAct:{supplier:'vendor-1',humanOversight:true},
  goals:{margin:0}
 });
 const canonical=layer('tenant-2','2026-10-20T07:45:00Z',{
  profile:{employees:15},
  aiAct:{humanOversight:false},
  goals:{margin:22}
 });
 const result=composePortalProjectionLayers({legacy,canonical});
 assert.deepEqual(result.portal.profile,{employees:15,sector:'zorg'});
 assert.deepEqual(result.portal.aiAct,{supplier:'vendor-1',humanOversight:false});
 assert.equal(result.portal.goals.margin,22);
});

test('portal projections fail closed rather than combining two identifiable tenants',()=>{
 const legacy=layer('tenant-A','2026-10-20T07:50:00Z',{profile:{employees:7}});
 const canonical=layer('tenant-B','2026-10-20T07:51:00Z',{profile:{employees:99}});
 assert.throws(()=>composePortalProjectionLayers({legacy,canonical}),/PORTAL_PROJECTION_TENANT_MISMATCH/);
});

test('atomic arrays and explicit empty, null and zero values are not replaced by older data',()=>{
 const legacy=layer('tenant-3','2026-10-20T07:51:00Z',{goals:{values:[],note:'',impact:null,cost:0}});
 const canonical=layer('tenant-3','2026-10-20T07:50:00Z',{goals:{values:[1,2],note:'old',impact:20,cost:300}});
 const result=composePortalProjectionLayers({legacy,canonical});
 assert.deepEqual(result.portal.goals,{values:[],note:'',impact:null,cost:0});
});
