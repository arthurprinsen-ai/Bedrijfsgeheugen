import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlannedActionEvidence } from '../brain/observability/planned-action-recall.mjs';
import { compileIndependentReviewQueue, verifyIndependentGithubAttestation, evaluateApprovedCanonicalReviews } from '../brain/observability/planned-action-review-queue.mjs';
import { runReadOnlyReviewAudit, trustedBrainReadConfig, readCanonicalReviewCorpus } from '../scripts/brain/planned-action-review-audit.mjs';
const SHA = '5f71b90ea09698f22a0407adeb285b3a59fd47ce';
const OBSERVED = '2026-11-06T22:31:20.000Z';
const NOW = '2026-11-06T23:00:00.000Z';
const key = 'local-test-hmac-only-not-a-real-provider-key-0123456789';

function decision(executionId,agentId,ruleIds=[],blocked=[]) {
  const item=buildPlannedActionEvidence({
    tenantId:'canonical',action:'An actual run step in original source '+executionId,
    result:{ok:blocked.length===0,matches:ruleIds.map(ruleId=>({ruleId})),unacknowledged:blocked.map(ruleId=>({ruleId}))},
    agentId,sourceRef:'github:run:42305308559',executionId,observedAt:OBSERVED,hmacKey:key,
  }).record;
  return {...item,sourceRevision:SHA};
}
const negative=decision('run-42305308559-attempt-1-test','production-release-readback');
const alsoNegative=decision('run-42305308687-attempt-1-test','main-write-integrity');
function reviewFor(origin,reviewerId='github:independent-reviewer'){
  return { tenantId:'canonical',type:'Verification',kind:'verification',
    id:'review:'+origin.id,observedAt:'2026-11-06T22:50:00.000Z',
    status:'REVIEWED',verified:true,
    payload:{contract:'PLANNED_ACTION_INDEPENDENT_REVIEW_V1',decisionRecordId:origin.id,
      expectedRuleIds:[],reviewerId,independent:true,
      evidenceRef:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5515'}};
}
function githubFetch(origin,review,override={}) {
  const encoded=Buffer.from(JSON.stringify({
    contract:'PLANNED_ACTION_INDEPENDENT_REVIEW_V1',decisionRecordId:origin.id,
    expectedRuleIds:[],reviewerId:review.payload.reviewerId,sourceRef:origin.payload.sourceRef,
    actionHmacSha256:origin.payload.actionHmacSha256,sourceRevision:SHA,
    evidenceRef:review.payload.evidenceRef,
  })).toString('base64');
  const headSha='1234567890123456789012345678901234567890';
  const body={
    pulls:{ state:'closed',merged:true,base:{ref:'main'},head:{sha:headSha,repo:{full_name:'arthurprinsen-ai/Bedrijfsgeheugen'}},
      merge_commit_sha:'2222222222222222222222222222222222222222',user:{login:'author'}},
    reviews:[{user:{login:'independent-reviewer'},commit_id:headSha,state:'APPROVED',submitted_at:'2026-11-06T22:45:00Z'}],
    files:[{filename:'brain/independent-reviews/'+origin.id+'.json',status:'added'}],
    file:{type:'file',encoding:'base64',content:encoded},
    ...override,
  };
  const urls=[];
  return {urls, fetchImpl:async url=>{
    urls.push(url);
    let val=url.includes('/reviews?')?body.reviews:url.includes('/files?')?body.files
      :url.includes('/contents/')?body.file:body.pulls;
    return {ok:true,json:async()=>val};
  }};
}

test('real source records produce reviewable queue but never pretend to be independently reviewed',()=>{
  const result=compileIndependentReviewQueue([negative,alsoNegative],{now:NOW});
  assert.equal(result.counts.observed,2);
  assert.equal(result.counts.pending,2);
  assert.equal(result.counts.distinctAgents,2);
  assert.equal(result.counts.safeObserved,2);
  assert.equal(result.counts.blockedObserved,0);
  assert.equal(result.metrics.verdict,'NOT_MEASURED');
  assert.equal(result.metrics.metrics.recall,null);
  assert.equal(result.metrics.metrics.falseBlockRate,null);
  assert.equal(result.queue[0].sourceUrl,'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/42305308559');
  assert.ok(!JSON.stringify(result).includes('An actual run step'),'raw plan never output to queue');
  assert.ok(result.queue[0].reviewerEvidencePath.startsWith('brain/independent-reviews/'));
});

test('missing/repeated/synthetic source rows are rejected from the actual corpus',()=>{
  const malformed={...negative,sourceRevision:null};
  const bad=compileIndependentReviewQueue([malformed,negative,negative,alsoNegative],{now:NOW});
  assert.equal(bad.counts.conflictingObservationIds,1);
  assert.equal(bad.counts.observed,1);
  assert.equal(bad.counts.invalidObservations,1);
});

test('self-declared BRAIN review cannot be counted without an actual provider-approved GitHub review', async()=>{
  const review=reviewFor(negative);
  const noToken=await verifyIndependentGithubAttestation(review,negative,{githubToken:''});
  assert.equal(noToken,false);
  const mocked=githubFetch(negative,review);
  assert.equal(await verifyIndependentGithubAttestation(review,negative,{githubToken:'FAKE-LOCAL-TOKEN',fetchImpl:mocked.fetchImpl}),true);
  assert.ok(mocked.urls.some(x=>x.includes('/reviews?')));
  const verdict=await evaluateApprovedCanonicalReviews([negative,review],{now:NOW,githubToken:'FAKE-LOCAL-TOKEN',fetchImpl:mocked.fetchImpl});
  assert.equal(verdict.independentAttestationsVerified,1);
  assert.equal(verdict.metrics.verdict,'INSUFFICIENT_EVIDENCE');
  assert.equal(verdict.metrics.metrics.recall,null);
  assert.equal(verdict.metrics.sample.reviewed,1);
  const wrongHead=githubFetch(negative,review,{reviews:[{user:{login:'independent-reviewer'},state:'APPROVED',commit_id:'0'.repeat(40),submitted_at:'2026-11-06T22:45:00Z'}]});
  assert.equal(await verifyIndependentGithubAttestation(review,negative,{githubToken:'FAKE',fetchImpl:wrongHead.fetchImpl}),false);
  const wrongSource=githubFetch(negative,review,{files:[]});
  assert.equal(await verifyIndependentGithubAttestation(review,negative,{githubToken:'FAKE',fetchImpl:wrongSource.fetchImpl}),false);
  const self=reviewFor(negative,'github:production-release-readback');
  assert.equal(await verifyIndependentGithubAttestation(self,negative,{githubToken:'FAKE',fetchImpl:mocked.fetchImpl}),false);
});

test('untrusted branch and unconfigured or foreign Supabase authority are rejected',()=>{
  const env={GITHUB_ACTIONS:'true',GITHUB_REF:'refs/pull/5515/merge',
    SUPABASE_URL:'https://real.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'fake-test-secret'};
  assert.throws(()=>trustedBrainReadConfig(env),/TRUSTED_MAIN_REQUIRED/);
  assert.throws(()=>trustedBrainReadConfig({...env,GITHUB_REF:'refs/heads/main',SUPABASE_URL:'http://real.supabase.co'}),/AUTH_UNAVAILABLE/);
  const config=trustedBrainReadConfig({...env,GITHUB_REF:'refs/heads/main'});
  assert.equal(config.origin,'https://real.supabase.co');
});

test('the ONLY runtime corpus source is original read-only BRAIN records, with bounded paging',async()=>{
  const calls=[];
  const fetchImpl=async(url,opts)=>{
    calls.push({url,method:opts.method||'GET'});
    const contract=new URL(url).searchParams.get('payload->>contract')?.slice(3);
    const rows=contract==='PLANNED_ACTION_GUARD_OBSERVATION_V1'
      ? [{tenant_id:'canonical',record_id:negative.id,record_type:'Evidence',record_kind:'evidence',
          observed_at:negative.observedAt,status:'OBSERVED',verified:false,source_revision:SHA,payload:negative.payload}]
      : [];
    return {ok:true,json:async()=>rows};
  };
  const config={origin:'https://example.supabase.co',key:'test-secret-only'};
  const rows=await readCanonicalReviewCorpus({config,fetchImpl,days:30,now:NOW});
  assert.equal(rows.length,1);
  assert.equal(rows[0].sourceRevision,SHA);
  assert.equal(calls.length,2);
  assert.ok(calls.every(x=>x.method==='GET'));
  assert.ok(calls.every(x=>x.url.includes('/rest/v1/brain_records?')));
  const output=await runReadOnlyReviewAudit({env:{SUPABASE_URL:config.origin,SUPABASE_SERVICE_ROLE_KEY:config.key},fetchImpl,now:NOW});
  assert.equal(output.publicStatus,'NOT_MEASURED');
  assert.equal(output.counts.pending,1);
  assert.equal(output.independentAttestationsVerified,0);
});
