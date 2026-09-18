export const DEFAULT_SLO = Object.freeze({
  firstSignalSeconds: 60,
  queuedStaleSeconds: 240,
  observeLongRunningSeconds: 1200
});

const CRITICAL = Object.freeze({
  required:/required test/i,
  brain:/unified brain delivery|brain delivery/i
});

const ACTIVE = new Set(['queued','in_progress','waiting','requested','pending']);
const QUEUED = new Set(['queued','waiting','requested','pending']);
const FAILED = new Set(['failure','cancelled','timed_out','action_required','startup_failure']);

function timestampOf(run){
  for(const value of [run.updated_at,run.run_started_at,run.created_at]){
    const parsed=Date.parse(value??'');
    if(Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function ageSeconds(run,now){
  const ts=timestampOf(run);
  return ts===null?0:Math.max(0,(now-ts)/1000);
}

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
  const headAgeSeconds=headUpdatedAt?Math.max(0,(now-new Date(headUpdatedAt).getTime())/1000):0;
  const active=workflowRuns.filter(r=>ACTIVE.has(r.status));
  const failed=workflowRuns.filter(r=>r.status==='completed'&&FAILED.has(r.conclusion));
  const coverage=criticalWorkflowCoverage(workflowRuns);

  if(mergeable===false)return {state:'MERGE_CONFLICT_RECOVERY',action:'KEEP_SAME_LINEAGE_AND_REFRESH_FROM_MAIN',terminal:false,coverage};
  if(workflowRuns.length===0&&headAgeSeconds>=slo.firstSignalSeconds)return {state:'ZERO_RUN_RECOVERY',action:'DISPATCH_REQUIRED_AND_BRAIN',terminal:false,coverage};
  if(!coverage.complete&&headAgeSeconds>=slo.firstSignalSeconds)return {state:'PARTIAL_START_RECOVERY',action:'DISPATCH_MISSING_CRITICAL_WORKFLOWS',terminal:false,coverage};
  if(failed.length)return {state:'FAILED_GATE_RECOVERY',action:'READ_FIRST_CURRENT_FAILURE_AND_REPAIR_SAME_LINEAGE',terminal:false,coverage};

  const staleQueued=active.filter(r=>QUEUED.has(r.status)&&ageSeconds(r,now)>=slo.queuedStaleSeconds);
  if(staleQueued.length)return {
    state:'STALE_QUEUE_RECOVERY',
    action:'CANCEL_ONLY_STALE_QUEUED_AND_REDISPATCH_EXACT_HEAD',
    terminal:false,
    coverage,
    staleRunIds:staleQueued.map(r=>r.id).filter(Boolean)
  };

  const longRunning=active.filter(r=>r.status==='in_progress'&&ageSeconds(r,now)>=slo.observeLongRunningSeconds);
  if(longRunning.length)return {
    state:'LONG_RUNNING_OBSERVE',
    action:'OBSERVE_DO_NOT_CANCEL_CURRENT_HEAD_IN_PROGRESS',
    terminal:false,
    coverage,
    runIds:longRunning.map(r=>r.id).filter(Boolean)
  };

  return {state:'HEALTHY_PROGRESS',action:'CONTINUE',terminal:false,coverage};
}
