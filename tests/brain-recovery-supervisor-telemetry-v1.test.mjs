import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifyCasReadback,parseSupervisorAnnotations,
  summarizeSupervisorEvidence,collectSupervisorEvidence}
  from '../tools/delivery/recovery-supervisor-telemetry.mjs';

const SHA='a'.repeat(40);
const SHA2='b'.repeat(40);
const T=Date.parse('2026-10-23T13:00:00Z');
const iso=n=>new Date(T+n).toISOString();
const run=id=>({id,run_attempt:1,event:id%2?'schedule':'workflow_dispatch',
  head_sha:SHA,status:'completed',conclusion:'success',created_at:iso(-id*10000)});
const job=id=>({id:id+1000,name:'supervise',status:'completed',
  started_at:iso(-2000),completed_at:iso(-1000)});
const annotation=(code,pr)=>iso(0)+' ##[warning]'+code+':PR#'+pr+'; observed';

test('GitHub HTTP 422 alone never proves a changed SHA or a specific cause',()=>{
  assert.equal(classifyCasReadback({httpStatus:422,expectedHead:SHA,observedHead:SHA}),
    'HTTP_422_CAUSE_UNVERIFIED');
  assert.equal(classifyCasReadback({httpStatus:422,expectedHead:SHA,observedHead:SHA2}),
    'HTTP_422_AND_HEAD_CHANGED_CAUSALITY_UNVERIFIED');
  assert.equal(classifyCasReadback({httpStatus:403}),'HTTP_403_PERMISSION_OR_POLICY');
  assert.equal(classifyCasReadback({httpStatus:503}),'PROVIDER_5XX_UNAVAILABLE');
});
test('only executed annotations count, not echo commands or copied workflow text',()=>{
  const raw=['echo "::warning::MAIN_DRIFT_REFRESH_BUDGET_EXHAUSTED:PR#100"',
    annotation('MAIN_DRIFT_REFRESH_BUDGET_EXHAUSTED',100),
    annotation('MAIN_DRIFT_REFRESH_BUDGET_EXHAUSTED',100),
    iso(0)+' ##[warning]PR#101 could not be refreshed automatically; restoring terminal lease fail-closed.',
    iso(0)+' ##[notice]PR#102 refreshed on same leased lineage old -> new at main base; verified'
  ].join('\n');
  const rows=parseSupervisorAnnotations(raw,44);
  assert.equal(rows.length,3);
  assert.deepEqual(rows.map(r=>r.pr_number),[100,101,102]);
  assert.equal(rows[1].category,'CAS_OR_PROVIDER_REJECTION_UNVERIFIED');
});
test('repeated drift requires distinct real supervisor runs, not repeated notes',()=>{
  const rows=[...parseSupervisorAnnotations(annotation('MAIN_DRIFT_REFRESH_BUDGET_EXHAUSTED',66),1),
    ...parseSupervisorAnnotations(annotation('MAIN_DRIFT_SYNC_PENDING',66),2),
    ...parseSupervisorAnnotations(annotation('MAIN_DRIFT_REFRESH_BUDGET_EXHAUSTED',67),1)];
  const result=summarizeSupervisorEvidence({runs:[],events:rows,readErrors:[],observedAt:iso(0)});
  assert.deepEqual(result.repeated_drift_prs,[66]);
  assert.equal(result.per_pr.find(x=>x.pr_number===66).drift_observed_in_distinct_runs,2);
  assert.equal(result.release_cycle_speedup_proven,false);
  assert.equal(result.time_to_production_ms,null);
});
test('a missing provider log suppresses performance claims, not fabricating zero events',()=>{
  const runs=Array.from({length:6},(_,i)=>run(i+1));
  let fetched=0;
  const result=collectSupervisorEvidence({repo:'owner/repo',now:T,readApi:path=>{
    fetched++;
    if(path.includes('/workflows/'))return {total_count:6,workflow_runs:runs};
    const id=Number(path.match(/runs\/(\d+)\/jobs/)[1]);
    return {total_count:1,jobs:[job(id)]};
  },readLog:()=>{throw Error('GitHub 403');}});
  assert.equal(fetched,2);
  assert.equal(result.status,'PARTIAL_PROVIDER_OBSERVATION');
  assert.equal(result.p95_supervisor_job_duration_ms,null);
  assert.deepEqual(result.repeated_drift_prs,[]);
  assert.equal(result.read_errors.length,1);
});
test('six bounded runs are read; schedule and manual executions stay separate',()=>{
  const rows=Array.from({length:8},(_,i)=>run(i+1));
  let calls=0,logCalls=0;
  const result=collectSupervisorEvidence({repo:'owner/repo',now:T,readApi:path=>{
    calls++;
    if(path.includes('/workflows/'))return {total_count:8,workflow_runs:rows};
    const id=Number(path.match(/runs\/(\d+)\/jobs/)[1]);
    return {total_count:1,jobs:[job(id)]};
  },readLog:()=>{logCalls++;return annotation('MAIN_DRIFT_SYNC_PENDING',100);}});
  assert.equal(calls,7);
  assert.equal(logCalls,6);
  assert.equal(result.sampled_completed_runs,6);
  assert.equal(result.sampled_schedule_runs,3);
  assert.equal(result.sampled_manual_runs,3);
  assert.equal(result.p95_supervisor_job_duration_ms,1000);
  assert.equal(result.release_cycle_speedup_proven,false);
  assert.equal(result.can_mutate,false);
});
test('single existing Janitor owns observation and never starts a second scheduler',()=>{
  const yaml=fs.readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
  assert.match(yaml,/cron: '17 \* \* \* \*'/);
  assert.match(yaml,/node tools\/delivery\/recovery-supervisor-telemetry\.mjs/);
  assert.match(yaml,/powerhouse-supervisor-execution-evidence\.json/);
  assert.doesNotMatch(yaml,/recovery-supervisor-telemetry.*workflow_dispatch/);
  const supervisor=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.match(supervisor,/expected_head_sha="\$head"/);
  assert.match(supervisor,/MAX_MAIN_DRIFT_REFRESHES: '2'/);
  assert.match(supervisor,/RECOVERY_PR_BUDGET: '1'/);
});

test('actual supervisor missing-terminal-lease warnings become deduped, typed per-run evidence',()=>{
  const message='PR#4778 has no exact active terminal writer lease; automatic refresh forbidden.';
  const real=iso(0)+' ##[warning]'+message;
  const rows=parseSupervisorAnnotations([real,real,
    iso(0)+' ##[notice]'+message].join('\n'),39960974891);
  assert.equal(rows.length,1);
  assert.equal(rows[0].pr_number,4778);
  assert.equal(rows[0].code,'WRITER_TERMINAL_LEASE_MISSING');
  assert.equal(rows[0].category,'MISSING_EXACT_TERMINAL_WRITER_LEASE');
  const summary=summarizeSupervisorEvidence({runs:[],events:[
    ...rows,...parseSupervisorAnnotations(real,39960974900)
  ],readErrors:[],observedAt:iso(0)});
  const pr=summary.per_pr.find(x=>x.pr_number===4778);
  assert.equal(pr.missing_terminal_lease_runs,2);
  assert.equal(pr.repeated_missing_terminal_lease,true);
  assert.equal(pr.accepted_or_reconciled_runs,0);
  assert.equal(summary.release_cycle_speedup_proven,false);
  assert.equal(summary.can_mutate,false);
});

test('no annotation spoofing or untrusted empty lease can be counted as owner release',()=>{
  const text='PR#4772 has no exact active terminal writer lease; automatic refresh forbidden.';
  const examples=[
    'echo "::warning::'+text+'"',
    'not-a-time ##[warning]'+text,
    iso(0)+' \\u001b[36;1mecho "::warning::'+text+'"',
    iso(0)+' ##[warning]PR#0 has no exact active terminal writer lease; automatic refresh forbidden.',
    iso(0)+' ##[warning]PR#4772 has no exact active terminal writer lease; automatic refresh forbidden. extra'
  ];
  assert.deepEqual(parseSupervisorAnnotations(examples.join('\n'),99),[]);
  const valid=parseSupervisorAnnotations(iso(0)+' ##[warning]'+text,99);
  assert.equal(valid.length,1);
  assert.equal(valid[0].category,'MISSING_EXACT_TERMINAL_WRITER_LEASE');
});
