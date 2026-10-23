import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 parseSupervisorRunLog,summarizeSupervisorObservations,collectSupervisorDriftObservation,MAX_OBSERVED_RUNS
} from '../tools/delivery/recovery-supervisor-telemetry.mjs';

const line=(message)=>'2026-10-23T13:27:00.0000000Z '+message;
const runtime=[
 line('PR#4594 '+ 'a'.repeat(40)+' MAIN_DRIFT_RECOVERY'),
 line('##[warning]PR#4594 has no exact active terminal writer lease; automatic refresh forbidden.'),
 line('PR#4774 '+ 'b'.repeat(40)+' MAIN_DRIFT_RECOVERY'),
 line('##[notice]RECOVERY_PR_BUDGET_USED:1/1'),
 line('##[notice]MAIN_DRIFT_SYNC_RECONCILED:PR#4774; new exact-head Required and CodeQL still mandatory.')
].join('\n');

test('evidence parser counts only runtime-tagged supervisor events and separates drift from completed repair',()=>{
 const p=parseSupervisorRunLog(runtime);
 assert.equal(p.counts.drift,2);
 assert.equal(p.counts.lease_missing,1);
 assert.equal(p.counts.sync_reconciled,1);
 assert.equal(p.counts.budget_used,1);
 assert.deepEqual(p.drift_pr_numbers,[4594,4774]);
 assert.deepEqual(p.lease_missing_pr_numbers,[4594]);
 assert.equal(p.stale_head_422_count,null);
 assert.equal(p.actual_branch_mutation_proven,false);
});

test('workflow source echoes and ANSI commands cannot inflate real main-drift counts',()=>{
 const fake='2026-10-23T13:25:00.0000000Z \u001b[36;1mecho "PR#4594 aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa MAIN_DRIFT_RECOVERY"\u001b[0m';
 const p=parseSupervisorRunLog(fake+'\n'+runtime);
 assert.equal(p.counts.drift,2);
 assert.throws(()=>parseSupervisorRunLog('no runtime timestamp'),/SUPERVISOR_LOG_HAS_NO_PROVIDER_TIMESTAMPED_LINES/);
});

test('same PR across two independently identified runs counts once as repeated drift',()=>{
 const sample=(id,prs)=>({run_id:id,drift_pr_numbers:prs});
 const result=summarizeSupervisorObservations([sample(1,[4594,4774]),sample(2,[4594,4781])]);
 assert.equal(result.status,'OBSERVED_BOUNDED_SAMPLE');
 assert.deepEqual(result.repeated_drift_pr_numbers,[4594]);
 assert.equal(result.repeated_drift_pr_count,1);
 assert.equal(result.mutates_branches,false);
 const missing=summarizeSupervisorObservations([sample(1,[4594])],[{reason:'log_missing'}]);
 assert.equal(missing.status,'PARTIAL_PROVIDER_EVIDENCE');
 assert.equal(missing.repeated_drift_pr_count,null);
});

test('bounded provider reads never turn an unavailable job log into zero drift or green',async()=>{
 const calls=[];
 const json={
   workflow_runs:[
    {id:10,status:'completed',created_at:'2026-10-23T13:24:00Z',head_sha:'a'.repeat(40),event:'workflow_dispatch',conclusion:'success'},
    {id:9,status:'completed',created_at:'2026-10-23T12:20:00Z',head_sha:'b'.repeat(40),event:'schedule',conclusion:'success'},
    {id:8,status:'completed',created_at:'2026-10-23T11:20:00Z',head_sha:'c'.repeat(40),event:'schedule',conclusion:'success'}]
 };
 const readJson=(endpoint)=>{
   calls.push(endpoint);
   if(endpoint.includes('/runs?'))return json;
   if(endpoint.includes('/runs/10/jobs?'))return {total_count:1,jobs:[{id:100,name:'supervise',status:'completed',conclusion:'success'}]};
   if(endpoint.includes('/runs/9/jobs?'))return {total_count:1,jobs:[{id:90,name:'supervise',status:'completed',conclusion:'success'}]};
   throw Error('unexpected call');
 };
 const result=await collectSupervisorDriftObservation({
   repo:'example/repo',now:Date.parse('2026-10-23T14:00:00Z'),readJson,
   readText:(endpoint)=>{calls.push(endpoint);if(endpoint.includes('/100/'))return runtime;throw Error('provider log unavailable');}
 });
 assert.equal(MAX_OBSERVED_RUNS,2);
 assert.equal(result.status,'PARTIAL_PROVIDER_EVIDENCE');
 assert.equal(result.runs_checked,1);
 assert.equal(result.repeated_drift_pr_count,null);
 assert.equal(calls.length,5);
 assert.ok(calls.every(endpoint=>!endpoint.includes('/pulls/')&&!endpoint.includes('dispatch')));
});

test('hourly existing Janitor owns the single read-only evidence step and uploads it',()=>{
 const y=fs.readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
 const supervisor=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
 assert.match(y,/node tools\/delivery\/recovery-supervisor-telemetry\.mjs/);
 assert.match(y,/\.artifacts\/powerhouse-supervisor-drift-observation\.json/);
 assert.match(supervisor,/expected_head_sha="\$head"/);
 assert.match(supervisor,/RECOVERY_PR_BUDGET: '1'/);
 assert.match(supervisor,/MAX_MAIN_DRIFT_REFRESHES: '2'/);
 assert.doesNotMatch(y,/cron: '.*'[\s\S]*cron: '.*'[\s\S]*recovery-supervisor-telemetry/);
});
