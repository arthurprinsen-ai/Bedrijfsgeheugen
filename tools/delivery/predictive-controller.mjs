export const DEFAULT_SLO = Object.freeze({
  firstSignalSeconds: 60,
  staleRunSeconds: 90
});

const CRITICAL = Object.freeze({
  required:/required test/i,
  brain:/unified brain delivery|brain delivery/i
});

export function criticalWorkflowCoverage(workflowRuns=[]){
  const names=workflowRuns.map(r=>String(r.name??''));
  const requiredPresent=names.some(name=>CRITICAL.required.test(name));
  const brainPresent=names.some(name=>CRITICAL.brain.test(name));
  const missing=[];
  if(!requiredPresent) missing.push('required-test.yml');
  if(!brainPresent) missing.push('unified-brain-delivery.yml');
  return {requiredPresent,brainPresent,missing,complete:missing.length===0};
}

export function classifyRecovery({mergeable=true,workflowRuns=[],headUpdatedAt,now=Date.now(),slo=DEFAULT_SLO}={}){
  const ageSeconds=headUpdatedAt?Math.max(0,(now-new Date(headUpdatedAt).getTime())/1000):0;
  const active=workflowRuns.filter(r=>['queued','in_progress','waiting','requested','pending'].includes(r.status));
  const failed=workflowRuns.filter(r=>r.status==='completed'&&['failure','cancelled','timed_out','action_required','startup_failure'].includes(r.conclusion));
  const coverage=criticalWorkflowCoverage(workflowRuns);
  if(mergeable===false)return {state:'MERGE_CONFLICT_RECOVERY',action:'KEEP_SAME_LINEAGE_AND_REFRESH_FROM_MAIN',terminal:false,coverage};
  if(workflowRuns.length===0&&ageSeconds>=slo.firstSignalSeconds)return {state:'ZERO_RUN_RECOVERY',action:'DISPATCH_REQUIRED_AND_BRAIN',terminal:false,coverage};
  if(!coverage.complete&&ageSeconds>=slo.firstSignalSeconds)return {state:'PARTIAL_START_RECOVERY',action:'DISPATCH_MISSING_CRITICAL_WORKFLOWS',terminal:false,coverage};
  if(active.length&&ageSeconds>=slo.staleRunSeconds)return {state:'STALE_RUN_RECOVERY',action:'CANCEL_SUPERSEDED_AND_REDISPATCH_EXACT_HEAD',terminal:false,coverage};
  if(failed.length)return {state:'FAILED_GATE_RECOVERY',action:'READ_FIRST_CURRENT_FAILURE_AND_REPAIR_SAME_LINEAGE',terminal:false,coverage};
  return {state:'HEALTHY_PROGRESS',action:'CONTINUE',terminal:false,coverage};
}
