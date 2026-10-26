// Provider job steps are already included in the existing bounded Janitor job GET.
// This is diagnostic only: never another Actions request, scheduler, release gate,
// causal critical-path claim or permission to change agent ownership.
const EXECUTED=new Set(['success','failure','timed_out']);
const SHA=/^[a-f\d]{40}$/i;
const SAFE_NAME=/^[^<>\x00-\x1f\x7f]{1,100}$/;
const keyOf=(run,job)=>run+':'+job;

export function summarizeObservedCiStepPhases(observations=[],verifiedJobs=[],{
  minJobs=20,minRuns=5,minRepeatedAttempts=3,maxPhases=5
}={}){
  const base={
    schema:'powerhouse-observed-ci-step-phase-v1',
    status:'INSUFFICIENT_VERIFIED_JOBS',
    source:'GITHUB_COMPLETED_JOB_STEP_TIMESTAMPS',
    critical_path_proven:false,causal_speedup_proven:false,
    may_dispatch:false,may_mutate:false,may_promote:false,
    minimum_independent_attempts:3,
    accepted_step_observations:0,rejected_step_observations:0,
    recurrent_phases:[]
  };
  if(!Array.isArray(observations)||!Array.isArray(verifiedJobs)||
     !Number.isSafeInteger(minJobs)||minJobs<20||
     !Number.isSafeInteger(minRuns)||minRuns<5||
     !Number.isSafeInteger(minRepeatedAttempts)||minRepeatedAttempts<3||
     !Number.isSafeInteger(maxPhases)||maxPhases<1||maxPhases>5)return base;
  const verified=new Map(),independent=new Set();
  for(const job of verifiedJobs){
    const identity=job?.run_id+':'+job?.run_attempt+':'+job?.job_id;
    if(!Number.isSafeInteger(job?.run_id)||job.run_id<1||
       !Number.isSafeInteger(job?.run_attempt)||job.run_attempt<1||
       !Number.isSafeInteger(job?.job_id)||job.job_id<1||
       !SHA.test(job?.head_sha||'')||
       !EXECUTED.has(job?.conclusion)||
       !Number.isFinite(job?.execution_ms)||job.execution_ms<0||
       !Number.isFinite(job?.wait_to_start_ms)||job.wait_to_start_ms<0||
       verified.has(identity))return {...base,status:'INCONSISTENT_CANONICAL_JOB_EVIDENCE'};
    verified.set(identity,job);
    independent.add(keyOf(job.run_id,job.run_attempt));
  }
  if(verified.size<minJobs||independent.size<minRuns)return base;

  const groups=new Map(),seen=new Set();
  let accepted=0,rejected=0;
  for(const item of observations){
    const run=item?.run||{},job=item?.job||{};
    const proof=verified.get(run.id+':'+run.run_attempt+':'+job.id);
    if(!proof||proof.head_sha.toLowerCase()!==String(run.head_sha||'').toLowerCase()||
       proof.conclusion!==job.conclusion||!Array.isArray(job.steps))continue;
    const jobStart=Date.parse(job.started_at||''),jobEnd=Date.parse(job.completed_at||'');
    if(!Number.isFinite(jobStart)||!Number.isFinite(jobEnd)||jobEnd<jobStart||
       jobEnd-jobStart!==proof.execution_ms)continue;
    // A bounded subset of the provider's job-step array avoids unbounded memory.
    if(job.steps.length>150){rejected+=job.steps.length;continue;}
    for(const step of job.steps){
      if(step?.status!=='completed'||!EXECUTED.has(step?.conclusion))continue;
      const number=step.number;
      const name=step.name;
      const start=Date.parse(step.started_at||''),end=Date.parse(step.completed_at||'');
      const stepId=run.id+':'+run.run_attempt+':'+job.id+':'+number;
      if(!Number.isSafeInteger(number)||number<1||
         typeof name!=='string'||!SAFE_NAME.test(name)||!name.trim()||
         !Number.isFinite(start)||!Number.isFinite(end)||
         start<jobStart||end>jobEnd||end<=start||
         seen.has(stepId)){
        rejected++;continue;
      }
      seen.add(stepId);
      accepted++;
      if(!Number.isSafeInteger(proof.workflow_id)||proof.workflow_id<1||
         !SAFE_NAME.test(proof.job_name||'')||
         proof.job_name==='unnamed_job')continue;
      const family=JSON.stringify([proof.workflow_id,proof.job_name,name]);
      if(!groups.has(family))groups.set(family,{
        workflow_id:proof.workflow_id,job_name:proof.job_name,step_name:name,attempts:new Map()
      });
      const group=groups.get(family),attempt=keyOf(run.id,run.run_attempt);
      const duration=end-start;
      const evidence={run_id:run.id,run_attempt:run.run_attempt,
        job_id:job.id,step_number:number,head_sha:proof.head_sha,
        execution_ms:duration};
      const previous=group.attempts.get(attempt);
      if(!previous||duration>previous.execution_ms)group.attempts.set(attempt,evidence);
    }
  }
  const phases=[...groups.values()].filter(group=>group.attempts.size>=minRepeatedAttempts)
    .map(group=>{
      const rows=[...group.attempts.values()];
      const sorted=rows.map(x=>x.execution_ms).sort((a,b)=>a-b);
      const p50=sorted[Math.max(0,Math.ceil(sorted.length*0.5)-1)];
      const exemplar=[...rows].sort((a,b)=>b.execution_ms-a.execution_ms||
        a.run_id-b.run_id||a.job_id-b.job_id||a.step_number-b.step_number)[0];
      return Object.freeze({
        workflow_id:group.workflow_id,job_name:group.job_name,step_name:group.step_name,
        distinct_attempts:rows.length,
        sample_p50_execution_ms:p50,sample_max_execution_ms:sorted[sorted.length-1],
        exemplar,
        evidence_basis:'REPEATED_INDEPENDENT_GITHUB_RUN_ATTEMPTS',
        recommendation:'INSPECT_STEP_ON_CANONICAL_OWNER_LEASE_BEFORE_COMPARABLE_COLD_WARM_REPLAY'
      });
    }).sort((a,b)=>b.sample_p50_execution_ms-a.sample_p50_execution_ms||
      b.distinct_attempts-a.distinct_attempts||
      a.workflow_id-b.workflow_id||a.job_name.localeCompare(b.job_name)||
      a.step_name.localeCompare(b.step_name)).slice(0,maxPhases);
  return {
    ...base,
    status:phases.length?'REPEATED_STEP_SAMPLES_NOT_SLO':'INSUFFICIENT_REPEATED_STEP_EVIDENCE',
    minimum_independent_attempts:minRepeatedAttempts,
    accepted_step_observations:accepted,
    rejected_step_observations:rejected,
    recurrent_phases:phases
  };
}
