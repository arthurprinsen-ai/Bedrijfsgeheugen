import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const publisher=readFileSync(new URL('../supabase/functions/powerhouse-social-publisher/index.ts',import.meta.url),'utf8');

test('independent exact 200/PASS and current hash are mandatory BEFORE a current review status is written',()=>{
 const gate=publisher.indexOf("if (gate.http !== 200 || gate.can_publish !== true || gate.identity_gate_decision !== 'PASS' || gate.final_text_hash !== textHash)");
 const accepted=publisher.indexOf('const gatePassedEvidence={');
 assert.ok(gate>=0&&accepted>gate);
 assert.match(publisher.slice(gate,accepted),/continue;/);
});
test('successful review clears stale current 422, binds current SHA, and retains exact prior 422 as history',()=>{
 assert.match(publisher,/review_status:gate\.http,reviewed_text_hash:textHash,violations:\[\]/);
 assert.match(publisher,/pre_publish_gate:'passed'/);
 assert.match(publisher,/independent_final_review_verified:true/);
 assert.match(publisher,/prior_rejected_review:priorRejectedReview/);
 assert.match(publisher,/SUPERSEDED_BY_EXACT_INDEPENDENT_REVIEW/);
 assert.match(publisher,/earlierReview\.violations\.slice\(0,8\)/);
 assert.match(publisher,/review_transport_error:null/);
});
test('live provider write still consumes same original authority and forbids republish',()=>{
 assert.match(publisher,/await consumePublishCapability\(db,capability,runDate,row\.channel,textHash,mediaSha\)/);
 assert.match(publisher,/provider_create_success===true/);
 assert.match(publisher,/republish_forbidden:true/);
 assert.match(publisher,/provider_publication_ack_verified:true/);
 assert.match(publisher,/PRE_PUBLISH_GATE_BLOCKED/);
 assert.doesNotMatch(publisher,/new ParallelPublisher|MAKE_FALLBACK_SCHEDULER/);
});
