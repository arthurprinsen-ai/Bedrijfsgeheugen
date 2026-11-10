import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {selectOriginalSeoMoneyHandoffs,SEO_MONEY_OWNER_HANDOFF} from '../supabase/functions/powerhouse-seo-opportunity-resolver/money-page-handoff.mjs';

const DATE='2026-11-10', NOW='2026-11-10T06:00:00.000Z';
const owner=(name,role='money')=>({
 route:'https://www.bedrijfsgeheugen.nl/'+name,
 primary_intent:name,primary_keyword:name,role,
 primary_cta:{url:'https://www.bedrijfsgeheugen.nl/frisse-blik',action:'frisse-blik'}
});
const candidate=(keyword,route,score=80,extra={})=>({
 action:'UPDATE_MONEY_PAGE',keyword,owner:owner(route),score,
 row:{zoekvolume:140,cpc:5.62,opgehaald_op:'2026-11-09T06:00:08.939Z'},
 gsc:{impressions:7,clicks:0,position:93.7},
 ...extra
});
const decide=(items,opts={})=>selectOriginalSeoMoneyHandoffs(items,{
 runDate:DATE,observedAt:NOW,...opts
});

test('five original observed queries give one exact canonical handoff per money page',()=>{
 const rows=[
  candidate('twinfield api','twinfield-koppeling',69),
  candidate('twinfield koppelingen','twinfield-koppeling',71),
  candidate('koppeling twinfield','twinfield-koppeling',68),
  candidate('exact online api','exact-online-koppeling',76),
  candidate('twinfield boekhouden','twinfield-koppeling',72)
 ];
 const got=decide(rows);
 assert.equal(got.length,2);
 assert.deepEqual(got.map(x=>x.dedupe_key),[
  'seo-owner-update:2026-11-10:exact-online-koppeling',
  'seo-owner-update:2026-11-10:twinfield-koppeling'
 ]);
 assert.equal(got[1].topic_key,'twinfield boekhouden');
 assert.ok(got.every(x=>x.status==='suggested'&&x.target_channel==='website'));
 assert.ok(got.every(x=>x.evidence.contract===SEO_MONEY_OWNER_HANDOFF));
 assert.ok(got.every(x=>x.evidence.state==='ORIGINAL_SEO_EXECUTION_HANDOFF_PENDING'));
 assert.ok(got.every(x=>x.evidence.no_unverified_execution_or_revenue===true));
 assert.ok(got.every(x=>x.evidence.canonical_cta.endsWith('/frisse-blik')));
});
test('same date/owner action is deterministic, bounded and source-fresh',()=>{
 const items=['a','b','c','d'].map((s,i)=>candidate(s,s,99-i));
 const chosen=decide(items);
 assert.equal(chosen.length,3);
 assert.deepEqual(decide(items),chosen);
 assert.equal(decide(items,{max:999}).length,3);
 assert.equal(decide(items,{max:1}).length,1);
});
test('reject stale, future, foreign, unverifiable, weak, irrelevant and duplicate-blog actions',()=>{
 const valid=candidate('api koppeling','api-koppeling-laten-maken');
 const checks=[
  {...valid,row:{...valid.row,opgehaald_op:'2026-10-20T06:00:00Z'}},
  {...valid,row:{...valid.row,opgehaald_op:'2026-11-12T06:00:00Z'}},
  {...valid,owner:{...valid.owner,route:'https://evil.example/other'}},
  {...valid,owner:{...valid.owner,role:'support'}},
  {...valid,owner:{...valid.owner,primary_cta:{url:'https://evil.example/other'}}},
  {...valid,action:'CREATE_INTENT_GAP_CONTENT'},
  {...valid,score:40}
 ];
 assert.equal(decide(checks).length,0);
 assert.throws(()=>decide([valid],{runDate:'unknown'}),/CLOCK_REQUIRED/);
});
test('original resolver persists only deduped existing recommendation and leaves website execution due',async()=>{
 const source=await readFile(new URL('../supabase/functions/powerhouse-seo-opportunity-resolver/index.ts',import.meta.url),'utf8');
 assert.match(source,/selectOriginalSeoMoneyHandoffs\(top,\{runDate,observedAt,max:3\}\)/);
 assert.match(source,/onConflict:'dedupe_key',ignoreDuplicates:true/);
 assert.match(source,/execution_readback:'EVIDENCE_DUE'/);
 assert.match(source,/owner_handoffs_written:ownerHandoffsWritten/);
 assert.doesNotMatch(source,/git push|netlify deploy|scheduled\(.*money-page/i);
});
