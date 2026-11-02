// Advisory CI evidence for existing Powerhouse collector; source of PR
// ordering is tools/delivery/recovery-pr-prioritizer.mjs on main.
// No second supervisor, no production mutation and no Required/CodeQL waiver.
const SHA=/^[0-9a-f]{40}$/;
const active=new Set(['queued','pending','waiting','requested','in_progress']);
const stamp=v=>{const n=Date.parse(v??'');return Number.isFinite(n)?n:null};
const valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
export function inspectRepeatExecutions(runs=[]){
 const ids=new Set(),groups=new Map();
 for(const r of runs){
  const id=Number(r?.id),workflow=Number(r?.workflow_id),head=r?.head_sha;
  if(!Number.isSafeInteger(id)||id<=0||ids.has(id)||!Number.isSafeInteger(workflow)||workflow<=0||
    !SHA.test(head??'')||stamp(r?.created_at)===null||r?.event!=='pull_request')continue;
  ids.add(id);const key=workflow+':'+head;const row=groups.get(key)??[];row.push(r);groups.set(key,row);
 }
 const repeat_groups=[...groups].filter(([,rows])=>rows.length>1).map(([key,rows])=>({
  workflow_id:Number(key.split(':')[0]),exact_head_sha:key.split(':')[1],
  observed_distinct_runs:rows.length,repeat_executions_lower_bound:rows.length-1,
  run_ids:rows.map(r=>r.id),active_run_ids:rows.filter(r=>active.has(r.status)).map(r=>r.id),
  verdict:'REPEATED_SAME_HEAD_OBSERVED_NOT_PROVEN_WASTE',
  suppression:'ONLY_EXISTING_EXACT_HEAD_ACTIVE_SINGLE_FLIGHT',
  required_or_security_gate_may_be_skipped:false
 })).sort((a,b)=>b.repeat_executions_lower_bound-a.repeat_executions_lower_bound||a.workflow_id-b.workflow_id);
 return {classification:'diagnostic_only',evidence:'bounded_actions_run_snapshot',runs_scanned:runs.length,repeat_groups,
  total_repeat_executions_lower_bound:repeat_groups.reduce((n,r)=>n+r.repeat_executions_lower_bound,0),
  can_waive_required_or_codeql:false};
}
export function locateMeasuredDelay(jobs=[],{minimumPairedJobs=10}={}){
 const paired=jobs.filter(j=>valid(j?.queue_seconds)&&valid(j?.execution_seconds));
 if(paired.length<minimumPairedJobs)return {status:'INSUFFICIENT_PAIRED_JOB_EVIDENCE',paired_jobs:paired.length,total_job_rows:jobs.length,bottleneck:null,queue_seconds:null,execution_seconds:null};
 const queue=paired.reduce((n,j)=>n+j.queue_seconds,0),execution=paired.reduce((n,j)=>n+j.execution_seconds,0);
 return {status:'MEASURED_IN_BOUNDED_SAMPLE',paired_jobs:paired.length,total_job_rows:jobs.length,
  bottleneck:queue>execution?'RUNNER_QUEUE_WAIT':execution>queue?'JOB_EXECUTION':'TIED',
  queue_seconds:queue,execution_seconds:execution,attribution:'observational_only_no_causal_claim',missing_rows_not_zero:true};
}
export function assessTechniqueEvidence({baseline,candidate,evaluation,rollout}={}){
 const blockers=[];
 if(!baseline||!candidate||!evaluation||!rollout)blockers.push('INCOMPLETE_EVIDENCE');
 for(const [name,item] of [['baseline',baseline],['candidate',candidate]]){
  if(!item||!Number.isSafeInteger(item.samples)||item.samples<30||!valid(item.failure_rate)||item.failure_rate>1||
    !valid(item.latency_p95_ms)||!item.evidence_ref||!item.dataset_id)blockers.push(name.toUpperCase()+'_UNPROVEN');
 }
 if(!evaluation?.independent||!evaluation.evidence_ref||!evaluation.regressions_passed||!evaluation.security_passed||
    !evaluation.comparator_matched||!baseline?.dataset_id||baseline.dataset_id!==candidate?.dataset_id||
    !evaluation.evaluator||!candidate?.producer||evaluation.evaluator===candidate.producer)blockers.push('INDEPENDENT_MATCHED_EVALUATION_UNPROVEN');
 if(valid(baseline?.latency_p95_ms)&&valid(candidate?.latency_p95_ms)&&candidate.latency_p95_ms>baseline.latency_p95_ms*1.05)blockers.push('LATENCY_REGRESSION');
 if(valid(baseline?.failure_rate)&&valid(candidate?.failure_rate)&&candidate.failure_rate>baseline.failure_rate)blockers.push('FAILURE_RATE_REGRESSION');
 if(!rollout?.shadow_proven||!rollout?.canary_proven||!rollout?.rollback_tested||!rollout?.provider_readback||!rollout?.controlled_exposure_proven)blockers.push('CONTROLLED_ROLLOUT_UNPROVEN');
 const unique=[...new Set(blockers)];
 return {status:unique.length?'QUALITY_STEPS_HOLD':'ELIGIBLE_FOR_EXISTING_PROTECTED_RELEASE_GATES',
  blockers:unique,production_behavior_change_allowed:false,independently_verified_production_success:false,
  authority:'EXISTING_SEVEN_STAGE_AI_POLICY_AND_PROTECTED_DELIVERY'};
}
