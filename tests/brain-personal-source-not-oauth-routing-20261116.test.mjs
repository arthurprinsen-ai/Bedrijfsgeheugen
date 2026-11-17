import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assessDailyPublicationRecovery,
  assessPreventivePublicationReadiness
} from '../supabase/functions/_shared/daily-publication-recovery.mjs';
import {planOwnerActionEscalations} from '../supabase/functions/_shared/owner-action-escalation.mjs';

const runDate='2026-11-16';
const now='2026-11-16T09:22:00Z';
const personalOb={channel:'linkedin_personal',status:'PLANNED',external_id:null,last_error:null};
function personalDecision(reason){
 return {
   channel:'linkedin_personal',state:'blocked',scheduled_for:'2026-11-16T08:00:00Z',
   delivery_evidence:{capability_state:'BLOCKED_HARD_BOUNDARY',
     capability_reason:reason,decision_source:'capability-truth',personal_truth_verified:false}
 };
}
function assess(reason,ob=personalOb){
 const decision=personalDecision(reason);
 return {
   decision,
   result:assessDailyPublicationRecovery({
     runDate,now,obligations:[ob],decisions:[decision],isTerminal:()=>false
   })
 };
}
test('today missing user-authored personal truth is SOURCE, not LinkedIn OAuth',()=>{
 const {decision,result}=assess('PERSONAL_TRUTH_SOURCE_UNVERIFIED');
 const personal=result.overdue.find(x=>x.channel==='linkedin_personal');
 assert.ok(personal);
 assert.equal(personal.code,'PERSONAL_SOURCE_PROOF_REQUIRED');
 assert.equal(personal.repairHandoff,'VERIFY_ORIGINAL_FOUNDER_SOURCE_THEN_REGENERATE');
 assert.equal(personal.requiresAuthorization,true);
 assert.match(personal.action,/Arthur/);
 assert.doesNotMatch(personal.action,/Op(en|nieuw).*OAuth/i);
 const escalations=planOwnerActionEscalations({
   runDate,now,recovery:result,decisions:[decision],obligations:[personalOb]
 });
 const action=escalations.owner_action_due.find(x=>x.channel==='linkedin_personal');
 assert.ok(action);
 assert.equal(action.code,'PERSONAL_SOURCE_PROOF_REQUIRED');
 assert.equal(action.action_url,null);
 assert.match(action.human_action,/concrete eigen gebeurtenis/);
 assert.match(action.human_action,/Niet opnieuw OAuth aanvragen/);
 assert.equal(action.notification_sent,false);
});
test('all missing verified first-person source variants retain original editor owner',()=>{
 for(const reason of ['PERSONAL_SOURCE_UNVERIFIED','PERSONAL_TRUTH_SOURCE_UNVERIFIED',
                      'NO_UNIQUE_VERIFIED_PERSONAL_SOURCE','PERSONAL_USER_EXPERIENCE_NOT_VERIFIED']){
   const {result}=assess(reason);
   const item=result.overdue.find(x=>x.channel==='linkedin_personal');
   assert.equal(item.code,'PERSONAL_SOURCE_PROOF_REQUIRED',reason);
   assert.match(item.owner,/powerhouse-content-orchestrator/);
 }
});
test('genuine provider boundary remains a separate OAuth capability reason',()=>{
 const {result}=assess('REVOKED_ACCESS_TOKEN');
 assert.equal(result.overdue.find(x=>x.channel==='linkedin_personal').code,
   'CHANNEL_CAPABILITY_PROOF_REQUIRED');
});
test('preventive preflight identifies a personal source failure before deadline',()=>{
 const out=assessPreventivePublicationReadiness({
   runDate,now:'2026-11-16T07:35:00Z',obligations:[personalOb],
   decisions:[personalDecision('PERSONAL_TRUTH_SOURCE_UNVERIFIED')],isTerminal:()=>false
 });
 const item=out.atRisk.find(x=>x.channel==='linkedin_personal');
 assert.equal(item.code,'SOURCE_EDITORIAL_REVISION_REQUIRED');
 assert.equal(item.nextStep,'ORIGINAL_PERSONAL_SOURCE_OWNER_VERIFY_USER_FACT');
});
test('already provider-created personal post is readback-only, never a fresh create',()=>{
 const out=assessPreventivePublicationReadiness({
   runDate,now,obligations:[{...personalOb,status:'PUBLISHED',external_id:'urn:li:share:123'}],
   decisions:[personalDecision('PERSONAL_TRUTH_SOURCE_UNVERIFIED')],isTerminal:()=>false
 });
 assert.equal(out.atRisk.find(x=>x.channel==='linkedin_personal').code,
   'INDEPENDENT_PROVIDER_READBACK_REQUIRED');
});
test('company duplicate remains a fresh story repair without weakening global dedupe',()=>{
 const out=assessDailyPublicationRecovery({
   runDate,now,obligations:[{channel:'linkedin_company',status:'BLOCKED',last_error:'PRE_PUBLISH_GATE_BLOCKED'}],
   decisions:[{channel:'linkedin_company',state:'blocked',scheduled_for:'2026-11-16T08:00:00Z',
     delivery_evidence:{error:'GLOBAL_POST_DUPLICATE_BLOCKED:STORY_FAMILY_DUPLICATE'}}],
   isTerminal:()=>false
 });
 assert.equal(out.overdue.find(x=>x.channel==='linkedin_company').code,
   'DISTINCT_VERIFIED_STORY_REQUIRED');
});
