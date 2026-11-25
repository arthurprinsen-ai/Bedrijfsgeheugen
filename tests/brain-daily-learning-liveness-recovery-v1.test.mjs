import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assessDailyLearningLiveness,recoverDailyLearning}
  from '../tools/delivery/daily-learning-liveness-recovery.mjs';

const DAY='2026-10-23';
const NOW=DAY+'T09:20:00.000Z';
const WF={name:'Powerhouse Daily Self Evolution',
  path:'.github/workflows/powerhouse-daily-self-evolution.yml',state:'active'};
const empty={total_count:0,workflow_runs:[]};
function run({id=100,event='schedule',status='completed',conclusion='success',
  created_at=DAY+'T04:48:00Z',head_branch='main'}={}){
  return {id,event,status,conclusion,created_at,head_branch,head_sha:'a'.repeat(40)};
}
const rec=(opts={})=>assessDailyLearningLiveness({now:NOW,workflow:WF,snapshot:empty,...opts});

test('after a missed real daily schedule, plan exactly one bounded recovery candidate',()=>{
  const x=rec();
  assert.equal(x.status,'MISSED_SCHEDULE_VERIFIED');
  assert.equal(x.dispatch_allowed,true);
  assert.equal(x.terminal_execution_proven,false);
  assert.equal(x.scheduled_time_utc,'04:47');
  assert.equal(x.grace_until_utc,'06:47');
});

test('within two-hour grace, never replace or race the original scheduler',()=>{
  assert.equal(rec({now:DAY+'T06:46:59.000Z'}).status,'BEFORE_GRACE_WINDOW');
  assert.equal(rec({now:DAY+'T06:46:59.000Z'}).dispatch_allowed,false);
  assert.equal(rec({now:DAY+'T23:00:00.000Z'}).status,'WINDOW_EXPIRED_MANUAL_REVIEW');
});

test('today scheduled, dispatch, failed or in-progress run forbids another dispatch',()=>{
  for(const event of ['schedule','workflow_dispatch'])
    for(const [status,conclusion] of [['queued',null],['in_progress',null],['completed','failure'],['completed','success']]){
      const x=rec({snapshot:{total_count:1,workflow_runs:[run({event,status,conclusion})]}});
      assert.equal(x.status,'ALREADY_TRIGGERED_TODAY');
      assert.equal(x.dispatch_allowed,false);
      assert.equal(x.existing_run.id,100);
      assert.equal(x.terminal_execution_proven,status==='completed'&&conclusion==='success');
    }
});

test('malformed, truncated, disabled or off-branch provider evidence never dispatches',()=>{
  assert.equal(rec({snapshot:{total_count:101,workflow_runs:Array.from({length:100},(_,i)=>run({id:i+1,created_at:'2026-10-22T04:48:00Z'}))}}).status,
    'PROVIDER_HISTORY_INCOMPLETE');
  assert.equal(rec({workflow:{...WF,state:'disabled_manually'}}).dispatch_allowed,false);
  assert.equal(rec({snapshot:{total_count:1,workflow_runs:[{...run(),id:'bad'}]}}).status,
    'PROVIDER_OBSERVATION_INVALID');
  assert.equal(rec({now:'invalid'}).dispatch_allowed,false);
  assert.equal(rec({snapshot:null}).dispatch_allowed,false);
  assert.equal(rec({snapshot:{total_count:1,workflow_runs:[]}}).dispatch_allowed,false);
});

test('existing hourly janitor may request only the SAME daily workflow once after double read',async()=>{
  let reads=0,dispatches=0;
  const result=await recoverDailyLearning({
    repo:'example/repo',ref:'refs/heads/main',event:'schedule',now:NOW,
    read:(_repo,suffix)=>{
      reads++;
      if(suffix==='')return WF;
      assert.match(suffix,/\/runs\?created=2026-10-23&per_page=100/);
      return empty;
    },
    send:_repo=>{dispatches++;return {workflow_run_id:9001};}
  });
  assert.equal(reads,3);
  assert.equal(dispatches,1);
  assert.equal(result.status,'RECOVERY_DISPATCH_ACCEPTED_NOT_EXECUTION_PROOF');
  assert.equal(result.dispatch_requested,true);
  assert.equal(result.execution_verified,false);
  assert.equal(result.workflow_run_id,9001);
  assert.equal(result.provider_reads,3);
});

test('late scheduled or external agent run wins recheck and suppresses duplicate dispatch',async()=>{
  let n=0,dispatches=0;
  const result=await recoverDailyLearning({
    repo:'example/repo',ref:'refs/heads/main',event:'schedule',now:NOW,
    read:(_repo,suffix)=>suffix===''?WF:(++n===1?empty:{total_count:1,workflow_runs:[run({event:'workflow_dispatch',status:'in_progress',conclusion:null})]}),
    send:()=>{dispatches++;return {};}
  });
  assert.equal(n,2);
  assert.equal(dispatches,0);
  assert.equal(result.status,'RECOVERY_SUPPRESSED_AFTER_RECHECK');
  assert.equal(result.previous_status,'ALREADY_TRIGGERED_TODAY');
  assert.equal(result.execution_verified,false);
});

test('read-only mode, PR refs and ghost-only mode must not touch the provider',async()=>{
  for(const opts of [
    {event:'pull_request',ref:'refs/heads/main',mode:'apply-safe'},
    {event:'workflow_dispatch',ref:'refs/heads/main',mode:'dry-run'},
    {event:'workflow_dispatch',ref:'refs/heads/main',mode:'provider-ghost-only'},
    {event:'schedule',ref:'refs/heads/not-main',mode:'apply-safe'},
  ]){
    let reads=0;
    const result=await recoverDailyLearning({repo:'example/repo',now:NOW,...opts,
      read:()=>{reads++;throw Error('must not be called');}});
    assert.equal(result.status,'NON_OWNER_OR_READ_ONLY_MODE');
    assert.equal(result.dispatch_requested,false);
    assert.equal(reads,0);
  }
});

test('failed provider read does not fall through into dispatch',async()=>{
  let dispatches=0;
  await assert.rejects(recoverDailyLearning({
    repo:'example/repo',ref:'refs/heads/main',event:'schedule',now:NOW,
    read:()=>{throw Error('simulated GitHub 503');},
    send:()=>{dispatches++;return {};}
  }),/simulated GitHub 503/);
  assert.equal(dispatches,0);
});

test('reuse existing hourly Janitor and existing daily workflow without new cron or scopes',()=>{
  const janitor=fs.readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
  const daily=fs.readFileSync('.github/workflows/powerhouse-daily-self-evolution.yml','utf8');
  assert.match(janitor,/cron: '17 \* \* \* \*'/);
  assert.match(janitor,/node tools\/delivery\/daily-learning-liveness-recovery\.mjs/);
  assert.match(janitor,/\.artifacts\/powerhouse-daily-learning-liveness\.json/);
  assert.match(janitor,/actions: write/);
  assert.equal((janitor.match(/^  schedule:/gm)||[]).length,1);
  assert.match(daily,/cron: '47 4 \* \* \*'/);
  assert.match(daily,/workflow_dispatch:/);
  assert.match(daily,/^  improve:\s*$/m);
  assert.match(daily,/^  model-freshness:\s*$/m);
  assert.doesNotMatch(janitor,/\b(new_scheduler|second_scheduler)\b/);
});
