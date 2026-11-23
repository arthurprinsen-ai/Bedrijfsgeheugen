import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectOriginalSeoMoneyHandoffs,reconcileOriginalSeoMoneyHandoffs,SEO_MONEY_OWNER_HANDOFF}
  from '../supabase/functions/powerhouse-seo-opportunity-resolver/money-page-handoff.mjs';

const ORIGIN='https://www.bedrijfsgeheugen.nl';
const owner=slug=>({
 route:ORIGIN+'/'+slug,role:'money',primary_intent:slug,primary_keyword:slug,
 secondary_keywords:slug==='exact-online-koppeling'?['exact online api']:['twinfield koppelingen'],
 primary_cta:{action:'frisse-blik',url:ORIGIN+'/frisse-blik'}
});
const candidate=(name,keyword,score=82)=>({
 action:'UPDATE_MONEY_PAGE',keyword,score,owner:owner(name),
 row:{opgehaald_op:'2026-11-09T06:00:08.939Z',zoekvolume:100,cpc:5}
});
const make=(date='2026-11-13')=>selectOriginalSeoMoneyHandoffs([
 candidate('exact-online-koppeling','exact online api',78),
 candidate('twinfield-koppeling','twinfield koppelingen',72)
],{runDate:date,observedAt:date+'T06:00:00.000Z'});
const prior=(source,{status='suggested',date='2026-11-12',observedAt='2026-11-09T06:00:08.939Z'}={})=>({
 ...source,dedupe_key:source.dedupe_key.replace(':2026-11-13:',':'+date+':'),
 run_date:date,status,source_observed_at:undefined,
 evidence:{...source.evidence,source_observed_at:observedAt}
});

test('new day does not recreate Exact/Twinfield while old original recommendation remains pending',()=>{
 const proposed=make(), historical=make().map(x=>prior(x));
 const result=reconcileOriginalSeoMoneyHandoffs(proposed,historical);
 assert.equal(result.selected.length,0);
 assert.equal(result.suppressed.length,2);
 assert.deepEqual(result.suppressed.map(x=>x.reason),[
  'ORIGINAL_OWNER_HANDOFF_STILL_UNCONSUMED',
  'ORIGINAL_OWNER_HANDOFF_STILL_UNCONSUMED'
 ]);
 assert.ok(result.suppressed.every(x=>x.prior_dedupe_key.startsWith('seo-owner-update:2026-11-12:')));
});

test('done or evidence-rejected source-identical work is not reopened merely because date changes',()=>{
 const proposed=make(), historical=[
  prior(proposed[0],{date:'2026-11-10',status:'skipped'}),
  prior(proposed[1],{date:'2026-11-10',status:'done'})
 ];
 const result=reconcileOriginalSeoMoneyHandoffs(proposed,historical);
 assert.equal(result.selected.length,0);
 assert.deepEqual(result.suppressed.map(x=>x.reason),[
  'ORIGINAL_OWNER_SOURCE_UNCHANGED','ORIGINAL_OWNER_SOURCE_UNCHANGED'
 ]);
});

test('new provider observation can re-open completed work, but not an unconsumed owner obligation',()=>{
 const proposed=make();
 const old='2026-11-08T05:00:00.000Z';
 const done=reconcileOriginalSeoMoneyHandoffs(proposed,[prior(proposed[0],{date:'2026-11-08',status:'done',observedAt:old})]);
 assert.deepEqual(done.selected.map(x=>x.evidence.canonical_owner),proposed.map(x=>x.evidence.canonical_owner));
 const pending=reconcileOriginalSeoMoneyHandoffs(proposed,[prior(proposed[0],{date:'2026-11-08',status:'accepted',observedAt:old})]);
 assert.equal(pending.selected.length,1);
 assert.equal(pending.selected[0].evidence.canonical_owner,proposed[1].evidence.canonical_owner);
});

test('unrelated tenant or publisher metadata never blocks this original canonical owner',()=>{
 const proposed=make(), fake=[
  {...prior(proposed[0]),evidence:{...proposed[0].evidence,contract:'other-tenant'}},
  {...prior(proposed[1]),recommendation_type:'seo_first_mover_intent_gap',target_channel:'blog'}
 ];
 const result=reconcileOriginalSeoMoneyHandoffs(proposed,fake);
 assert.equal(result.selected.length,2);
 assert.equal(result.suppressed.length,0);
});

test('no new scheduler; original edge writer reads history, reports suppression and only counts actual inserts',()=>{
 const source=readFileSync(new URL('../supabase/functions/powerhouse-seo-opportunity-resolver/index.ts',import.meta.url),'utf8');
 assert.match(source,/reconcileOriginalSeoMoneyHandoffs\(originalMoneyCandidates,priorMoneyOwnerHandoffs\|\|\[\]\)/);
 assert.match(source,/SEO_ORIGINAL_OWNER_HISTORY_READ/);
 assert.match(source,/\.eq\('target_channel','website'\)\.eq\('recommendation_type','seo_money_page_update'\)/);
 assert.match(source,/onConflict:'dedupe_key',ignoreDuplicates:true/);
 assert.match(source,/\.select\('dedupe_key'\)/);
 assert.match(source,/owner_handoffs_suppressed:suppressedOriginalMoneyHandoffs\.length/);
 assert.match(source,/original_pending_handoff_refs:suppressedOriginalMoneyHandoffs\.map/);
 assert.doesNotMatch(source,/cron\.schedule\(|new \w*Scheduler|ALTER\s+TABLE|CREATE\s+TABLE/i);
 assert.equal(SEO_MONEY_OWNER_HANDOFF,'SEO_ORIGINAL_MONEY_OWNER_HANDOFF_V1');
});
