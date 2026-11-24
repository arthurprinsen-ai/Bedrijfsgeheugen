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
