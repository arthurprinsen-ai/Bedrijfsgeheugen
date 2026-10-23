// Read-only OpenTelemetry CI/CD semantic-convention projection in the EXISTING
// hourly Powerhouse Janitor. This is not a telemetry SDK, span exporter, job
// scheduler, critical-path measurement, or authorization to alter CI/release.
// CI/CD semconv: https://opentelemetry.io/docs/specs/semconv/cicd/cicd-spans/
const HEAD=/^[0-9a-f]{40}$/i;
const REPO=/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i;
const RESULTS=Object.freeze({
 success:'success',failure:'failure',timed_out:'timeout',cancelled:'cancellation'
});
const MAX_TASK_PROOFS=64;

function taskProof(repo,record){
 const run=record?.run,job=record?.job;
 if(!run||!job||run.status!=='completed'||job.status!=='completed'||
  !Number.isSafeInteger(run.id)||run.id<=0||
  !Number.isSafeInteger(run.run_attempt)||run.run_attempt<1||
  !Number.isSafeInteger(job.id)||job.id<=0||
  !HEAD.test(run.head_sha||'')||
  !Object.hasOwn(RESULTS,job.conclusion)||
  typeof job.name!=='string'||!job.name.trim()||job.name.length>100||
  /[<>\r\n]/.test(job.name))return null;
 // Match the original summarizeObservedCiJobs temporal contract exactly:
 // no phantom wait/negative elapsed jobs or unbounded clock glitches.
 const created=Date.parse(job.created_at||'');
 const start=Date.parse(job.started_at||''),end=Date.parse(job.completed_at||'');
 const wait=start-created,elapsed=end-start;
 if(!Number.isFinite(wait)||!Number.isFinite(elapsed)||
    wait<0||elapsed<0||wait>172800000||elapsed>172800000)return null;
 const url='https://github.com/'+repo+'/actions/runs/'+run.id+'/job/'+job.id;
 return Object.freeze({
  // Source-only projection: not a collected OpenTelemetry span or exported trace.
  source:'GITHUB_COMPLETED_JOB_TIMESTAMPS',
  attributes:Object.freeze({
   'cicd.pipeline.task.name':job.name.trim(),
   'cicd.pipeline.task.run.id':String(job.id),
   'cicd.pipeline.task.run.result':RESULTS[job.conclusion],
   'cicd.pipeline.task.run.url.full':url,
   'vcs.repository.ref.revision':run.head_sha.toLowerCase(),
   // Stable low-cardinality classification; never copy raw runner output.
   ...(job.conclusion==='failure'?{'error.type':'ci_task_failed'}:
      job.conclusion==='timed_out'?{'error.type':'timeout'}:{})
  }),
  run_id:run.id,run_attempt:run.run_attempt,job_id:job.id,
  started_at:new Date(start).toISOString(),
  completed_at:new Date(end).toISOString(),
  observed_execution_ms:end-start
 });
}

export function projectObservedCicdTaskRuns({repo='',observations=[],status='',readErrors=[]}={}){
 const blocked=(state)=>Object.freeze({
  schema:'powerhouse-ci-cicd-semconv-projection-v1',status:state,
  exported:false,critical_path_proven:false,release_authorized:false,
  provider_snapshot_complete:false,records:Object.freeze([])
 });
 if(!REPO.test(repo)||repo.includes('..'))return blocked('INVALID_REPOSITORY');
 if(status!=='SAMPLED_METRICS_NOT_SLO'||!Array.isArray(readErrors)||
  readErrors.length>0)return blocked('INCOMPLETE_OR_INSUFFICIENT_SOURCE');
 if(!Array.isArray(observations)||observations.length<20||
  observations.length>MAX_TASK_PROOFS*4)return blocked('INCOMPLETE_OR_INSUFFICIENT_SOURCE');
 const records=[],unique=new Set(),runAttempts=new Set();
 for(const entry of observations){
  const proof=taskProof(repo,entry);
  if(!proof)continue;
  const identity=proof.run_id+':'+proof.run_attempt+':'+proof.job_id;
  if(unique.has(identity))continue;
  unique.add(identity);
  runAttempts.add(proof.run_id+':'+proof.run_attempt);
  records.push(proof);
  if(records.length>=MAX_TASK_PROOFS)break;
 }
 // Mirror evidence minimum for percentile sampling; no unsupported causal lift.
 if(records.length<20||runAttempts.size<5)return blocked('INCOMPLETE_OR_INSUFFICIENT_SOURCE');
 return Object.freeze({
  schema:'powerhouse-ci-cicd-semconv-projection-v1',
  status:'SOURCE_ONLY_FIELD_COMPATIBLE',
  exported:false,critical_path_proven:false,release_authorized:false,
  provider_snapshot_complete:true,distinct_run_attempts:runAttempts.size,
  sampled_tasks:records.length,records:Object.freeze(records)
 });
}
