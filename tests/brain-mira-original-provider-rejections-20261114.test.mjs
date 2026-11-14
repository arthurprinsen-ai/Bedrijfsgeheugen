import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('supabase/functions/powerhouse-mira-problem-radar/index.ts','utf8');
const skill=readFileSync('.agents/skills/instagram-composio-publisher/SKILL.md','utf8');
const agents=readFileSync('platform/agents/agent-team.mjs','utf8');

test('the original radar can distinguish returned news from eligible, stored source receipts',()=>{
  for(const key of ['sourceCandidates++','sourceRejectCounts','sourceRejectSamples','MISSING_PROVIDER_URL','DUPLICATE_IN_SAME_RADAR_RUN','INVALID_DOMAIN_OR_SHORT_TITLE','REJECTED_SOURCE_URL_QUALITY','NO_CANONICAL_TOPIC_MATCH','CROSS_CHANNEL_SOURCE_CONTRACT_COLLISION','FAILED_SCORE_OR_VERIFIED_DATE_GATE']) {
    assert.ok(source.includes(key),key);
  }
  assert.match(source,/sourceIntake:\{providerCandidates:sourceCandidates,rejections:sourceRejectCounts,samples:sourceRejectSamples\}/);
  assert.match(source,/source_intake_audit:\{provider_candidates:sourceCandidates,rejections:sourceRejectCounts,samples:sourceRejectSamples\}/);
  assert.match(source,/sourceRejectSamples\.length<8/);
  assert.match(source,/title:title\.slice\(0,140\)/);
});
test('publication and original independent-source safety gates are untouched',()=>{
  for(const guard of [
    "authorizePowerhouseScheduler(req)","classifyMiraSourceUrl(sourceUrl)","if(!problemTopic||(!personalTopic&&!portalProblemId))",
    "evaluateMiraPublicationFreshness(","eligible:total>=0.72&&publication.eligible",
    "priorContract && priorContract!==row.metadata.contract",
    "powerhouse_materialize_mira_problem_recommendation_v1",
    "brain_observe_failure",
    "classifyMiraRadarHttpStatus({sourceReady:supply.ok,errors})",
    "sendsAuthorized:false"
  ]) assert.ok(source.includes(guard),guard);
  assert.doesNotMatch(source,/cron\.schedule\(|INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH|UPDATE content_publication_obligations/i);
  assert.match(source,/MAX_AGE_DAYS=45/);
});
test('existing agents and existing publisher skill route both broken producer handoffs',()=>{
  assert.match(agents,/audit-original-mira-provider-candidates-vs-rejected-source-reasons/);
  assert.match(agents,/require-original-openart-media-job-claim-and-exact-proof-before-meta-write/);
  assert.match(skill,/net\._http_response\.id=31043/);
  assert.match(skill,/sourceIntake\.rejections/);
  assert.match(skill,/powerhouse_claim_instagram_media_job_v1/);
  assert.match(skill,/LIVE_PROVEN/);
  assert.match(skill,/No direct second Instagram send/);
});
