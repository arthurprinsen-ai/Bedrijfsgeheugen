import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCreativeRecipe,selectPersonalGrowthMethod} from '../brain/creative/revenue-content-intelligence.mjs';
const rows=(method,start,comments)=>Array.from({length:5},(_,i)=>({channel:'linkedin_personal',cohortId:'same-owner-same-format',format:'text_story',windowHours:48,providerReadbackVerified:true,providerPostId:'urn:li:share:'+String(start+i),method,impressions:1000,substantiveComments:comments}));
const input={mode:'EXPLOIT',seed:'today',cohortId:'same-owner-same-format',observations:[...rows('concrete_detail',100,15),...rows('natural_reflection',200,3)]};
test('comparable independent personal data may inform one descriptive hypothesis, never causal proof or send authority',()=>{
 const r=selectPersonalGrowthMethod(input); assert.equal(r.method,'concrete_detail'); assert.equal(r.decision,'OBSERVATIONAL_CANDIDATE'); assert.equal(r.causalLiftProven,false); assert.equal(r.authorizesPublication,false);
});
test('unknown comments, mismatched cohort, channel, timing and repeated URN do not create a winner',()=>{
 for(const mutate of [r=>({...r,substantiveComments:null}),r=>({...r,cohortId:'other'}),r=>({...r,channel:'linkedin_company'}),r=>({...r,windowHours:24}),r=>({...r,providerPostId:'urn:li:share:1'}),r=>({...r,providerReadbackVerified:false}),r=>({...r,impressions:0})]){
  assert.equal(selectPersonalGrowthMethod({...input,observations:input.observations.map(mutate)}).measurement,'NOT_MEASURED');
 }
 assert.equal(selectPersonalGrowthMethod({...input,observations:[...input.observations,input.observations[0]]}).measurement,'NOT_MEASURED');
});
test('original recipe remains source-gated and does not convert commercial radar into personal copy',()=>{
 const r=buildCreativeRecipe({channel:'linkedin_personal',opportunity:{topic:'sales',pain:'revenue'},mode:'EXPLOIT',personalGrowthEvidence:input});
 assert.equal(r.personalGrowthHypothesis.decision,'OBSERVATIONAL_CANDIDATE'); assert.equal(r.topic,null); assert.equal(r.requiresVerifiedUserFact,true); assert.equal(r.requiresIndependentFinalReview,true); assert.equal(r.mandatoryQuestion,false); assert.equal('offerType' in r,false);
 assert.equal(selectPersonalGrowthMethod({...input,mode:'EXPLORE'}).decision,'CONTROLLED_EXPLORATION');
 assert.equal('personalGrowthHypothesis' in buildCreativeRecipe({channel:'linkedin_company'}),false);
});

import {diagnoseDailyPerformance,diagnosePersonalGrowth} from '../tools/content-growth/daily-performance-diagnostics.mjs';
import {queries} from '../tools/content-growth/collect-canonical-evidence.mjs';
const at=new Date('2026-11-24T12:00:00Z');
const personalRows=input.observations.map((r,i)=>({tenant_id:'canonical',platform:'linkedin',channel_kind:'linkedin_personal',post_id:'internal-'+i,external_post_id:r.providerPostId,personal_publication_verified:true,format:'text_story',hook_type:r.method,published_at:'2026-11-20T12:00:00Z',trend_observed_at:'2026-11-22T12:00:00Z',trend_data_quality:'PROVIDER_OBSERVED',trend_source_event_id:'provider-event-'+i,trend_metrics:{impressions:r.impressions,substantive_comments:r.substantiveComments},observed_at:'2026-11-23T12:00:00Z',data_quality:'OBSERVED',metrics:{views:100,reach:100,likes:0,comments:0}}));
test('original daily analyst passes only explicit personal method and provider-linked age-aligned observations to selection',()=>{
 const report=diagnoseDailyPerformance({evidence:{state:'READ_ONLY_PROVIDER_OBSERVED',social:personalRows},now:at});
 assert.equal(report.personal_growth.eligible_observations,10);
 assert.equal(report.personal_growth.learning_applied,false);
 assert.equal(report.personal_growth.authorizesPublication,false);
 assert.ok(report.social_posts.every(r=>r.suggestion==='USE_SOURCE_LED_PERSONAL_GROWTH_HYPOTHESIS'));
 assert.equal(report.next_day_hypotheses.length,0);
 assert.ok(queries.social.includes('o.external_id=r.external_post_id'));
 assert.ok(queries.social.includes('o.live_proven_at is not null'));
 assert.ok(queries.social.includes('w.source_event_id trend_source_event_id'));
});
test('original analyst rejects missing real substantive metrics, absent proof, company data, future or untagged snapshots',()=>{
 for(const mutate of [r=>({...r,trend_metrics:{impressions:1000,comments:2}}),r=>({...r,personal_publication_verified:false}),r=>({...r,tenant_id:'bedrijfsgeheugen'}),r=>({...r,hook_type:'unknown'}),r=>({...r,trend_source_event_id:null}),r=>({...r,trend_observed_at:'2026-11-25T12:00:00Z'})]){
  const report=diagnosePersonalGrowth({state:'READ_ONLY_PROVIDER_OBSERVED',social:personalRows.map(mutate)},at);
  assert.equal(report.eligible_observations,0);
  assert.equal(report.hypothesis.measurement,'NOT_MEASURED');
 }
 assert.equal(diagnosePersonalGrowth({state:'AUTH_REQUIRED',social:personalRows},at).eligible_observations,0);
});

import {PERSONAL_GROWTH_METHODS,selectCompanyContentVariation} from '../brain/creative/revenue-content-intelligence.mjs';
import {diagnoseCompanyContentVariation} from '../tools/content-growth/daily-performance-diagnostics.mjs';
test('personal source-led experiments rotate away from repeated methods without inventing a source or a winner',()=>{
 assert.ok(PERSONAL_GROWTH_METHODS.length>=9);
 const repeated=selectPersonalGrowthMethod({...input,recentMethods:['concrete_detail','concrete_detail']});
 assert.equal(repeated.decision,'DIVERSITY_CHALLENGER');
 assert.notEqual(repeated.method,'concrete_detail');
 assert.equal(repeated.authorizesPublication,false);
 const limited=selectPersonalGrowthMethod({eligibleMethods:['design_tradeoff'],recentMethods:['concrete_detail']});
 assert.equal(limited.method,'design_tradeoff');
 assert.equal(selectPersonalGrowthMethod({eligibleMethods:[]}).method,null);
});
test('company independently rotates source-compatible editorial formats and families, never promises a send',()=>{
 const r=selectCompanyContentVariation({seed:'today',recentFormats:['carousel','carousel'],eligibleFormats:['carousel','diagnostic'],recentFamilies:['checklist','checklist'],eligibleFamilies:['checklist','how_to']});
 assert.equal(r.format,'diagnostic');assert.equal(r.family,'how_to');assert.equal(r.authorizesPublication,false);
 assert.equal(selectCompanyContentVariation({eligibleFormats:['unsupported'],eligibleFamilies:[]}).format,null);
 assert.equal(selectCompanyContentVariation({}).family,null);
 const companyRows=personalRows.slice(0,2).map(r=>({...r,tenant_id:'bedrijfsgeheugen',channel_kind:'linkedin_company',company_publication_verified:true,format:'carousel'}));
 const result=diagnoseCompanyContentVariation({state:'READ_ONLY_PROVIDER_OBSERVED',social:[...companyRows,...personalRows]},at);
 assert.deepEqual(result.recentFormats,['carousel','carousel']);
 assert.notEqual(result.variation.format,'carousel');
 assert.equal(result.learning_applied,false);
 assert.ok(queries.social.includes('company_publication_verified'));
});
