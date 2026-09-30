export const QUEUE_PRESSURE_DEFAULTS = Object.freeze({ softActive:8, softQueued:5, hardActive:12, hardQueued:8, maxProjectedNewRuns:3 });

export function assessQueuePressure({queued=0,inProgress=0,pending=0,waiting=0,requested=0,projectedNewRuns=0,limits=QUEUE_PRESSURE_DEFAULTS}={}){
  const counts={queued:Math.max(0,Number(queued)||0),inProgress:Math.max(0,Number(inProgress)||0),pending:Math.max(0,Number(pending)||0),waiting:Math.max(0,Number(waiting)||0),requested:Math.max(0,Number(requested)||0),projectedNewRuns:Math.max(0,Number(projectedNewRuns)||0)};
  const active=counts.queued+counts.inProgress+counts.pending+counts.waiting+counts.requested;
  const projectedActive=active+counts.projectedNewRuns;
  const projectedQueued=counts.queued+counts.projectedNewRuns;
  let state='HEALTHY',action='ALLOW_BOUNDED_SINGLE_FLIGHT';
  if(active>=limits.hardActive||counts.queued>=limits.hardQueued){state='CIRCUIT_OPEN';action='NO_NEW_RECOVERY_OR_OPTIONAL_WORK_REUSE_DEDUPE_REAP';}
  else if(counts.projectedNewRuns>limits.maxProjectedNewRuns||projectedActive>=limits.hardActive||projectedQueued>=limits.hardQueued){state='PROJECTED_OVERLOAD';action='BATCH_NARROW_OR_DEFER_BEFORE_MUTATION';}
  else if(active>=limits.softActive||counts.queued>=limits.softQueued){state='PRESSURE_HIGH';action='ESSENTIAL_SINGLE_FLIGHT_ONLY_BATCH_WRITES';}
  return Object.freeze({state,action,active,projectedActive,projectedQueued,allowOptionalDispatch:state==='HEALTHY',allowRecoveryFanout:false,shouldBatchWrites:state!=='HEALTHY'||counts.projectedNewRuns>1,counts,limits});
}

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

function runOrder(run){
  const ts=timestampOf(run) ?? 0;
  const id=Number(run?.id ?? 0);
  return [ts,Number.isFinite(id)?id:0];
}
function newest(a,b){
  if(!a) return b;
  if(!b) return a;
  const [at,ai]=runOrder(a),[bt,bi]=runOrder(b);
  return bt>at || (bt===at && bi>ai) ? b : a;
}
export function latestCriticalWorkflowRuns(workflowRuns=[]){
  let required=null,brain=null;
  for(const run of workflowRuns){
    const name=String(run.name??'');
    if(CRITICAL.required.test(name)) required=newest(required,run);
    if(CRITICAL.brain.test(name)) brain=newest(brain,run);
  }
  return {required,brain,runs:[required,brain].filter(Boolean)};
}
export function criticalWorkflowCoverage(workflowRuns=[]){
  const latest=latestCriticalWorkflowRuns(workflowRuns);
  const requiredPresent=Boolean(latest.required);
  const brainPresent=Boolean(latest.brain);
  const missing=[];
  if(!requiredPresent) missing.push('required-test.yml');
  // Required test is the single canonical open-PR recovery gate. BRAIN is terminal/promotion evidence.
  return {requiredPresent,brainPresent,missing,complete:requiredPresent};
}

export function classifyRecovery({mergeable=true,workflowRuns=[],headUpdatedAt,now=Date.now(),slo=DEFAULT_SLO}={}){
  const headAgeSeconds=headUpdatedAt?Math.max(0,(now-new Date(headUpdatedAt).getTime())/1000):0;
  const latest=latestCriticalWorkflowRuns(workflowRuns);
  const openPrCritical=[latest.required].filter(Boolean);
  const active=openPrCritical.filter(r=>ACTIVE.has(r.status));
  const failed=openPrCritical.filter(r=>r.status==='completed'&&FAILED.has(r.conclusion));
  const coverage=criticalWorkflowCoverage(workflowRuns);

  if(mergeable===false)return {state:'MERGE_CONFLICT_RECOVERY',action:'KEEP_SAME_LINEAGE_AND_REFRESH_FROM_MAIN',terminal:false,coverage};
  if(workflowRuns.length===0&&headAgeSeconds>=slo.firstSignalSeconds)return {state:'ZERO_RUN_RECOVERY',action:'DISPATCH_REQUIRED',terminal:false,coverage};
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


export const AGENT_DELIVERY_DEFAULTS = Object.freeze({
  maxParallelNonConflicting: 6,
  terminalWritersPerObligation: 1,
  checkpointRequiredBeforeRemoteWait: true
});

const normalizeSet = values => new Set((values ?? []).map(value => String(value).trim()).filter(Boolean));
const intersects = (a,b) => {
  const left=normalizeSet(a), right=normalizeSet(b);
  for(const value of left) if(right.has(value)) return true;
  return false;
};

export function planConcurrentAgentWork({
  obligationId='',
  currentHead='',
  currentMain='',
  activeCandidates=[],
  changedPaths=[],
  conflictContracts=[],
  mutableResources=[],
  queue={},
  projectedNewRuns=0,
  terminalIntent=false,
  limits=AGENT_DELIVERY_DEFAULTS
}={}){
  const pressure=assessQueuePressure({...queue,projectedNewRuns});
  const sameObligation=activeCandidates.filter(candidate =>
    obligationId && String(candidate.obligationId||'')===String(obligationId)
  );
  const competingWriter=sameObligation.find(candidate =>
    candidate.active !== false &&
    candidate.headSha &&
    candidate.headSha !== currentHead
  );
  const conflicts=activeCandidates.filter(candidate => {
    if(candidate.active===false) return false;
    return intersects(changedPaths,candidate.changedPaths) ||
      intersects(conflictContracts,candidate.conflictContracts) ||
      intersects(mutableResources,candidate.mutableResources);
  });
  if(competingWriter) return Object.freeze({
    state:'PARK_BEHIND_CANONICAL_WRITER',
    action:'CHECKPOINT_AND_CONTINUE_NONCONFLICTING_WORK',
    canMutateCandidate:false,canContinueIndependentWork:true,
    canonicalWriter:competingWriter,pressure,reason:'ONE_OBLIGATION_ONE_ACTIVE_WRITER'
  });
  if(terminalIntent && conflicts.length) return Object.freeze({
    state:'SERIALIZE_TERMINAL_LANDING',
    action:'CHECKPOINT_AND_WAIT_FOR_CONFLICTING_LANDING_WHILE_CONTINUING_INDEPENDENT_WORK',
    canMutateCandidate:false,canContinueIndependentWork:true,
    conflicts,pressure,reason:'OVERLAPPING_TERMINAL_RESOURCE'
  });
  if(pressure.state==='CIRCUIT_OPEN'||pressure.state==='PROJECTED_OVERLOAD') return Object.freeze({
    state:'BATCH_BEFORE_MUTATION',
    action:'REDUCE_FANOUT_REUSE_ACTIVE_RUNS_AND_CONTINUE_LOCAL_WORK',
    canMutateCandidate:false,canContinueIndependentWork:true,
    pressure,reason:'PREDICTED_QUEUE_OVERLOAD'
  });
  const parallelActive=activeCandidates.filter(candidate=>candidate.active!==false).length;
  if(parallelActive>=limits.maxParallelNonConflicting) return Object.freeze({
    state:'PARALLEL_BUDGET_FULL',
    action:'CHECKPOINT_AND_CONTINUE_NONMUTATING_WORK',
    canMutateCandidate:false,canContinueIndependentWork:true,
    pressure,reason:'PARALLEL_AGENT_BUDGET'
  });
  return Object.freeze({
    state:'BUILD_PARALLEL',
    action:'MUTATE_OWN_CANDIDATE_AND_REUSE_SINGLE_FLIGHT_CI',
    canMutateCandidate:true,canContinueIndependentWork:true,
    pressure,currentMain,reason:'NO_CONFLICT_AND_CAPACITY_AVAILABLE'
  });
}

export function buildResumableCheckpoint({
  obligationId,candidateHead,mainEpoch,openGates=[],nextSafeAction,
  alreadyProvenSideEffects=[],owner='agent',now=new Date().toISOString()
}={}){
  if(!obligationId||!candidateHead||!mainEpoch||!nextSafeAction) throw new Error('CHECKPOINT_IDENTITY_INCOMPLETE');
  return Object.freeze({
    version:'POWERHOUSE-ASYNC-CHECKPOINT-v1',
    obligation_id:String(obligationId),
    candidate_head:String(candidateHead),
    main_epoch:String(mainEpoch),
    owner:String(owner),
    open_gates:[...new Set(openGates.map(String))],
    already_proven_side_effects:[...new Set(alreadyProvenSideEffects.map(String))],
    next_safe_action:String(nextSafeAction),
    observed_at:String(now),
    terminal:false
  });
}
