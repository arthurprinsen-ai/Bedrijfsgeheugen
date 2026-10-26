import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const runner=readFileSync('supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts','utf8');
const publisher=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
test('one existing Heartbeat independently evaluates all four commercial channels without adding a scheduler',()=>{
  for(const channel of ['email','linkedin_dm','linkedin_comment','linkedin_like']){
    assert.match(runner,new RegExp('lane:"'+channel+'"'));
  }
  assert.match(runner,/Promise\.allSettled\(outboundLanes\.map\(def=>runOneOutboundLane\(def\)\)\)/);
  assert.match(runner,/outbound_lanes:outboundLanesResult/);
  assert.match(runner,/const outboundLanesResult=await runOutboundLanes\(\);[\s\S]*const result=await runHeartbeat\(\)/);
  assert.doesNotMatch(runner,/cron\.schedule|setInterval\(|Buffer\.publish|MAKE_WEBHOOK/i);
});
test('existing authorized provider senders retained with hour-bucket idempotency and no direct sends',()=>{
  for(const fn of ['powerhouse_dispatch_autonomous_outreach_v1','powerhouse_dispatch_linkedin_sales_machine_v1','powerhouse_dispatch_linkedin_comment_autopilot_v1']){
    assert.ok(runner.includes('executor:"'+fn+'"'),fn);
  }
  assert.match(runner,/commercial-channel-dispatch:/);
  assert.match(runner,/on conflict \(dedupe_key\) do nothing returning event_id/);
  assert.match(runner,/evidence->>'human_approved'='true'/);
  assert.match(runner,/quality_passed.*='true'/);
  assert.match(runner,/QUEUED_NOT_DELIVERED/);
  assert.match(runner,/PROVIDER_RESULT_PENDING_READBACK/);
  assert.match(runner,/provider_side_effect_verified:false/);
  assert.doesNotMatch(runner,/GMAIL_SEND_EMAIL|SALESROBOT_SEND_MESSAGE|LINKEDIN_CREATE_COMMENT_ON_POST/);
});
test('likes cannot fabricate a send when authenticated provider has read-only reactions API',()=>{
  assert.match(runner,/lane:"linkedin_like",executor:null/);
  assert.match(runner,/PROVIDER_WRITE_NOT_AVAILABLE/);
  assert.doesNotMatch(runner,/LINKEDIN_CREATE_REACTION/);
});
test('LinkedIn comments use structured API with canonical identity, exact target URN and non-retry ambiguous failures',()=>{
  assert.match(publisher,/const \{apiKey,accountId,userId,personId\}=await composioLinkedInContext\(db\)/);
  assert.match(publisher,/LINKEDIN_GET_POST_CONTENT',\{post_id:sourceUrn\}/);
  assert.match(publisher,/target_urn:sourceUrn,object:sourceUrn,actor:'urn:li:person:'\+personId/);
  assert.match(publisher,/message:\{text:message\}/);
  assert.match(publisher,/VERIFIED_POST_URN_AND_QUALITY_GATE_REQUIRED/);
  assert.match(publisher,/reconciliation_required:true/);
  assert.doesNotMatch(publisher,/Create this exact LinkedIn comment on the post at/);
});
