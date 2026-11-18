import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessDailyRunAdmission,classifyHistoricalDailyJobs,evaluateProviderDailyRun}
  from '../tools/delivery/daily-learning-run-admission.mjs';

const now='2026-11-18T07:15:00.000Z';
const workflow={state:'active',path:'.github/workflows/powerhouse-daily-self-evolution.yml'};
const jobNames=['daily-admission','improve','model-freshness',
  'original-intake-recovery','original-delivery-recovery','original-innovation-code-candidate'];
const jobReport=(mode='delivery',overrides={})=>{
  const active=mode==='delivery'?'original-delivery-recovery':
    mode==='intake'?'original-intake-recovery':
    mode==='code'?'original-innovation-code-candidate':null;
  return {total_count:6,jobs:jobNames.map((name,i)=>({
    id:500+i,name,status:'completed',
    conclusion:name==='daily-admission'&&mode==='full'?'success':
      name===active?'success':
      name==='daily-admission'&&mode==='failed-admission'?'failure':'skipped',
    ...overrides[name]}))};
};
const row=(id,created_at,event='workflow_dispatch',status='completed',conclusion='success')=>
  ({id,created_at,event,status,conclusion,head_branch:'main'});
const scoped=row(44256002607,'2026-11-18T07:04:10Z');
const suppressed=row(44256077963,'2026-11-18T07:04:47Z','workflow_dispatch','completed','failure');
const fresh=row(44260000000,'2026-11-18T07:16:00Z','workflow_dispatch','queued',null);
const packet=arr=>({total_count:arr.length,workflow_runs:arr});
const assess=(current,rows,priorJobReports={})=>assessDailyRunAdmission({
  now,runId:current.id,event:current.event,ref:'refs/heads/main',
  workflow,snapshot:packet(rows),priorJobReports});

test('independent native original 18 Nov scoped recovery does not consume full daily admission',()=>{
  const reports={[scoped.id]:jobReport('delivery')};
  assert.equal(classifyHistoricalDailyJobs(reports[scoped.id]),'SCOPED_RECOVERY_NOT_A_DAILY_RUN');
  const result=assess(suppressed,[suppressed,scoped],reports);
  assert.equal(result.status,'FIRST_DAILY_RUN_ADMITTED');
  assert.equal(result.allow_execution,true);
  assert.equal(result.ignored_non_daily_runs,1);
});
test('an original daily run rejected before ANY side effect remains safely retryable',()=>{
  const reports={[scoped.id]:jobReport('delivery'),
    [suppressed.id]:jobReport('failed-admission')};
  assert.equal(classifyHistoricalDailyJobs(reports[suppressed.id]),'UNADMITTED_DAILY_NO_SIDE_EFFECTS');
  const result=assess(fresh,[fresh,suppressed,scoped],reports);
  assert.equal(result.status,'FIRST_DAILY_RUN_ADMITTED');
  assert.equal(result.ignored_non_daily_runs,2);
});
test('all three original scoped recovery routes do not consume daily admission, even if they fail',()=>{
 for(const mode of ['intake','code','delivery']){
   const p=jobReport(mode);
   assert.equal(classifyHistoricalDailyJobs(p),'SCOPED_RECOVERY_NOT_A_DAILY_RUN');
   const selected=mode==='intake'?'original-intake-recovery':
     mode==='code'?'original-innovation-code-candidate':'original-delivery-recovery';
   const failed=jobReport(mode,{[selected]:{conclusion:'failure'}});
   assert.equal(classifyHistoricalDailyJobs(failed),'SCOPED_RECOVERY_NOT_A_DAILY_RUN');
 }
});
test('any admitted real daily run still suppresses later daily execution',()=>{
 const prior=row(44255000000,'2026-11-18T06:00:00Z','workflow_dispatch','completed','failure');
 const report=jobReport('full',{improve:{conclusion:'failure'}});
 assert.equal(classifyHistoricalDailyJobs(report),'GENUINE_DAILY_ATTEMPT');
 const result=assess(fresh,[fresh,prior],{[prior.id]:report});
 assert.equal(result.status,'DUPLICATE_DAILY_RUN_SUPPRESSED');
 assert.equal(result.allow_execution,false);
 assert.equal(result.prior_run_id,prior.id);
});
test('genuine earlier scheduled run always consumes daily admission, independent of manual recovery classification',()=>{
 const schedule=row(44254000000,'2026-11-18T04:48:00Z','schedule','completed','failure');
 const result=assess(fresh,[fresh,scoped,schedule],{[scoped.id]:jobReport('delivery'),
   [schedule.id]:jobReport('delivery')});
 assert.equal(result.allow_execution,false);
 assert.equal(result.prior_run_id,schedule.id);
});
test('missing job evidence never causes false admission; original conservative duplicate fence is preserved',()=>{
 const result=assess(suppressed,[scoped,suppressed]);
 assert.equal(result.allow_execution,false);
 assert.equal(result.status,'DUPLICATE_DAILY_RUN_SUPPRESSED');
});
test('invalid, truncated, fabricated or ambiguous prior job reports fail closed',()=>{
 const valid=jobReport('delivery');
 const invalids=[
  {...valid,total_count:5},
  {...valid,jobs:valid.jobs.slice(0,5),total_count:5},
  {...valid,jobs:valid.jobs.map((j,i)=>i===2?{...j,id:501}:j)},
  {...valid,jobs:valid.jobs.map((j,i)=>i===2?{...j,name:'unknown-job'}:j)},
  jobReport('delivery',{'improve':{conclusion:'success'}}),
  jobReport('delivery',{'daily-admission':{conclusion:'skipped'},
    'original-innovation-code-candidate':{conclusion:'success'}})
 ];
 for(const p of invalids){
  const verdict=assess(suppressed,[scoped,suppressed],{[scoped.id]:p});
  assert.equal(verdict.allow_execution,false,JSON.stringify(p));
  assert.match(verdict.status,/^HOLD_/);
 }
});
test('canonical provider adapter fetches EXACT native job receipt and ignores earlier scoped recovery',()=>{
 const env={GITHUB_REPOSITORY:'arthurprinsen-ai/Bedrijfsgeheugen',
   GITHUB_RUN_ID:String(suppressed.id),GITHUB_EVENT_NAME:'workflow_dispatch',
   GITHUB_REF:'refs/heads/main'};
 const calls=[];
 const out=evaluateProviderDailyRun({env,now,request:uri=>{
   calls.push(uri);
   if(uri.endsWith('/powerhouse-daily-self-evolution.yml'))return workflow;
   if(uri.includes('/runs?'))return packet([suppressed,scoped]);
   if(uri.endsWith('/runs/'+scoped.id+'/jobs?per_page=100'))return jobReport('delivery');
   throw new Error('unexpected request: '+uri);
 }});
 assert.equal(out.allow_execution,true);
 assert.equal(calls.length,3);
 assert.match(calls[2],/actions\/runs\/44256002607\/jobs\?per_page=100/);
});
test('exact original concurrency, jobs and scheduler remain; no independent runner',()=>{
 const yaml=readFileSync('.github/workflows/powerhouse-daily-self-evolution.yml','utf8');
 assert.equal((yaml.match(/^\s+- cron:/gm)||[]).length,1);
 assert.match(yaml,/concurrency:\s*\n\s+group: powerhouse-daily-self-evolution-/);
 assert.equal((yaml.match(/needs: daily-admission/g)||[]).length,2);
 assert.match(yaml,/node tools\/delivery\/daily-learning-run-admission\.mjs/);
 assert.doesNotMatch(yaml,/continue-on-error: true/);
});
