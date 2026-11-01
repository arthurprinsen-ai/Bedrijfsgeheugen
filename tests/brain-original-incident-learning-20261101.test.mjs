import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assessDailyPublicationRecovery} from '../supabase/functions/_shared/daily-publication-recovery.mjs';
import {planOriginalIncidentLearning} from '../supabase/functions/_shared/publication-incident-learning.mjs';

const runDate='2026-11-01';
const scheduled_for='2026-11-01T07:00:00Z';
const owner='original-powerhouse-content-orchestrator';
const original={channel:'linkedin_company',status:'BLOCKED',external_id:null,last_error:'PRE_PUBLISH_GATE_BLOCKED'};
const recentBilling={classification:'PROVIDER_BILLING',last_failed_at:'2026-11-01T09:39:00Z'};
function assessment(channel,status,last_error,evidence,obligationStatus='BLOCKED'){
 const decision={channel,decision:'publish',state:status,scheduled_for,delivery_evidence:evidence};
 const ob={channel:channel==='instagram_company'?'instagram':channel,status:obligationStatus,external_id:null,last_error};
 return assessDailyPublicationRecovery({runDate,now:'2026-11-01T12:00:00Z',
  decisions:[decision],obligations:[ob],isTerminal:()=>false});
}
test('current company editorial repeat wins over historical provider quota',()=>{
 const recovery=assessment('linkedin_company','blocked','PRE_PUBLISH_GATE_BLOCKED',
   {artifact_generation_failure:recentBilling,violations:[{code:'COMPANY_RECENT_OPERATIONAL_FRICTION_REPEAT'}]});
 const c=recovery.overdue.find(x=>x.channel==='linkedin_company');
 assert.equal(c.code,'DISTINCT_VERIFIED_STORY_REQUIRED');
 assert.equal(c.requiresAuthorization,false);
});
test('current personal story collision wins over historical provider quota',()=>{
 const recovery=assessment('linkedin_personal','blocked','GLOBAL_POST_DUPLICATE_BLOCKED:STORY_FAMILY_DUPLICATE',
   {artifact_generation_failure:recentBilling,error:'GLOBAL_POST_DUPLICATE_BLOCKED:STORY_FAMILY_DUPLICATE'});
 assert.equal(recovery.overdue.find(x=>x.channel==='linkedin_personal').code,'DISTINCT_VERIFIED_STORY_REQUIRED');
});
test('historical provider quota is not an active billing blocker after content_ready',()=>{
 const recovery=assessment('blog','content_ready',null,{artifact_generation_failure:recentBilling},'GENERATED');
 assert.equal(recovery.overdue.find(x=>x.channel==='blog').code,'BLOG_APPROVAL_RELEASE_READBACK_REQUIRED');
});
test('actual pending provider billing remains typed when no copy was generated',()=>{
 const recovery=assessment('linkedin_company','decided',null,{artifact_generation_failure:recentBilling},'PLANNED');
 assert.equal(recovery.overdue.find(x=>x.channel==='linkedin_company').code,'CONTENT_GENERATION_BILLING_ACTION_REQUIRED');
});
test('original learning planner maps typed overdue errors to durable, safe, reproducible Brain observations',()=>{
 const recovery=assessment('linkedin_personal','blocked','GLOBAL_POST_DUPLICATE_BLOCKED:STORY_FAMILY_DUPLICATE',{error:'GLOBAL_POST_DUPLICATE_BLOCKED:STORY_FAMILY_DUPLICATE'});
 const a=planOriginalIncidentLearning(recovery,runDate),b=planOriginalIncidentLearning(recovery,runDate);
 assert.equal(a.ok,true);
 assert.deepEqual(a,b);
 assert.equal(a.observations.find(o=>o.channel==='linkedin_personal').evidence.proof_state,'NOT_PROVEN');
 assert.match(a.observations.find(o=>o.channel==='linkedin_personal').occurrenceId,/2026-11-01/);
 assert.doesNotMatch(JSON.stringify(a),/DO_NOT_EXPOSE_SECRET/);
 assert.ok(a.observations.every(o=>o.evidence.required_outputs.includes('automated_regression_proof')));
});
test('no new learning writer/scheduler, and no GREEN on missing proof',()=>{
 const plan=planOriginalIncidentLearning({contract:'wrong',status:'RECOVERY_DUE',overdue:[]},runDate);
 assert.equal(plan.ok,false);
 const s=await readFile(new URL('../supabase/functions/powerhouse-content-loop/index.ts',import.meta.url),'utf8');
 assert.match(s,/planOriginalIncidentLearning\(recovery,runDate\)/);
 assert.match(s,/brain_observe_failure/);
 assert.match(s,/incidentLearning/);
 assert.doesNotMatch(s,/new ParallelPublisher|MAKE_FALLBACK_SCHEDULER/);
});
