import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeGrowthEventForDataHub,
  normalizeGrowthOutcome,
  growthEventIdempotencyKey,
  growthOutcomeIdempotencyKey,
  businessValueScore
} from '../tools/seo-growth/datahub-contract.mjs';

const ORIGIN='https://www.bedrijfsgeheugen.nl';

test('growth event normaliseert alleen privacy-arme velden',()=>{
  const event=normalizeGrowthEventForDataHub({
    event_id:'evt-1',event_type:'cta_click',canonical:`${ORIGIN}/ai-implementeren`,
    intent:'ai implementatie mkb',intent_owner:`${ORIGIN}/ai-implementeren`,
    attribution_root_key:'sess-abc',source:'organic',medium:'google',campaign:'',
    occurred_at:'2026-09-06T10:00:00Z',page_role:'money',funnel_stage:'decide',value:1
  });
  assert.equal(event.event_id,'evt-1');
  assert.equal(event.canonical,`${ORIGIN}/ai-implementeren`);
  assert.equal(event.source,'organic');
  assert.ok(!('email' in event));
});

test('growth event weigert PII en secrets',()=>{
  for(const bad of [
    {email:'a@example.com'}, {phone:'+31612345678'}, {name:'Arthur'},
    {form_content:'vertel mijn probleem'}, {token:'secret'}, {authorization:'Bearer x'}
  ]){
    assert.throws(()=>normalizeGrowthEventForDataHub({event_id:'evt-x',event_type:'page_view',canonical:`${ORIGIN}/`,occurred_at:'2026-09-06T10:00:00Z',...bad}),/PII|SECRET|FIELD/i);
  }
});

test('commercial outcomes zijn beperkt en omzet kan niet negatief zijn',()=>{
  const won=normalizeGrowthOutcome({outcome_id:'out-1',stage:'won_order',attribution_root_key:'sess-abc',canonical:`${ORIGIN}/ai-implementeren`,occurred_at:'2026-09-06T10:10:00Z',revenue_eur:12500});
  assert.equal(won.stage,'won_order');
  assert.equal(won.revenue_eur,12500);
  assert.throws(()=>normalizeGrowthOutcome({outcome_id:'x',stage:'random',attribution_root_key:'a',occurred_at:'2026-09-06T10:10:00Z'}),/stage/i);
  assert.throws(()=>normalizeGrowthOutcome({outcome_id:'x',stage:'revenue',attribution_root_key:'a',occurred_at:'2026-09-06T10:10:00Z',revenue_eur:-1}),/revenue/i);
});

test('idempotency is stable per event/outcome identity',()=>{
  assert.equal(growthEventIdempotencyKey({event_id:'evt-1'}),growthEventIdempotencyKey({event_id:'evt-1'}));
  assert.notEqual(growthEventIdempotencyKey({event_id:'evt-1'}),growthEventIdempotencyKey({event_id:'evt-2'}));
  assert.equal(growthOutcomeIdempotencyKey({outcome_id:'out-1'}),growthOutcomeIdempotencyKey({outcome_id:'out-1'}));
});

test('business score beloont orders en omzet zwaarder dan traffic',()=>{
  const trafficOnly=businessValueScore({impressions:10000,clicks:500,engaged_visits:250,cta_clicks:20,qualified_leads:0,won_orders:0,revenue_eur:0});
  const revenue=businessValueScore({impressions:1000,clicks:80,engaged_visits:50,cta_clicks:8,qualified_leads:2,won_orders:1,revenue_eur:10000});
  assert.ok(revenue>trafficOnly,{trafficOnly,revenue});
});