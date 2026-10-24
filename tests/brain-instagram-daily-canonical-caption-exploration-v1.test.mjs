import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {proposeBoundedCreativeExploration,selectMeasuredNextPostTest} from '../supabase/functions/_shared/measured-next-post-challenger.mjs';
import {selectMiraProblem,miraCaption,miraProductionEvidence,miraExplorationKind,validateMiraCaptionForDelivery} from '../supabase/functions/_shared/mira-entrepreneur-caption.mjs';
const rec={recommendation_id:'known-canonical',reason:'Geverifieerd ondernemersprobleem',evidence:{source:'canonical-library'}};
const proposal=date=>proposeBoundedCreativeExploration({channel:'instagram_company',runDate:date,recommendation:rec,freshness:{ok:true},measured:{state:'WAIT_FOR_COMPARABLE_PROVIDER_METRICS'}});
test('when no reliable cohort exists there is still only ONE source-backed, reversible Instagram experiment',()=>{
 const p=proposal('2026-10-24');assert.equal(p.state,'ONE_REVERSIBLE_DAILY_COPY_HYPOTHESIS');
 assert.equal(p.additional_publications,0);assert.equal(p.causal_lift_proven,false);
 assert.equal(p.primary_business_metric,'attributed_verified_paid_orders');assert.ok(miraExplorationKind(p,'2026-10-24'));
});
test('all three calendar-rotated caption variants retain the canon, attribution and fictional-person disclosure',()=>{
 const kinds=new Set();
 for(const date of ['2026-10-24','2026-10-25','2026-10-26','2026-10-27','2026-10-28','2026-10-29']){
   const problem=selectMiraProblem(date),p=proposal(date),actual=miraCaption(problem,p),base=miraCaption(problem);
   kinds.add(miraExplorationKind(p,date));assert.notEqual(actual,base);
   for(const value of [problem.scene,problem.description,problem.action,problem.capability,problem.metric,'Mira is een fictief AI-personage.'])assert.ok(actual.includes(value));
   const evidence={...miraProductionEvidence(problem),editorial_exploration:p,recommendation_id:rec.recommendation_id};
   assert.equal(validateMiraCaptionForDelivery(date,actual,evidence).ok,true);
   assert.equal(validateMiraCaptionForDelivery(date,actual,miraProductionEvidence(problem)).ok,false);
   assert.equal(validateMiraCaptionForDelivery(date,base,miraProductionEvidence(problem)).ok,true);
 }
 assert.equal(kinds.size,3);
});
test('stale, missing, personal or unverifiable recommendations are not used to vary captions',()=>{
 for(const r of [null,{reason:'not backed'},{reason:'not backed',evidence:{}}]){
  assert.equal(proposeBoundedCreativeExploration({channel:'instagram_company',runDate:'2026-10-24',recommendation:r}).state,'NO_EXPLORATION');
 }
 assert.equal(proposeBoundedCreativeExploration({channel:'instagram_company',runDate:'2026-10-24',recommendation:rec,freshness:{ok:false}}).state,'NO_EXPLORATION');
 assert.equal(proposeBoundedCreativeExploration({channel:'instagram_company',runDate:'2026-10-24',recommendation:rec,measured:{state:'SOURCE_UNAVAILABLE'}}).state,'NO_EXPLORATION');
 assert.equal(proposeBoundedCreativeExploration({channel:'linkedin_personal',runDate:'2026-10-24',recommendation:rec}).state,'NO_EXPLORATION');
});
test('independent publisher rejects mismatched identifiers, extra text and false evidence',()=>{
 const date='2026-10-25',problem=selectMiraProblem(date),p=proposal(date),caption=miraCaption(problem,p);
 const e={...miraProductionEvidence(problem),editorial_exploration:p,recommendation_id:rec.recommendation_id};
 for(const v of [{...e,recommendation_id:'unlinked'},{...e,editorial_exploration:{...p,run_date:'2026-10-24'}},{...e,editorial_exploration:{...p,causal_lift_proven:true}},{...e,editorial_exploration:{...p,additional_publications:1}}]){
   assert.equal(validateMiraCaptionForDelivery(date,caption,v).ok,false);
 }
 assert.equal(validateMiraCaptionForDelivery(date,caption+' koop nu!',e).ok,false);
});
test('the existing owner and protected publisher recompute the same exact source-bound caption',()=>{
 const source=readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
 const pub=readFileSync(new URL('../supabase/functions/powerhouse-social-publisher/index.ts',import.meta.url),'utf8');
 assert.ok(source.includes('bodyText=miraCaption(miraBusinessProblem);'));
 assert.ok(source.includes('bodyText=miraCaption(miraBusinessProblem,creativeExploration);'));
 assert.ok(source.includes('editorial_exploration:creativeExploration'));
 assert.ok(pub.includes('validateMiraCaptionForDelivery(runDate,art.body,art.generation_evidence||{})'));
 assert.ok(pub.includes('MIRA_MEDIA_CAPTION_SCENE_MISMATCH'));
});

test('Instagram metrics are read from owned-business posts only; two comparable observations produce a hypothesis, not proof of lift',()=>{
 const now=new Date('2026-10-24T18:20:00Z');
 const posts=[
  {tenant_id:'bedrijfsgeheugen',post_id:'ig-1',platform:'instagram',channel_kind:'instagram_business',published_at:'2026-10-20T09:00:00Z'},
  {tenant_id:'bedrijfsgeheugen',post_id:'ig-2',platform:'instagram',channel_kind:'instagram_company',published_at:'2026-10-20T09:00:00Z'},
  {tenant_id:'bedrijfsgeheugen',post_id:'li-1',platform:'linkedin',channel_kind:'linkedin_company',published_at:'2026-10-20T09:00:00Z'},
  {tenant_id:'other-company',post_id:'not-ours',platform:'instagram',channel_kind:'instagram_business',published_at:'2026-10-20T09:00:00Z'}
 ];
 const metric=id=>({tenant_id:'bedrijfsgeheugen',post_id:id,data_quality:'OBSERVED',observed_at:'2026-10-24T18:00:00Z',metrics:{reach:110,views:125,comments:0,likes:0}});
 const outcome=selectMeasuredNextPostTest({posts,snapshots:[metric('ig-1'),metric('ig-2'),metric('li-1'),metric('not-ours')],now,channel:'instagram_company'});
 assert.equal(outcome.evidence_scope,'SAME_OWNED_BRAND_INSTAGRAM_ONLY');
 assert.equal(outcome.state,'ELIGIBLE_BOUNDED_NEXT_POST_TEST');
 assert.equal(outcome.verified_comparable_posts,2);
 assert.equal(outcome.cumulative_verified_exposure,220);
 assert.equal(outcome.proposed_test.hypothesis_id,'TEST_RELEVANT_CUSTOMER_DISCUSSION_QUESTION');
 assert.equal(outcome.hypothesis_not_caused_or_proven,true);
 const missing=selectMeasuredNextPostTest({posts,snapshots:[metric('ig-1'),{...metric('ig-2'),metrics:{reactions:3,views_unavailable:true}}],now,channel:'instagram_company'});
 assert.equal(missing.state,'WAIT_FOR_COMPARABLE_PROVIDER_METRICS');
 assert.equal(missing.verified_comparable_posts,1);
 assert.throws(()=>selectMeasuredNextPostTest({posts,snapshots:[],now,channel:'linkedin_personal'}),/MEASURED_CREATIVE_CHANNEL_INVALID/);
});
