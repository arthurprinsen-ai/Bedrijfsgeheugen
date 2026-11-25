import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {planDailyConversion} from '../tools/seo-growth/daily-conversion-planner.mjs';

const url='https://www.bedrijfsgeheugen.nl/afas-koppeling';
const now=new Date('2026-10-25T12:00:00Z');
const registry={pages:[{route:url,role:'money',primary_cta:'/frisse-blik'}]};
const rollup={day:'2026-10-25',canonical:url,intent_owner:'afas',page_views:2000,
  cta_clicks:0,qualified_leads:0,won_orders:0,revenue_eur:0,updated_at:'2026-10-25T10:00:00Z'};
const humanAt=(at='2026-10-06T15:29:00Z')=>({
  event_type:'page_view',is_robot:false,occurred_at:at,canonical:url
});
const inputs={now,registry,pageDailyRows:[rollup],
  searchRows:[{pagina:url,datum:'2026-10-23',opgehaald_op:'2026-10-25T08:00:00Z',
    zoekterm:'afas koppeling',vertoningen:1000,klikken:4,positie:5}]};

test('stale human raw views with fresh daily rollup cannot be mistaken for observed human abandonment',()=>{
  const plan=planDailyConversion({...inputs,humanViewProbe:[humanAt()]});
  assert.equal(plan.sourceFreshness.rawHumanPageViewFresh,false);
  assert.equal(plan.sourceFreshness.measurementStatus,'RAW_HUMAN_PAGEVIEW_STALE_OR_MISSING');
  assert.equal(plan.sourceFreshness.ctaRateDenominatorVerified,false);
  assert.equal(plan.sourceFreshness.botTrafficExcludedFromCtaDecision,true);
  assert.equal(plan.pages[0].ctaRate,null);
  assert.equal(plan.pages[0].views,null);
  assert.equal(plan.pages[0].unverifiedRollupViews,2000);
  assert.equal(plan.pages[0].ctaRateEvidenceStatus,'HUMAN_DENOMINATOR_NOT_VERIFIED');
  assert.equal(plan.candidates[0].action,'evidence-gap');
  assert.equal(plan.candidates[0].terminal.reason_code,'HUMAN_CONVERSION_MEASUREMENT_UNVERIFIED');
  assert.equal(plan.candidates[0].auto_publish,false);
});

test('fresh sampled human raw views alone cannot validate rollup cohort or CTA attribution',()=>{
  const plan=planDailyConversion({...inputs,humanViewProbe:[humanAt('2026-10-25T09:00:00Z')]});
  assert.equal(plan.sourceFreshness.rawHumanPageViewFresh,true);
  assert.equal(plan.sourceFreshness.measurementStatus,'HUMAN_ROLLUP_PARITY_UNVERIFIED');
  assert.equal(plan.sourceFreshness.ctaRateDenominatorVerified,false);
  assert.equal(plan.candidates[0].action,'evidence-gap');
  assert.equal(plan.pages[0].ctaRate,null);
});

test('robot events and future-dated page views never count as fresh human evidence',()=>{
  const plan=planDailyConversion({...inputs,events:[
    {event_id:'bot',event_type:'page_view',is_robot:true,canonical:url,occurred_at:'2026-10-25T10:00:00Z'},
    {event_id:'humanfuture',event_type:'page_view',is_robot:false,canonical:url,occurred_at:'2026-10-30T10:00:00Z'}
  ],humanViewProbe:[
    {...humanAt('2026-10-25T11:00:00Z'),is_robot:true},
    humanAt('2026-10-30T10:00:00Z')
  ]});
  assert.equal(plan.sourceFreshness.rawHumanPageViewFresh,false);
  assert.equal(plan.pages[0].ctaRate,null);
  assert.equal(plan.candidates[0].action,'evidence-gap');
});

test('independent observed GSC low CTR can still create a title/meta experiment without fabricated CTA rate',()=>{
  const plan=planDailyConversion({...inputs,pageDailyRows:[],humanViewProbe:[]});
  assert.equal(plan.candidates[0].action,'title-meta');
  assert.equal(plan.candidates[0].terminal.state,'REJECTED_WITH_EVIDENCE');
  assert.equal(plan.pages[0].ctaRate,null);
});

test('existing Netlify daily scheduler probes non-bot views without personal identifiers or a second executor',async()=>{
  const source=await readFile(new URL('../netlify/functions/growth-intelligence-daily.mjs',import.meta.url),'utf8');
  assert.match(source,/schedule:'0 6 \* \* \*'/);
  assert.match(source,/event_type=eq\.page_view&is_robot=eq\.false/);
  assert.match(source,/select=event_type,canonical,occurred_at,is_robot/);
  assert.match(source,/humanViewProbe:input\.humanViewProbe/);
  assert.doesNotMatch(source,/read\('growth_events','select=\*/);
});
