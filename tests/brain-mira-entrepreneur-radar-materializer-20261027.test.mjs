import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MIRA_CASES} from '../supabase/functions/_shared/mira-entrepreneur-caption.mjs';
import {resolveMiraFrozenWinner} from '../supabase/functions/_shared/mira-frozen-winner-contract.mjs';
import {evaluateMiraPublicationFreshness} from '../supabase/functions/_shared/mira-publication-freshness.mjs';
const radar=readFileSync('supabase/functions/powerhouse-mira-problem-radar/index.ts','utf8');
const sql=readFileSync('supabase/migrations/20261027190000_mira_entrepreneur_signal_materializer_v1.sql','utf8');
const topicSrc=radar.match(/const portalIds:Record<string,string>=\{([\s\S]*?)\};/)[1];
const portalIds=Object.fromEntries([...topicSrc.matchAll(/'([a-z-]+)':'(PH-P\d{3})'/g)].map(m=>[m[1],m[2]]));

test('every radar topic maps to an existing canonical PH-P with a scene',()=>{
 assert.equal(Object.keys(portalIds).length,12);
 for(const id of Object.values(portalIds)) assert.ok(MIRA_CASES.find(c=>c.id===id)?.scene,id);
});
test('radar searches fresh news only and keeps the shared freshness gate as authority',()=>{
 assert.match(radar,/topic:'news',days:MAX_AGE_DAYS/);
 assert.match(radar,/serp\/google\/news\/live\/advanced/);
 assert.match(radar,/evaluateMiraPublicationFreshness\(/);
 assert.match(radar,/eligible:total>=0\.72&&publication\.eligible&&Boolean\(portalProblemId\)/);
 assert.doesNotMatch(radar,/topic:'general'/);
 assert.match(radar,/mira-entrepreneur-portal-story-v1/);
 assert.match(radar,/providers,max_age_days:MAX_AGE_DAYS/); // run response shows which provider delivered fresh items
});
test('provider timestamps from DataForSEO News are accepted by the freshness gate only when recent',()=>{
 const now=Date.parse('2026-10-27T12:00:00Z');
 assert.equal(evaluateMiraPublicationFreshness({providerPublishedAt:'2026-10-26',observedAt:now}).eligible,true);
 assert.equal(evaluateMiraPublicationFreshness({providerPublishedAt:'2022-10-26',observedAt:now}).eligible,false);
 assert.equal(evaluateMiraPublicationFreshness({providerPublishedAt:null,observedAt:now}).eligible,false);
});
test('materializer no longer forbids the business bridge and keeps freshness, dedupe and permissions',()=>{
 assert.doesNotMatch(sql,/'forced_business_bridge_forbidden'/);
 assert.doesNotMatch(sql,/'office_problem_attribution_forbidden'/);
 assert.match(sql,/approved_canonical_problem_id/);
 assert.match(sql,/source_published_at >= \(p_date - interval '60 days'\)/);
 assert.match(sql,/SOURCE_PUBLICATION_DATE_UNVERIFIED_OR_STALE/);
 assert.match(sql,/WINNER_ALREADY_FROZEN/);
 assert.match(sql,/l\.run_date >= p_date-90/);
 assert.match(sql,/'mira-public-complaint-source-loop-v1'/); // selector filter value stays
 assert.match(sql,/REVOKE EXECUTE[\s\S]*FROM PUBLIC, anon, authenticated/);
 assert.match(sql,/TO service_role/);
});
test('a materialised recommendation resolves to the library-mapped winner (no hard-coded approval needed)',()=>{
 const runDate='2026-10-28',problem=MIRA_CASES.find(c=>c.id==='PH-P002'),id='11111111-1111-4111-8111-111111111111';
 const url='https://example.nl/nieuws/offertes-opvolgen',hash='a'.repeat(64);
 const recommendation={recommendation_id:id,status:'accepted',evidence:{source_backed:true,source_url:url,source_title:'Offertes blijven liggen',approved_canonical_problem_id:problem.id,approved_mira_scene:problem.scene}};
 const lineage={run_date:runDate,state:'WINNER_FROZEN',winner_recommendation_id:id,source_evidence:{source_url:url,source_hash:hash}};
 const r=resolveMiraFrozenWinner(runDate,{winner:{recommendation_id:id},lineage,recommendation,job:null});
 assert.equal(r.ok,true);assert.equal(r.kind,'approved_frozen_library_mapping');assert.equal(r.problem.id,'PH-P002');
 // the old consumer shape is still blocked without a per-day approval
 const old={...recommendation,evidence:{...recommendation.evidence,forced_business_bridge_forbidden:true}};
 assert.equal(resolveMiraFrozenWinner(runDate,{winner:{recommendation_id:id},lineage,recommendation:old}).code,'SOURCE_BACKED_MIRA_SCENE_ROUTE_REQUIRED');
 // a scene that differs from the library is refused
 const bad={...recommendation,evidence:{...recommendation.evidence,approved_mira_scene:'andere scène'}};
 assert.equal(resolveMiraFrozenWinner(runDate,{winner:{recommendation_id:id},lineage,recommendation:bad}).code,'WINNER_SCENE_UNVERIFIED');
});

test('radar declares title and excerpt before they are used (no temporal-dead-zone ReferenceError at runtime)',()=>{
 const decl=radar.indexOf("const title=String(x.title||'').trim()");
 const use=radar.indexOf("topic(title+' '+excerpt)");
 assert.ok(decl>0&&use>0,'both statements present');
 assert.ok(decl<use,'title/excerpt must be declared before topic(title+excerpt)');
});

test('radar treats a failed DataForSEO task as an error instead of zero results',()=>{
 assert.match(radar,/taskCode=Number\(b\?\.tasks\?\.\[0\]\?\.status_code/);
 assert.match(radar,/taskCode!==20000\) throw new Error\('DATAFORSEO_'/);
});

test('radar uses short news queries, a 45-day window inside the 60-day gate, and counts task 40101 as no results',()=>{
 assert.match(radar,/MAX_AGE_DAYS=45/);
 assert.doesNotMatch(radar,/mkb excel chaos spreadsheets cijfers/);
 assert.match(radar,/taskCode===40101/);
 assert.match(radar,/dataforseo_no_results/);
});

test('radar keeps eight bounded searches while prioritizing concrete mkb receivables and billing friction',()=>{
 const querySection=radar.match(/const queries=\[([\s\S]*?)\];/)[1];
 assert.equal((querySection.match(/'mkb /g)||[]).length,8,'preserve bounded provider request count');
 assert.match(querySection,/mkb onbetaalde facturen debiteuren/);
 assert.match(querySection,/mkb facturering te laat/);
 assert.doesNotMatch(querySection,/'mkb ondernemers'/);
 assert.match(radar,/oninbare vorder/);
 assert.match(radar,/onbetaalde factur/);
 assert.match(radar,/betalingsachterstand/);
 // The actual source publication timestamp and uniqueness gate are not relaxed.
 assert.match(radar,/evaluateMiraPublicationFreshness\(/);
 assert.match(radar,/eligible:total>=0\.72&&publication\.eligible/);
});
