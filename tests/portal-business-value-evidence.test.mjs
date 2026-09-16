import test from 'node:test';
import assert from 'node:assert/strict';
import { withBusinessValueEvidence } from '../portal-v2/csrd-impact.js';
import { createSupabasePortalProjectionStore } from '../netlify/functions/_portal-supabase-store.mjs';

test('business value evidence preserves unknowns and canonical ROI without local recomputation', () => {
  const unknown = withBusinessValueEvidence({ observed_cost_eur:null, realized_revenue_eur:null, realized_roi:null, observations:0 });
  assert.equal(unknown.businessValue.observedCostEur, null);
  assert.equal(unknown.businessValue.realizedRevenueEur, null);
  assert.equal(unknown.businessValue.realizedRoi, null);
  assert.equal(unknown.businessValue.evidenceClass, 'unknown');

  const measured = withBusinessValueEvidence({
    observed_cost_eur:12.5,
    realized_revenue_eur:100,
    realized_roi:99,
    observations:4,
    action_attribution_coverage:0.75,
    environmental_factor_coverage:0,
    latest_observed_at:'2026-09-15T20:00:00Z',
  });
  assert.equal(measured.businessValue.observedCostEur, 12.5);
  assert.equal(measured.businessValue.realizedRevenueEur, 100);
  assert.equal(measured.businessValue.realizedRoi, 99);
  assert.equal(measured.businessValue.evidenceClass, 'measured');
  assert.equal(measured.businessValue.environmentalFactorCoverage, 0);
});

test('EU portal projection store reads canonical resource/business value through existing gateway', async () => {
  const calls=[];
  const fetchFn=async (_url, init)=>{
    const body=JSON.parse(init.body); calls.push(body);
    if(body.action==='get') return {ok:true,json:async()=>({payload:body.layer==='canonical-brain'?{sourceMeta:{updatedAt:'2026-09-15T20:00:00Z'}}:{legacy:true}})};
    if(body.action==='governance') return {ok:true,json:async()=>({governance:[]})};
    if(body.action==='resource_business_value') return {ok:true,json:async()=>({resourceBusinessValue:{tenant_id:'tenant-1',observed_cost_eur:null,realized_revenue_eur:null,realized_roi:null}})};
    return {ok:false,status:400,json:async()=>({})};
  };
  const store=createSupabasePortalProjectionStore({fetchFn,baseUrl:'https://example.supabase.co',serviceToken:'x'});
  const record=await store.get('tenant-1');
  assert.equal(calls.some(call=>call.action==='resource_business_value'&&call.tenantId==='tenant-1'),true);
  assert.deepEqual(record.data.resourceBusinessValue,{tenant_id:'tenant-1',observed_cost_eur:null,realized_revenue_eur:null,realized_roi:null});
});

test('resource/business value evidence never materializes Portal state without a legacy or canonical Portal layer', async () => {
  const fetchFn=async (_url, init)=>{
    const body=JSON.parse(init.body);
    if(body.action==='get') return {ok:true,json:async()=>({payload:null})};
    if(body.action==='governance') return {ok:true,json:async()=>({governance:[]})};
    if(body.action==='resource_business_value') return {ok:true,json:async()=>({resourceBusinessValue:{tenant_id:'tenant-evidence-only',observed_cost_eur:12.5,realized_revenue_eur:100,realized_roi:7}})};
    return {ok:false,status:400,json:async()=>({})};
  };
  const store=createSupabasePortalProjectionStore({fetchFn,baseUrl:'https://example.supabase.co',serviceToken:'x'});
  assert.equal(await store.get('tenant-evidence-only'),null);
});
