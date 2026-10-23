// Daily, evidence-only evaluation for the EXISTING Recovery Supervisor and Repository Janitor.
// No scheduler, branch write, CI dispatch, deployment or automated model promotion.
const SHA=/^[0-9a-f]{40}$/i;
const ms=value=>{const n=Date.parse(value||'');return Number.isFinite(n)?n:null;};
const percentile=(values,p)=>{
  const sorted=[...values].sort((a,b)=>a-b);
  return sorted.length?sorted[Math.ceil(sorted.length*p)-1]:null;
};
function verifiedRelease(row){
  if(!row||!Number.isSafeInteger(row.pr_number)||row.pr_number<1)return false;
  if(!['head_sha','required_sha','codeql_sha','merge_sha','production_sha'].every(k=>SHA.test(row[k]||'')))return false;
  if(row.head_sha!==row.required_sha||row.head_sha!==row.codeql_sha||
     row.merge_sha!==row.production_sha)return false;
  if(row.required_conclusion!=='success'||row.codeql_conclusion!=='success'||
     row.production_provider_verified!==true||row.regression_passed!==true)return false;
  if(!['github_actions_required','github_codeql','protected_github_merge','production_provider'].every(
    k=>row.evidence_sources?.[k]===true))return false;
  const start=ms(row.pr_opened_at),end=ms(row.production_verified_at);
  if(start===null||end===null||end<start)return false;
  if(!Number.isSafeInteger(row.ci_attempts)||row.ci_attempts<1)return false;
  return true;
}
function releaseStats(rows){
  if(!Array.isArray(rows)||rows.length<20||rows.length>500)return null;
  const distinct=new Set(rows.map(row=>row.merge_sha));
  if(distinct.size!==rows.length||!rows.every(verifiedRelease))return null;
  const durations=rows.map(row=>ms(row.production_verified_at)-ms(row.pr_opened_at));
  return {samples:rows.length,p50_to_production_ms:percentile(durations,.5),
    p95_to_production_ms:percentile(durations,.95),
    repeated_ci_attempts:rows.reduce((n,row)=>n+Math.max(0,row.ci_attempts-1),0),
    ci_attempts_per_release:rows.reduce((n,row)=>n+row.ci_attempts,0)/rows.length};
}
export function evaluateIndependentOptimization({baseline=[],candidate=[],regression}={}){
  const old=releaseStats(baseline),next=releaseStats(candidate);
  const allowed=Boolean(old&&next&&regression?.independent_evaluator===true&&
    regression?.security_regressions===0&&regression?.required_gate_regressions===0&&
    regression?.rollback_verified===true&&regression?.same_workload_comparison===true);
  const improvement=allowed&&next.p95_to_production_ms<old.p95_to_production_ms&&
    next.ci_attempts_per_release<=old.ci_attempts_per_release&&
    next.p50_to_production_ms<=old.p50_to_production_ms;
  return {status:!allowed?'INSUFFICIENT_INDEPENDENT_RELEASE_EVIDENCE':
    improvement?'CANDIDATE_SHADOW_REVIEW_ELIGIBLE':'NO_PROVEN_NONREGRESSING_IMPROVEMENT',
    baseline:old,candidate:next,independent_regression_verified:allowed,
    improvement_supported:improvement,
    // The actual protected promotion path must make its own independent decision.
    can_auto_apply:false,can_bypass_required_or_codeql:false};
}
export function buildSupervisorDailyLearning({supervisor,ci=null,releaseEvidence=null,now=new Date().toISOString()}={}){
  const sampleValid=Boolean(supervisor&&
    ['SAMPLED_EXECUTION_NOT_RELEASE_SLO','INSUFFICIENT_EXECUTION_SAMPLES'].includes(supervisor.status)&&
    Array.isArray(supervisor.runs)&&Array.isArray(supervisor.read_errors)&&supervisor.read_errors.length===0);
  const ciValid=Boolean(ci&&ci.status==='SAMPLED_METRICS_NOT_SLO'&&
    Array.isArray(ci.read_errors)&&ci.read_errors.length===0);
  const verdict=evaluateIndependentOptimization(releaseEvidence||{});
  const categories=sampleValid?supervisor.observed_event_categories||{}:null;
  const repeated=sampleValid?supervisor.repeated_drift_prs:null;
  return {
    schema:'powerhouse-supervisor-daily-learning-v1',
    utc_day:String(now).slice(0,10),
    owner:'EXISTING_RECOVERY_SUPERVISOR_AND_HOURLY_JANITOR',
    status:sampleValid?'OBSERVED_EVIDENCE_ADVISORY_ONLY':'INCOMPLETE_SUPERVISOR_EVIDENCE',
    supervisor_run_ids:sampleValid?supervisor.runs.map(run=>run.run_id):[],
    repeated_drift_prs:Array.isArray(repeated)?repeated:null,
    writer_lease_denials:categories?.WRITER_LEASE_MISSING??null,
    cas_or_provider_rejections_unverified:categories?.CAS_OR_PROVIDER_REJECTION_UNVERIFIED??null,
    confirmed_stale_head_cas_rejections:null,
    ci_distinct_runs_sampled:ciValid?ci.distinct_runs??null:null,
    repeated_exact_sha_workflow_runs:null,
    unnecessary_ci_repetitions_proven:null,
    ci_p95_wait_to_start_ms:ciValid?ci.p95_wait_to_start_ms??null:null,
    ci_p95_execution_ms:ciValid?ci.p95_execution_ms??null:null,
    time_to_successful_production_ms:verdict.candidate?.p95_to_production_ms??null,
    optimization:verdict,
    recommendation:'REVIEW_ROOT_CAUSES_AND_EXACT_HEAD_RELEASE_EVIDENCE_BEFORE_ANY_OPTIMIZATION',
    new_scheduler:false,can_mutate:false,can_dispatch:false,can_promote:false
  };
}
