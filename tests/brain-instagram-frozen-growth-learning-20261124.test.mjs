import test from 'node:test';
import assert from 'node:assert/strict';
import {MIRA_CASES} from '../supabase/functions/_shared/mira-entrepreneur-caption.mjs';
import {resolveMiraFrozenWinner,bindMiraGrowthExperiment,miraResolvedCaption,miraResolvedEvidence,validateResolvedMiraCaptionForDelivery} from '../supabase/functions/_shared/mira-frozen-winner-contract.mjs';
import {selectMeasuredNextPostTest,proposeBoundedCreativeExploration} from '../supabase/functions/_shared/measured-next-post-challenger.mjs';

const date='2026-11-24',id='fixture-frozen-winner',url='https://example.org/source';
const problem=MIRA_CASES.find(p=>p.id==='PH-P013');
const resolved=resolveMiraFrozenWinner(date,{
 winner:{run_date:date,recommendation_id:id},
 lineage:{run_date:date,winner_recommendation_id:id,state:'WINNER_FROZEN',source_evidence:{source_hash:'a'.repeat(64),source_url:url}},
 recommendation:{recommendation_id:id,status:'accepted',evidence:{source_backed:true,source_url:url,source_title:'Fixture',approved_canonical_problem_id:problem.id,approved_mira_scene:problem.scene}},
 job:{asset_manifest:{daily_winner_recommendation_id:id}}
});
test('exact frozen source, not date rotation, consumes one real hypothesis in caption',()=>{
 assert.equal(resolved.ok,true);
 const creative=proposeBoundedCreativeExploration({runDate:date,channel:'instagram_company',recommendation:{recommendation_id:id,reason:'fixture',evidence:{source_backed:true}},freshness:{ok:true}});
 const bound=bindMiraGrowthExperiment(resolved,{runDate:date,creative});
 assert.ok(bound.growth_experiment);
 const caption=miraResolvedCaption(bound),base=miraResolvedCaption(resolved),ev=miraResolvedEvidence(bound);
 assert.notEqual(caption,base);assert.ok(caption.includes(problem.scene));assert.ok(caption.includes('Mira is een fictief AI-personage'));
 assert.equal(validateResolvedMiraCaptionForDelivery(date,caption,ev,resolved).ok,true);
 assert.equal(validateResolvedMiraCaptionForDelivery(date,caption,ev).ok,false);
 for(const bad of [{...ev,mira_source_hash:'b'.repeat(64)},{...ev,mira_winner_recommendation_id:'other'},{...ev,mira_growth_experiment:{...ev.mira_growth_experiment,run_date:'2026-11-25'}},{...ev,mira_growth_experiment:{...ev.mira_growth_experiment,additional_publications:1}},{...ev,mira_growth_experiment:{...ev.mira_growth_experiment,causal_lift_proven:true}}])assert.equal(validateResolvedMiraCaptionForDelivery(date,caption,bad,resolved).ok,false);
 assert.equal(validateResolvedMiraCaptionForDelivery(date,caption+' extra',ev,resolved).ok,false);
});
test('measured challenger is source-bound, takes precedence and does not mutate approved external captions',()=>{
 const measured={state:'ELIGIBLE_BOUNDED_NEXT_POST_TEST',evidence_scope:'SAME_OWNED_BRAND_INSTAGRAM_ONLY',hypothesis_not_caused_or_proven:true,proposed_test:{hypothesis_id:'TEST_SHAREABLE_CONCRETE_BUSINESS_FRICTION'}};
 const x=bindMiraGrowthExperiment(resolved,{runDate:date,measured});
 assert.equal(x.growth_experiment.kind,'SCENE_HOOK');assert.equal(x.growth_experiment.owner,'EXISTING_MEASURED_CHALLENGER');
 assert.equal(bindMiraGrowthExperiment(resolved,{runDate:date,measured:{...measured,evidence_scope:'OTHER'}}).growth_experiment,null);
 const fixed={kind:'approved_source_led',caption:'Frozen fixed caption'};
 assert.equal(miraResolvedCaption(bindMiraGrowthExperiment(fixed,{runDate:date,measured})),fixed.caption);
});
test('missing comment counts or views without actual reach cannot masquerade as measured low engagement',()=>{
 const now=new Date('2026-11-24T10:00:00Z');
 const ids=['17992107825115789','18060985460558066'];
 const posts=ids.map(i=>({tenant_id:'bedrijfsgeheugen',platform:'instagram',channel_kind:'instagram_business',post_id:'instagram:'+i,external_post_id:i,published_at:'2026-11-21T10:00:00Z'}));
 const snapshots=metrics=>ids.map(i=>({tenant_id:'bedrijfsgeheugen',post_id:'instagram:'+i,source:'composio-instagram',source_event_id:'composio:instagram:'+i+':slot',data_quality:'OBSERVED',observed_at:'2026-11-24T09:00:00Z',metrics}));
 const evaluate=m=>selectMeasuredNextPostTest({posts,snapshots:snapshots(m),now,channel:'instagram_company'});
 assert.equal(evaluate({reach:120,views:160}).state,'WAIT_FOR_COMPARABLE_PROVIDER_METRICS');
 assert.equal(evaluate({views:160,comments:0,shares:0,saved:0}).state,'WAIT_FOR_COMPARABLE_PROVIDER_METRICS');
 assert.equal(evaluate({reach:120,views:160,comments:0}).proposed_test.hypothesis_id,'TEST_RELEVANT_CUSTOMER_DISCUSSION_QUESTION');
 assert.equal(evaluate({reach:120,views:160,shares:0}).proposed_test.hypothesis_id,'TEST_SHAREABLE_CONCRETE_BUSINESS_FRICTION');
});
