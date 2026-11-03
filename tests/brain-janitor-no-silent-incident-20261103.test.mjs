import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyCurrentJanitor,writeBrainOccurrence,HISTORY_DEBT_FINGERPRINT,
 EVIDENCE_MISSING_FINGERPRINT,FINGERPRINT} from '../tools/delivery/janitor-incident-agent.mjs';
const sha='7be9196991c4a6a56af923b1b3e7aff8ebfebb6e';
const run=41546047078;
const args={cleanupOutcome:'success',readbackOutcome:'success',runId:run,mainSha:sha};
const debt=[
 {type:'TERMINAL_LEASE_REOPEN_DEFERRED_HISTORY_UNPROVEN',pr_number:3948,reason:'HISTORY_UNPROVEN_DEFER'},
 {type:'TERMINAL_LEASE_REOPEN_DEFERRED_HISTORY_UNPROVEN',pr_number:3963,reason:'PROVIDER_READ_UNAVAILABLE_DEFER'}
];
test('historical hidden deferrals are typed OPEN incidents even with successful original steps',()=>{
 const x=classifyCurrentJanitor({...args,actions:debt,evidenceAvailable:true});
 assert.equal(x.status,'INCIDENT_OPEN_HISTORY_UNPROVEN');
 assert.equal(x.report_required,true);assert.equal(x.reporting_readback_verified,false);
 assert.equal(x.deferred_history.length,2);assert.equal(x.independent_runtime_repair_proven,false);
 assert.equal(x.global_green,false);assert.equal(x.next_action,'FULL_LINEAGE_OWNER_RECONCILIATION');
});
test('missing actions artifact is itself an incident, not empty-success',()=>{
 const x=classifyCurrentJanitor({...args,actions:[],evidenceAvailable:false});
 assert.equal(x.status,'INCIDENT_OPEN_EVIDENCE_MISSING');
 assert.equal(x.report_required,true);assert.equal(x.global_green,false);
 assert.equal(x.evidence_available,false);
});
test('true completed and zero debt remain only a same-run cleanup proof, never global GREEN',()=>{
 const x=classifyCurrentJanitor({...args,actions:[],evidenceAvailable:true});
 assert.equal(x.status,'JANITOR_STEPS_VERIFIED_SAME_RUN');
 assert.equal(x.report_required,false);assert.equal(x.global_green,false);
});
test('actual native cleanup failure overrides open history debt and is still reported',()=>{
 const x=classifyCurrentJanitor({...args,cleanupOutcome:'failure',readbackOutcome:'skipped',
  actions:debt,evidenceAvailable:false});
 assert.equal(x.status,'INCIDENT_OPEN_STEP_FAILURE');
 assert.equal(x.report_required,true);assert.deepEqual(x.failed_steps,['cleanup']);
 assert.equal(x.global_green,false);
});
async function observed(report){
 const calls=[];let posted;
 report.source_url='https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/'+run;
 report.incident_url='https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5320';
 const fetchImpl=async(url,request)=>{
  calls.push({url,method:request.method});
  if(request.method==='POST'){
   posted=JSON.parse(request.body);
   return {ok:true,status:200};
  }
  return {ok:true,status:200,json:async()=>[{
   occurrence_id:posted.p_occurrence_id,
   fingerprint:posted.p_fingerprint,
   payload_sha256:posted.p_payload_sha256
  }]};
 };
 const env={GITHUB_RUN_ATTEMPT:'1',SUPABASE_URL:'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:'fixture-never-sent-to-real-network'};
 return {reply:await writeBrainOccurrence({env,report,fetchImpl}),calls,posted};
}
test('history deferral writes one deduplicated Brain occurrence and reads it back',async()=>{
 const report=classifyCurrentJanitor({...args,actions:debt,evidenceAvailable:true});
 const {reply,calls,posted}=await observed(report);
 assert.equal(reply.fingerprint,HISTORY_DEBT_FINGERPRINT);
 assert.equal(reply.verified,true);
 assert.equal(posted.p_evidence.history_deferred_count,2);
 assert.deepEqual(posted.p_evidence.history_deferred_prs,[3948,3963]);
 assert.equal(posted.p_evidence.status,'INCIDENT_OPEN_HISTORY_UNPROVEN');
 assert.match(posted.p_occurrence_id,/signal:history_unproven$/);
 assert.equal(calls.length,2);
 assert.match(calls[0].url,/\/rpc\/brain_observe_failure$/);
 assert.match(calls[1].url,/\/brain_failure_occurrences\?/);
});
test('missing artifact cannot report a clean native run',async()=>{
 const report=classifyCurrentJanitor({...args,actions:[],evidenceAvailable:false});
 const {reply,posted}=await observed(report);
 assert.equal(reply.fingerprint,EVIDENCE_MISSING_FINGERPRINT);
 assert.equal(reply.verified,true);
 assert.equal(posted.p_evidence.native_artifact_available,false);
 assert.match(posted.p_occurrence_id,/signal:evidence_missing$/);
});
test('real failed step keeps original fingerprint and readback contract',async()=>{
 const report=classifyCurrentJanitor({...args,cleanupOutcome:'failure',readbackOutcome:'skipped',
  actions:[],evidenceAvailable:false});
 const {reply,posted}=await observed(report);
 assert.equal(reply.fingerprint,FINGERPRINT);
 assert.equal(posted.p_evidence.status,'INCIDENT_OPEN_STEP_FAILURE');
 assert.match(posted.p_occurrence_id,/signal:step_failure:cleanup$/);
});
test('Brain write failure is never hidden as success',async()=>{
 const report=classifyCurrentJanitor({...args,actions:debt,evidenceAvailable:true});
 const env={GITHUB_RUN_ATTEMPT:'1',SUPABASE_URL:'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:'fixture-never-sent-to-real-network'};
 await assert.rejects(()=>writeBrainOccurrence({env,report,
   fetchImpl:async()=>({ok:false,status:503})}),/BRAIN_RPC_FAILURE_HTTP_503/);
 const noSecret=await writeBrainOccurrence({env:{},report,
  fetchImpl:async()=>{throw Error('no request authorized');}});
 assert.equal(noSecret.verified,false);
 assert.equal(noSecret.status,'BRAIN_RPC_AUTHORITY_UNAVAILABLE');
});
test('the existing native observer remains always-on with original issue, Brain and artifact readback',()=>{
 const src=readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
 assert.match(src,/name: Agent observation and incident writeback on the same original Janitor\s+if: always\(\)/);
 assert.match(src,/janitor-incident-agent\.mjs --observe/);
 assert.match(src,/janitor-agent-incident\.json/);
 const agent=readFileSync('tools/delivery/janitor-incident-agent.mjs','utf8');
 assert.match(agent,/if\(report\.report_required\)/);
 assert.match(agent,/report\.reporting_readback_verified=brain\.verified===true/);
 assert.match(agent,/BRAIN_INCIDENT_WRITEBACK_UNVERIFIED/);
 assert.doesNotMatch(agent,/state=open/);
});
