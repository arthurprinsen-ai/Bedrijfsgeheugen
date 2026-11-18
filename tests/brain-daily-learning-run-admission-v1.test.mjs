import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assessDailyRunAdmission,evaluateProviderDailyRun,isProvenScopedRecoveryRun,isProvenPreExecutionAdmissionAbort}
  from '../tools/delivery/daily-learning-run-admission.mjs';

const NOW='2026-10-23T09:34:00.000Z';
const workflow={state:'active',path:'.github/workflows/powerhouse-daily-self-evolution.yml'};
const row=(id,event,created_at,status='completed',conclusion='failure')=>({
  id,event,created_at,status,conclusion,head_branch:'main'
});
const manual=row(39932498219,'workflow_dispatch','2026-10-23T09:31:34Z');
const lateScheduled=row(39932748334,'schedule','2026-10-23T09:33:37Z');
const packet=rs=>({total_count:rs.length,workflow_runs:rs});

const allJobs=Object.freeze([
  'daily-admission','improve','model-freshness',
  'original-intake-recovery','original-innovation-code-candidate','original-delivery-recovery'
]);
const scopedJobs=(active='original-delivery-recovery',result='success')=>({
  total_count:allJobs.length,
  jobs:allJobs.map(name=>({
    name,status:'completed',conclusion:name===active?result:'skipped'
  }))
});

const preExecutionAbortJobs=()=>({
  total_count:allJobs.length,
  jobs:allJobs.map(name=>({
    name,status:'completed',conclusion:name==='daily-admission'?'failure':'skipped'
  }))
});

const fullDailyJobs=()=>({
  total_count:allJobs.length,
  jobs:allJobs.map(name=>({
    name,status:'completed',conclusion:name==='daily-admission'?'success':
      name==='improve'?'failure':'skipped'
  }))
});

const config=(runId,rs,overrides={})=>({
  now:NOW,runId,event:runId===manual.id?'workflow_dispatch':'schedule',
  ref:'refs/heads/main',workflow,snapshot:packet(rs),...overrides
});

test('real 23 October provider trace: manual run first, delayed schedule four hours late blocked',()=>{
  const first=assessDailyRunAdmission(config(manual.id,[manual]));
  assert.equal(first.status,'FIRST_DAILY_RUN_ADMITTED');
  assert.equal(first.allow_execution,true);
  const later=assessDailyRunAdmission(config(lateScheduled.id,[lateScheduled,manual]));
  assert.equal(later.status,'DUPLICATE_DAILY_RUN_SUPPRESSED');
  assert.equal(later.allow_execution,false);
  assert.equal(later.prior_run_id,manual.id);
  assert.equal(later.earlier_conclusion,'failure','earlier failed freshness must not authorize a second learning execution');
});

test('first schedule is allowed, later manual retry is blocked (including failed prior schedule)',()=>{
  const early=row(111,'schedule','2026-10-23T04:50:00Z');
  const later=row(222,'workflow_dispatch','2026-10-23T10:48:00Z','in_progress',null);
  assert.equal(assessDailyRunAdmission(config(111,[early],{event:'schedule'})).allow_execution,true);
  const blocked=assessDailyRunAdmission(config(222,[later,early],{event:'workflow_dispatch'}));
  assert.equal(blocked.status,'DUPLICATE_DAILY_RUN_SUPPRESSED');
  assert.equal(blocked.prior_run_id,111);
});

test('running/queued or completed prior daily run suppresses duplicate',()=>{
  for(const [state,conclusion] of [['queued',null],['in_progress',null],
    ['completed','success'],['completed','failure'],['completed','cancelled']]){
    const first=row(10,'schedule','2026-10-23T04:48:00Z',state,conclusion);
    const current=row(20,'workflow_dispatch','2026-10-23T10:50:00Z','queued',null);
    assert.equal(assessDailyRunAdmission(config(20,[current,first],{event:'workflow_dispatch'})).allow_execution,false);
  }
});

test('unverified provider, invalid run identity, omitted current run or truncated history all fail closed',()=>{
  const cur=lateScheduled;
  const valid=[cur];
  const variants=[
    {workflow:{...workflow,state:'disabled_manually'}},
    {snapshot:packet([])},
    {snapshot:{total_count:101,workflow_runs:valid}},
    {snapshot:{total_count:2,workflow_runs:valid}},
    {snapshot:{total_count:1,workflow_runs:[{...cur,id:'invalid'}]}},
    {now:'not ISO'},
    {ref:'refs/heads/preview'},
    {runId:-1},
    {event:'pull_request'},
    {snapshot:null},
  ];
  for(const override of variants){
    const x=assessDailyRunAdmission(config(cur.id,valid,override));
    assert.equal(x.allow_execution,false,JSON.stringify(override));
  }
});

test('provider-only evaluation reads canonical existing workflow; no invented success',()=>{
  const data=[manual,lateScheduled];let calls=[];
  const env={GITHUB_REPOSITORY:'arthurprinsen-ai/Bedrijfsgeheugen',
    GITHUB_RUN_ID:String(lateScheduled.id),
    GITHUB_EVENT_NAME:'schedule',GITHUB_REF:'refs/heads/main'};
  const x=evaluateProviderDailyRun({env,now:NOW,request:uri=>{
    calls.push(uri);
    if(uri.endsWith('/powerhouse-daily-self-evolution.yml'))return workflow;
    if(uri.includes('/runs?'))return packet(data);
    if(uri.includes('/actions/runs/'+manual.id+'/jobs?'))return fullDailyJobs();
    throw Error('unexpected path');
  }});
  assert.equal(x.status,'DUPLICATE_DAILY_RUN_SUPPRESSED');
  assert.equal(x.allow_execution,false);
  assert.equal(calls.length,3);
  assert.match(calls[1],/created=2026-10-23/);
  assert.match(calls[1],/branch=main/);
  assert.match(calls[2],/actions\/runs\//);
});

test('one existing workflow, two independent jobs, and no duplicate scheduler',()=>{
  const workflowText=fs.readFileSync('.github/workflows/powerhouse-daily-self-evolution.yml','utf8');
  assert.match(workflowText,/group: powerhouse-daily-self-evolution-/);
  assert.match(workflowText,/cancel-in-progress: false/);
  assert.match(workflowText,/^  daily-admission:/m);
  assert.match(workflowText,/^  improve:/m);
  assert.match(workflowText,/^  model-freshness:/m);
  assert.equal((workflowText.match(/^  schedule:/gm)||[]).length,1);
  assert.equal((workflowText.match(/needs: daily-admission/g)||[]).length,2);
  assert.match(workflowText,/node tools\/delivery\/daily-learning-run-admission\.mjs/);
  assert.doesNotMatch(workflowText,/continue-on-error: true/);
});


test('18 November native incident: successful original delivery recovery cannot consume actual daily slot',()=>{
  // Verified native provider run 44256002607 at 07:04:10 UTC:
  // normal daily jobs all SKIPPED, original delivery recovery SUCCESS.
  // Full daily run 44256077963 at 07:04:47 was previously falsely vetoed.
  const recovery=row(44256002607,'workflow_dispatch','2026-11-18T07:04:10Z','completed','success');
  const daily=row(44256077963,'workflow_dispatch','2026-11-18T07:04:47Z','completed','failure');
  const packetNow={...config(daily.id,[daily,recovery],{
    now:'2026-11-18T07:04:55.000Z',event:'workflow_dispatch',
    priorJobsByRunId:{[recovery.id]:scopedJobs()}
  })};
  const verdict=assessDailyRunAdmission(packetNow);
  assert.equal(isProvenScopedRecoveryRun(recovery,scopedJobs()),true);
  assert.equal(verdict.status,'FIRST_DAILY_RUN_ADMITTED');
  assert.equal(verdict.scoped_recoveries_excluded,1);
  assert.equal(verdict.allow_execution,true);
});
test('all three original bounded recovery lanes never replace full daily, even after failure',()=>{
  for(const kind of [
    'original-intake-recovery','original-innovation-code-candidate',
    'original-delivery-recovery'
  ]){
    for(const conclusion of ['success','failure','cancelled','timed_out']){
      const recovery=row(111,'workflow_dispatch','2026-11-18T04:01:00Z','completed',conclusion);
      const daily=row(222,'schedule','2026-11-18T04:50:00Z','queued',null);
      const receipt=scopedJobs(kind,conclusion);
      assert.equal(isProvenScopedRecoveryRun(recovery,receipt),true,kind+':'+conclusion);
      const v=assessDailyRunAdmission(config(222,[daily,recovery],{
        now:'2026-11-18T05:01:00.000Z',
        priorJobsByRunId:{[recovery.id]:receipt}
      }));
      assert.equal(v.allow_execution,true,kind+':'+conclusion);
      assert.equal(v.scoped_recoveries_excluded,1);
    }
  }
});
test('an actual first daily, including a failed earlier attempt, still prevents double daily learning',()=>{
  const previous=row(444,'workflow_dispatch','2026-11-18T06:00:00Z','completed','failure');
  const current=row(555,'schedule','2026-11-18T07:00:00Z');
  const x=assessDailyRunAdmission(config(current.id,[previous,current],{
    now:'2026-11-18T07:00:01.000Z',
    priorJobsByRunId:{[previous.id]:fullDailyJobs()}
  }));
  assert.equal(x.status,'DUPLICATE_DAILY_RUN_SUPPRESSED');
  assert.equal(x.prior_run_id,previous.id);
  assert.equal(x.allow_execution,false);
});
test('unknown, partial, forged, or scheduled job evidence never bypasses once-daily admission',()=>{
  const recovery=row(111,'workflow_dispatch','2026-11-18T04:00:00Z','completed','success');
  const daily=row(222,'schedule','2026-11-18T06:00:00Z','queued',null);
  const truncated={...scopedJobs(),total_count:100};
  const dup={...scopedJobs(),jobs:scopedJobs().jobs.map((j,i)=>i===1?{...j,name:'daily-admission'}:j)};
  const altered={...scopedJobs(),jobs:scopedJobs().jobs.map(j=>j.name==='improve'?{...j,conclusion:'success'}:j)};
  const allSkipped={...scopedJobs(),jobs:scopedJobs().jobs.map(j=>({...j,conclusion:'skipped'}))};
  const missing={...scopedJobs(),jobs:scopedJobs().jobs.slice(1),total_count:5};
  const variants=[null,{},truncated,dup,altered,allSkipped,missing,{...scopedJobs(),jobs:'tampered'}];
  for(const receipt of variants){
    assert.equal(isProvenScopedRecoveryRun(recovery,receipt),false);
    const v=assessDailyRunAdmission(config(daily.id,[daily,recovery],{
      now:'2026-11-18T06:00:01.000Z',
      priorJobsByRunId:{[recovery.id]:receipt}
    }));
    assert.equal(v.status,'DUPLICATE_DAILY_RUN_SUPPRESSED');
  }
  assert.equal(isProvenScopedRecoveryRun({...recovery,event:'schedule'},scopedJobs()),false);
});
test('provider adapter independently reads prior recovery jobs; no input inference from workflow run conclusion',()=>{
  const earlier=row(44256002607,'workflow_dispatch','2026-11-18T07:04:10Z','completed','success');
  const current=row(44256077963,'workflow_dispatch','2026-11-18T07:04:47Z','queued',null);
  const env={GITHUB_REPOSITORY:'arthurprinsen-ai/Bedrijfsgeheugen',
    GITHUB_RUN_ID:String(current.id),
    GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:'refs/heads/main'};
  const calls=[];
  const result=evaluateProviderDailyRun({env,now:'2026-11-18T07:04:55.000Z',request:uri=>{
    calls.push(uri);
    if(uri.endsWith('/powerhouse-daily-self-evolution.yml'))return workflow;
    if(uri.includes('/runs?'))return packet([current,earlier]);
    if(uri.includes('/runs/'+earlier.id+'/jobs?'))return scopedJobs();
    throw Error('unexpected provider URL '+uri);
  }});
  assert.equal(result.allow_execution,true);
  assert.equal(result.scoped_recoveries_excluded,1);
  assert.equal(calls.length,3);
  assert.ok(calls[2].includes('actions/runs/'+earlier.id+'/jobs?'));
});

test('18 Nov: a bounded recovery followed by independently proven zero-effect admission abort permits exactly one real daily retry',()=>{
  const scoped=row(44256002607,'workflow_dispatch','2026-11-18T07:04:10Z','completed','success');
  const aborted=row(44256077963,'workflow_dispatch','2026-11-18T07:04:47Z','completed','failure');
  const retry=row(44260000000,'workflow_dispatch','2026-11-18T07:15:00Z','queued',null);
  assert.equal(isProvenPreExecutionAdmissionAbort(aborted,preExecutionAbortJobs()),true);
  const verdict=assessDailyRunAdmission(config(retry.id,[retry,aborted,scoped],{
    now:'2026-11-18T07:15:10.000Z',event:'workflow_dispatch',
    priorJobsByRunId:{[scoped.id]:scopedJobs(),[aborted.id]:preExecutionAbortJobs()}
  }));
  assert.equal(verdict.allow_execution,true);
  assert.equal(verdict.status,'FIRST_DAILY_RUN_ADMITTED');
  assert.equal(verdict.scoped_recoveries_excluded,1);
  assert.equal(verdict.pre_execution_aborts_verified,1);
});
test('one safe retry maximum, no infinite daily attempts after repeated admission failures',()=>{
  const a=row(100,'workflow_dispatch','2026-11-18T04:01:00Z','completed','failure');
  const b=row(200,'workflow_dispatch','2026-11-18T05:01:00Z','completed','failure');
  const c=row(300,'workflow_dispatch','2026-11-18T06:01:00Z','queued',null);
  const result=assessDailyRunAdmission(config(c.id,[a,b,c],{
    now:'2026-11-18T06:01:10.000Z',event:'workflow_dispatch',
    priorJobsByRunId:{[a.id]:preExecutionAbortJobs(),[b.id]:preExecutionAbortJobs()}
  }));
  assert.equal(result.status,'PRE_EXECUTION_RETRY_BUDGET_EXCEEDED');
  assert.equal(result.allow_execution,false);
  assert.equal(result.pre_execution_aborts_verified,2);
});
test('admission-only abort needs ALL six exact original jobs and no execution before retry',()=>{
 const aborted=row(200,'schedule','2026-11-18T04:47:00Z','completed','failure');
 const genuine=fullDailyJobs();
 const altered={...preExecutionAbortJobs(),jobs:preExecutionAbortJobs().jobs.map(j=>
   j.name==='original-innovation-code-candidate'?{...j,conclusion:'success'}:j)};
 const wrongState={...preExecutionAbortJobs(),jobs:preExecutionAbortJobs().jobs.map(j=>
   j.name==='daily-admission'?{...j,conclusion:'success'}:j)};
 const missing={total_count:6,jobs:preExecutionAbortJobs().jobs.slice(1)};
 for(const evidence of [null,{},genuine,altered,wrongState,missing,
   {...preExecutionAbortJobs(),total_count:7}]){
   assert.equal(isProvenPreExecutionAdmissionAbort(aborted,evidence),false);
 }
 assert.equal(isProvenPreExecutionAdmissionAbort(aborted,preExecutionAbortJobs()),true);
 assert.equal(isProvenPreExecutionAdmissionAbort({...aborted,conclusion:'success'},preExecutionAbortJobs()),false);
});
test('a prior genuine daily remains duplicate even if a separate earlier admission failed with no effects',()=>{
 const aborted=row(111,'workflow_dispatch','2026-11-18T04:05:00Z','completed','failure');
 const real=row(222,'workflow_dispatch','2026-11-18T05:05:00Z','completed','failure');
 const current=row(333,'schedule','2026-11-18T06:05:00Z','queued',null);
 const x=assessDailyRunAdmission(config(current.id,[aborted,real,current],{
   now:'2026-11-18T06:06:00.000Z',
   priorJobsByRunId:{[aborted.id]:preExecutionAbortJobs(),[real.id]:fullDailyJobs()}
 }));
 assert.equal(x.allow_execution,false);
 assert.equal(x.status,'DUPLICATE_DAILY_RUN_SUPPRESSED');
 assert.equal(x.prior_run_id,real.id);
});
test('provider adapter verifies recovery and admission abort independently before real daily retry',()=>{
 const first=row(44256002607,'workflow_dispatch','2026-11-18T07:04:10Z','completed','success');
 const abort=row(44256077963,'workflow_dispatch','2026-11-18T07:04:47Z','completed','failure');
 const retry=row(44260000000,'workflow_dispatch','2026-11-18T07:15:00Z','queued',null);
 const env={GITHUB_REPOSITORY:'arthurprinsen-ai/Bedrijfsgeheugen',
   GITHUB_RUN_ID:String(retry.id),GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:'refs/heads/main'};
 const calls=[];
 const x=evaluateProviderDailyRun({env,now:'2026-11-18T07:15:10.000Z',request:uri=>{
   calls.push(uri);
   if(uri.endsWith('/powerhouse-daily-self-evolution.yml'))return workflow;
   if(uri.includes('/runs?'))return packet([retry,abort,first]);
   if(uri.includes('/runs/'+first.id+'/jobs?'))return scopedJobs();
   if(uri.includes('/runs/'+abort.id+'/jobs?'))return preExecutionAbortJobs();
   throw Error('unexpected provider URL '+uri);
 }});
 assert.equal(x.allow_execution,true);
 assert.equal(x.pre_execution_aborts_verified,1);
 assert.equal(x.scoped_recoveries_excluded,1);
 assert.equal(calls.length,4);
 assert.equal(calls.filter(c=>c.includes('/jobs?')).length,2);
});
