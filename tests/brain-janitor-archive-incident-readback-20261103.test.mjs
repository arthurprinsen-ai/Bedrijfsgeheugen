import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 classifyNativeArchive,writeBrainOccurrence,
 ARCHIVE_PROVIDER_FINGERPRINT,ARCHIVE_EVIDENCE_FINGERPRINT,ARCHIVE_STEP_FINGERPRINT
} from '../tools/delivery/janitor-incident-agent.mjs';

const runId=41595648620,mainSha='019016ddc50bcbfe354001a704ad1e9159c1e4c6';
const valid={
 schema:'janitor-branch-archive-sweep-v2',status:'COMPLETE',applied:true,
 source_run_id:String(runId),source_sha:mainSha,
 counts:{seen:747,skipped:747,deleted:0,archived:0,drift:0,failed:0}
};
const classify=(sweepOutcome='success',artifact=valid)=>classifyNativeArchive({
 sweepOutcome,artifact,runId,mainSha
});

test('successful original job plus complete evidence is only scoped readback',()=>{
 const r=classify();
 assert.equal(r.status,'JANITOR_ARCHIVE_STEPS_VERIFIED_SAME_RUN');
 assert.equal(r.report_required,false);assert.equal(r.global_green,false);
 assert.equal(r.safe_to_delete_unarchived_unique_branch,false);
});
test('three native archive HTTP403 errors remain typed incidents even if GitHub step says success',()=>{
 const artifact={...valid,status:'PARTIAL_FAILURE',
  counts:{...valid.counts,seen:747,skipped:744,failed:3}};
 const r=classify('success',artifact);
 assert.equal(r.status,'INCIDENT_OPEN_ARCHIVE_PROVIDER_FAILURE');
 assert.equal(r.report_required,true);assert.equal(r.archive_counts.failed,3);
 assert.equal(r.global_green,false);
});
test('missing, malformed, wrong run and stale SHA artifacts never silently become success',()=>{
 for(const invalid of [null,{...valid,counts:null},{...valid,source_run_id:'1'},
  {...valid,source_sha:'0'.repeat(40)},{...valid,applied:false},
  {...valid,counts:{...valid.counts,failed:-1}},
  {...valid,counts:{...valid.counts,failed:'not-number'}}]){
  const r=classify('success',invalid);
  assert.equal(r.status,'INCIDENT_OPEN_ARCHIVE_EVIDENCE_MISSING');
  assert.equal(r.report_required,true);assert.equal(r.evidence_available,false);
 }
});
test('original archive job failure with clean provider counts is separately reported',()=>{
 const r=classify('failure');
 assert.equal(r.status,'INCIDENT_OPEN_ARCHIVE_STEP_FAILURE');
 assert.equal(r.report_required,true);
 assert.deepEqual(r.failed_steps,['archive']);
});
const record=async report=>{
 const env={GITHUB_RUN_ATTEMPT:'1',SUPABASE_URL:'https://fixture.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:'only-a-local-test-secret'};
 report.source_url='https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/'+runId;
 report.incident_url='https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5333';
 let posted=null;const calls=[];
 const fetchImpl=async(url,opts)=>{
  calls.push({url,method:opts.method});
  if(opts.method==='POST'){posted=JSON.parse(opts.body);return {ok:true,status:200};}
  return {ok:true,status:200,json:async()=>[{
   occurrence_id:posted.p_occurrence_id,fingerprint:posted.p_fingerprint,
   payload_sha256:posted.p_payload_sha256
  }]};
 };
 return {value:await writeBrainOccurrence({env,report,fetchImpl}),posted,calls};
};
test('provider error writes original semantic fingerprint and independent occurrence readback',async()=>{
 const artifact={...valid,status:'PARTIAL_FAILURE',counts:{...valid.counts,failed:3}};
 const {value,posted,calls}=await record(classify('failure',artifact));
 assert.equal(value.verified,true);
 assert.equal(value.fingerprint,ARCHIVE_PROVIDER_FINGERPRINT);
 assert.equal(posted.p_evidence.archive_counts.failed,3);
 assert.equal(posted.p_evidence.archive_status,'PARTIAL_FAILURE');
 assert.match(posted.p_occurrence_id,/janitor-archive:run:41595648620:attempt:1:signal:archive_provider_failure/);
 assert.equal(calls.length,2);
 assert.match(calls[0].url,/\/rpc\/brain_observe_failure$/);
 assert.match(calls[1].url,/\/brain_failure_occurrences\?/);
});
test('missing archive evidence uses independent fingerprint, not a false provider 403',async()=>{
 const {value,posted}=await record(classify('success',null));
 assert.equal(value.fingerprint,ARCHIVE_EVIDENCE_FINGERPRINT);
 assert.equal(posted.p_evidence.native_artifact_available,false);
 assert.equal(posted.p_evidence.archive_counts,null);
});
test('step-only failure uses distinct fingerprint',async()=>{
 const {value}=await record(classify('failure'));
 assert.equal(value.fingerprint,ARCHIVE_STEP_FINGERPRINT);
});
test('failed Brain persistence/readback and absent secrets are never marked success',async()=>{
 const report=classify('success',{...valid,status:'PARTIAL_FAILURE',counts:{...valid.counts,failed:3}});
 const env={GITHUB_RUN_ATTEMPT:'1',SUPABASE_URL:'https://fixture.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:'fixture'};
 await assert.rejects(()=>writeBrainOccurrence({env,report,
  fetchImpl:async()=>({ok:false,status:503})}),/BRAIN_RPC_FAILURE_HTTP_503/);
 const missing=await writeBrainOccurrence({env:{},report});
 assert.equal(missing.verified,false);
 assert.equal(missing.status,'BRAIN_RPC_AUTHORITY_UNAVAILABLE');
});
test('original archive step is always observed before artifact upload and cannot mask errors',()=>{
 const workflow=readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
 const job=workflow.split('  branch_archive_sweep:\n')[1];
 assert.ok(job);
 assert.match(job,/name: Remove stale branches whose work stays recoverable\s+id: janitor_archive_sweep/);
 assert.match(job,/name: Record archive failure in original incident and ONE BRAIN\s+if: always\(\)/);
 assert.match(job,/JANITOR_ARCHIVE_SWEEP_OUTCOME:.*steps\.janitor_archive_sweep\.outcome/);
 assert.match(job,/janitor-incident-agent\.mjs --observe-archive/);
 assert.match(job,/janitor-archive-observer\.json/);
 assert.match(job,/if-no-files-found: error/);
 assert.doesNotMatch(job,/\|\|.*echo.*JANITOR_ARCHIVE_SWEEP_INCOMPLETE/);
 const source=readFileSync('tools/delivery/janitor-incident-agent.mjs','utf8');
 assert.match(source,/runIdOk\(written\.id\)/,'GitHub comment IDs may exceed one billion');
 assert.match(source,/ARCHIVE_ISSUE_READBACK_MISMATCH/);
 assert.match(source,/ARCHIVE_BRAIN_INCIDENT_WRITEBACK_UNVERIFIED/);
 assert.doesNotMatch(source,/\-f state=open/);
});
