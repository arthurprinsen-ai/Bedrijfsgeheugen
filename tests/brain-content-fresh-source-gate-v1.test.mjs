import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifyCurrentSource} from '../supabase/functions/_shared/content-source-freshness.mjs';
const now=new Date('2026-10-24T17:30:00Z');
const current={recommendation_type:'source_backed_problem_search_intent',evidence:{
 source_backed:true,source_kind:'current_external_mkb_signal',
 source_url:'https://open.overheid.nl/documenten/test',source_published_at:'2026-10-19T10:00:00Z',
 source_observed_at:'2026-10-20T05:51:16Z'}};
test('2020 government document crawled in 2026 is historical, not current market news',()=>{
 const x=classifyCurrentSource({...current,evidence:{...current.evidence,source_published_at:'2020-06-15T00:00:00Z'}},{now});
 assert.equal(x.ok,false);assert.equal(x.reason,'CURRENT_SOURCE_HISTORICAL_PUBLICATION');
});
test('a current crawler timestamp is insufficient without original publication date',()=>{
 const x=classifyCurrentSource({...current,evidence:{...current.evidence,source_published_at:null}},{now});
 assert.equal(x.ok,false);assert.equal(x.reason,'CURRENT_SOURCE_ORIGINAL_DATE_UNVERIFIED');
});
test('fresh 2026 source and first-party semantic/SEO signal remain eligible',()=>{
 assert.equal(classifyCurrentSource(current,{now}).ok,true);
 assert.equal(classifyCurrentSource({evidence:{source_backed:false}},{now}).ok,true);
});
test('unverified, future, non-HTTPS or stale sources are not promoted',()=>{
 for(const evidence of [
  {...current.evidence,source_observed_at:'2026-09-01T12:00:00Z'},
  {...current.evidence,source_published_at:'2026-11-01T10:00:00Z'},
  {...current.evidence,source_url:'http://open.overheid.nl/doc'},
  {...current.evidence,source_url:'https://user:pass@open.overheid.nl/doc'}
 ])assert.equal(classifyCurrentSource({...current,evidence},{now}).ok,false);
});
test('canonical generator must apply freshness before scoring and retain source-fallback provenance',()=>{
 const src=fs.readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
 assert.ok(src.includes('!classifyCurrentSource(row).ok'));
 assert.ok(src.includes('source_freshness_fallback:sourceFreshnessFallback'));
 assert.ok(src.includes('pickRecommendation(recs,pending.channel,requiredRecommendationId?'));
 assert.ok(src.includes('brief:recommendation?.reason'));
});
