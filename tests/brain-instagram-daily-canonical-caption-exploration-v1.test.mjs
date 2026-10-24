import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {proposeBoundedCreativeExploration} from '../supabase/functions/_shared/measured-next-post-challenger.mjs';
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
