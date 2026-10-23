import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assessDailyRunAdmission,evaluateProviderDailyRun}
  from '../tools/delivery/daily-learning-run-admission.mjs';

const NOW='2026-10-23T09:34:00.000Z';
const workflow={state:'active',path:'.github/workflows/powerhouse-daily-self-evolution.yml'};
const row=(id,event,created_at,status='completed',conclusion='failure')=>({
  id,event,created_at,status,conclusion,head_branch:'main'
});
const manual=row(39932498219,'workflow_dispatch','2026-10-23T09:31:34Z');
const lateScheduled=row(39932748334,'schedule','2026-10-23T09:33:37Z');
const packet=rs=>({total_count:rs.length,workflow_runs:rs});
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
    throw Error('unexpected path');
  }});
  assert.equal(x.status,'DUPLICATE_DAILY_RUN_SUPPRESSED');
  assert.equal(x.allow_execution,false);
  assert.equal(calls.length,2);
  assert.match(calls[1],/created=2026-10-23/);
  assert.match(calls[1],/branch=main/);
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
