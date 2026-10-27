import test from 'node:test';
import assert from 'node:assert/strict';
import {runEvaluation} from '../netlify/functions/social-learning-evaluate.mjs';
const now=new Date('2026-10-24T16:10:00Z');
const post={postId:'linkedin-company:urn:li:share:7518915119540576256',
  tenantId:'bedrijfsgeheugen',platform:'linkedin',publishedAt:'2026-10-22T16:10:00Z',dueWindow:48};
test('provider-date daily scope can NEVER be an exact 48h evaluation or produce a PROVEN post winner',async()=>{
 const events=[],evaluations=[];
 const store={listDuePosts:async()=>[post],getSnapshots:async()=>[
   {postId:post.postId,observedAt:now.toISOString(),dataQuality:'OBSERVED_PARTIAL_SCOPE',
     source:'windsor-linkedin-organic-company',metrics:{impressions:13,likes:0,comments:0,
       metric_scope:'LINKEDIN_ORGANIC_POST_PROVIDER_DATE_NOT_LIFETIME'}}],
   recordObligation:async x=>events.push(x),putEvaluation:async x=>evaluations.push(x)};
 const result=await runEvaluation({store,now,maxDuePosts:2});
 assert.equal(result.evaluated,0);
 assert.equal(result.missedObligations,1);
 assert.equal(evaluations.length,0);
 assert.equal(events[0].type,'UNVERIFIED_OR_PARTIAL_WINDOW');
});
test('a genuinely 48h OBSERVED snapshot remains evaluable and measures only source-backed fields',async()=>{
 const evaluations=[];
 const store={listDuePosts:async()=>[post],getSnapshots:async()=>[
   {postId:post.postId,observedAt:now.toISOString(),dataQuality:'OBSERVED_PARTIAL_SCOPE',metrics:{impressions:100,likes:10}},
   {postId:post.postId,observedAt:new Date(now.getTime()-3600000).toISOString(),dataQuality:'OBSERVED',metrics:{impressions:100,likes:2}}],
   getCohort:async()=>[],putEvaluation:async x=>evaluations.push(x)};
 const result=await runEvaluation({store,now,maxDuePosts:2});
 assert.equal(result.evaluated,1);
 assert.equal(evaluations.length,1);
 assert.equal(evaluations[0].metricVector.likes,2);
 assert.equal(evaluations[0].metricVector.impressions,100);
});
