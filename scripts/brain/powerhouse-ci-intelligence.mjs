import { mkdir, writeFile, appendFile, readFile } from 'node:fs/promises';
import { calibrateCi } from '../../tools/delivery/ci-calibration-engine.mjs';
import { auditCiControlPlane } from './powerhouse-ci-control-plane-v2.mjs';

const repo=process.env.GITHUB_REPOSITORY;
const token=process.env.GITHUB_TOKEN;
if(!repo||!token) throw new Error('GITHUB_REPOSITORY and GITHUB_TOKEN are required');

const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10'};
async function api(path){
  const response=await fetch(`https://api.github.com/repos/${repo}${path}`,{headers});
  if(!response.ok) throw new Error(`GitHub API ${response.status} for ${path}: ${await response.text()}`);
  return response.json();
}
const ts=value=>value?Date.parse(value):null;
const seconds=(a,b)=>a&&b?Math.max(0,Math.round((b-a)/1000)):null;
const numeric=(rows,key)=>rows.map(row=>row[key]).filter(Number.isFinite);
const avg=values=>values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):0;
const percentile=(values,p=0.95)=>{
  if(!values.length) return 0;
  const sorted=[...values].sort((a,b)=>a-b);
  return sorted[Math.min(sorted.length-1,Math.max(0,Math.ceil(sorted.length*p)-1))];
};

const controlPolicy=JSON.parse(await readFile('config/powerhouse-ci-control-plane-v2.json','utf8'));
const architecture=await auditCiControlPlane();
const now=Date.now();
const since=now-(7*24*60*60*1000);
const runsPayload=await api('/actions/runs?per_page=100');
const runs=(runsPayload.workflow_runs||[]).filter(run=>ts(run.created_at)>=since);
const sample=runs.slice(0,60);

const jobRows=[];
const runRows=[];
for(const run of sample){
  const payload=await api(`/actions/runs/${run.id}/jobs?per_page=100`);
  const jobs=payload.jobs||[];
  const created=ts(run.created_at);
  const firstStarted=jobs.map(job=>ts(job.started_at)).filter(Number.isFinite).sort((a,b)=>a-b)[0]||null;
  const completed=ts(run.updated_at);
  const row={
    run_id:run.id,
    workflow:run.name,
    event:run.event,
    status:run.status,
    conclusion:run.conclusion,
    head_sha:run.head_sha,
    head_branch:run.head_branch,
    start_delay_seconds:seconds(created,firstStarted),
    total_seconds:run.status==='completed'?seconds(created,completed):null,
  };
  runRows.push(row);
  for(const job of jobs){
    const started=ts(job.started_at);
    const finished=ts(job.completed_at);
    jobRows.push({
      run_id:run.id,
      workflow:run.name,
      event:run.event,
      conclusion:job.conclusion,
      job:job.name,
      execution_seconds:seconds(started,finished),
    });
  }
}

const executions=numeric(jobRows,'execution_seconds');
const requiredFast=runRows.filter(row=>row.workflow==='Required test'&&row.event==='pull_request');
const requiredStart=numeric(requiredFast,'start_delay_seconds');
const requiredTotal=numeric(requiredFast,'total_seconds');
const failed=jobRows.filter(row=>row.conclusion==='failure').length;
const cancelled=jobRows.filter(row=>row.conclusion==='cancelled').length;
const skipped=jobRows.filter(row=>row.conclusion==='skipped').length;
const wastedCancelledSeconds=jobRows.filter(row=>row.conclusion==='cancelled').reduce((sum,row)=>sum+Number(row.execution_seconds||0),0);

const allFanout=new Map();
const prFanout=new Map();
for(const run of runs){
  if(run.head_sha) allFanout.set(run.head_sha,(allFanout.get(run.head_sha)||0)+1);
  if(run.event==='pull_request'&&run.head_sha) prFanout.set(run.head_sha,(prFanout.get(run.head_sha)||0)+1);
}
const allFanoutValues=[...allFanout.values()];
const prFanoutValues=[...prFanout.values()];
const pendingRuns=runs.filter(run=>run.status==='pending').length;
const queuedRuns=runs.filter(run=>run.status==='queued').length;

const metrics={
  required_fast_start_delay_seconds_avg:avg(requiredStart),
  required_fast_start_delay_seconds_p95:percentile(requiredStart),
  required_fast_total_seconds_avg:avg(requiredTotal),
  required_fast_total_seconds_p95:percentile(requiredTotal),
  queue_wait_seconds_avg:avg(requiredStart),
  queue_wait_seconds_p95:percentile(requiredStart),
  execution_seconds_avg:avg(executions),
  execution_seconds_p95:percentile(executions),
  failed_jobs:failed,
  cancelled_jobs:cancelled,
  skipped_jobs:skipped,
  wasted_cancelled_execution_seconds:wastedCancelledSeconds,
  pending_runs:pendingRuns,
  queued_runs:queuedRuns,
  workflow_fanout_per_sha_avg:avg(allFanoutValues),
  workflow_fanout_per_sha_p95:percentile(allFanoutValues),
  pr_workflow_fanout_per_sha_avg:avg(prFanoutValues),
  pr_workflow_fanout_per_sha_p95:percentile(prFanoutValues),
};

const slo={
  fast_queue_p95_ok:metrics.required_fast_start_delay_seconds_p95<=Number(controlPolicy.slo.fast_gate_queue_p95_seconds),
  fast_total_p95_ok:metrics.required_fast_total_seconds_p95<=Number(controlPolicy.slo.fast_gate_total_p95_seconds),
  pr_fanout_p95_ok:metrics.pr_workflow_fanout_per_sha_p95<=Number(controlPolicy.slo.workflow_fanout_per_pr_head_p95),
  architecture_ok:architecture.ok,
};
slo.green=Object.values(slo).every(Boolean);

const baseReport={
  version:'powerhouse-ci-intelligence-v2',
  observed_at:new Date().toISOString(),
  window_days:7,
  sampled_runs:sample.length,
  sampled_jobs:jobRows.length,
  metrics,
  slo,
  architecture,
  optimization_policy:{
    stale_same_pr_runs_cancelled:true,
    required_gate_is_canonical:true,
    pr_fastlane_isolated:true,
    full_assurance_on_merge_group:true,
    external_provider_polling_outside_pr_fastlane:true,
    exact_sha_identity:true,
  },
  runs:runRows,
  jobs:jobRows,
};

const calibrationPolicy=JSON.parse(await readFile('config/powerhouse-ci-calibration-v1.json','utf8'));
const calibration=calibrateCi({report:baseReport,policy:calibrationPolicy});
const report={...baseReport,calibration};

await mkdir('artifacts/ci-intelligence',{recursive:true});
await writeFile('artifacts/ci-intelligence/latest.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({metrics:report.metrics,slo:report.slo},null,2));

if(process.env.GITHUB_STEP_SUMMARY){
  const m=report.metrics;
  await appendFile(process.env.GITHUB_STEP_SUMMARY,
`## Powerhouse CI Intelligence v2

- Required start delay avg / p95: **${m.required_fast_start_delay_seconds_avg}s / ${m.required_fast_start_delay_seconds_p95}s**
- Required fast total avg / p95: **${m.required_fast_total_seconds_avg}s / ${m.required_fast_total_seconds_p95}s**
- PR workflow fan-out avg / p95: **${m.pr_workflow_fanout_per_sha_avg} / ${m.pr_workflow_fanout_per_sha_p95}**
- Pending / queued workflow runs: **${m.pending_runs} / ${m.queued_runs}**
- Wasted cancelled runtime: **${m.wasted_cancelled_execution_seconds}s**
- SLO green: **${report.slo.green}**
- Architecture invariant: **${report.architecture.ok}**
- Calibration recommendations: **${report.calibration.recommendations.length}** (mode: ${report.calibration.mode})
`);
}
