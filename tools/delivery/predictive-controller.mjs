// A provider-denied zero-job record may be excluded from *actionable* work
// only on a complete and consistent, independently rechecked GitHub snapshot.
// A provider incident is never closed by this capacity classification.
export function partitionVerifiedProviderGhostQueue({
  queuedRuns=[],runProofs=[],currentMainSha='',openPrHeadShas=[],
  snapshotComplete=false,rawTotalCount=null,knownUnresolvedQueuedIds=[],
  providerIncidentOpen=false,now=Date.now()
}={}){
  const runs=Array.isArray(queuedRuns)?queuedRuns:[];
  const reportedCountValid=Number.isSafeInteger(rawTotalCount)&&rawTotalCount>=0;
  const rawQueued=reportedCountValid?rawTotalCount:runs.length;
  const idsInRows=runs.map(run=>run?.id);
  const uniqueIds=new Set(idsInRows);
  const proofs=Array.isArray(runProofs)?runProofs:[];
  const proofIds=proofs.map(proof=>proof?.runId);
  const knownIds=Array.isArray(knownUnresolvedQueuedIds)?knownUnresolvedQueuedIds:[];
  const missingKnown=knownIds.some(id=>!uniqueIds.has(id));
  const collectionInconsistent=snapshotComplete!==true||!reportedCountValid
    ||rawTotalCount!==runs.length||uniqueIds.size!==runs.length
    ||idsInRows.some(id=>!Number.isSafeInteger(id))
    ||new Set(proofIds).size!==proofs.length
    ||proofIds.some(id=>!Number.isSafeInteger(id))
    ||missingKnown;
  const proofMap=new Map(proofs.map(proof=>[proof.runId,proof]));
  const currentHeads=new Set(openPrHeadShas||[]);
  const verified=[];
  if(!collectionInconsistent){
    for(const run of runs){
      if(run.status!=='queued'||run.conclusion!=null) continue;
      const proof=proofMap.get(run.id);
      if(!proof||proof.incident!==4655||proof.providerBoundary!=='GITHUB_CANONICAL_PROVIDER_BLOCKED') continue;
      if(proof.jobsTotalCount!==0||proof.runStatus!=='queued'||proof.runHeadSha!==run.head_sha) continue;
      if(!run.head_sha||!run.head_branch||!currentMainSha||run.head_sha===currentMainSha||currentHeads.has(run.head_sha)) continue;
      if(!run.created_at||run.created_at!==run.updated_at||proof.runUpdatedAt!==run.updated_at||proof.runCreatedAt!==run.created_at) continue;
      const age=now-Date.parse(run.created_at),freshness=now-Date.parse(proof.readbackAt||'');
      if(!Number.isFinite(age)||age<86_400_000||!Number.isFinite(freshness)||freshness<0||freshness>600_000) continue;
      verified.push(run.id);
    }
  }
  return Object.freeze({
    rawQueued,verifiedProviderGhostQueued:verified.length,
    actionableQueued:Math.max(0,rawQueued-verified.length),
    verifiedGhostRunIds:Object.freeze(verified),
    incidentId:4655,snapshotComplete:!collectionInconsistent,
    collectionInconsistent,missingKnownProviderIds:Object.freeze(knownIds.filter(id=>!uniqueIds.has(id))),
    providerIncidentStillOpen:providerIncidentOpen===true||verified.length>0
  });
}

export const QUEUE_PRESSURE_DEFAULTS = Object.freeze({ softActive:8, softQueued:5, hardActive:12, hardQueued:8, maxProjectedNewRuns:3 });

export function assessQueuePressure({queued=0,inProgress=0,pending=0,waiting=0,requested=0,projectedNewRuns=0,queueEvidence=null,limits=QUEUE_PRESSURE_DEFAULTS}={}){
  const split=queueEvidence?partitionVerifiedProviderGhostQueue(queueEvidence):null;
  const rawQueued=Math.max(0,Number(queued)||0);
  // Collection counts outrank any partial/inconsistent proof snapshot.
  const eligible=split && split.snapshotComplete && split.rawQueued===rawQueued ? split.verifiedProviderGhostQueued : 0;
  // No optional dispatch if independent exact-ID reads contradict the queued listing.
  const providerQueueUnknown=Boolean(split && (split.collectionInconsistent || split.rawQueued!==rawQueued));
  const counts={queued:Math.max(0,rawQueued-eligible),rawQueued,verifiedProviderGhostQueued:eligible,inProgress:Math.max(0,Number(inProgress)||0),pending:Math.max(0,Number(pending)||0),waiting:Math.max(0,Number(waiting)||0),requested:Math.max(0,Number(requested)||0),projectedNewRuns:Math.max(0,Number(projectedNewRuns)||0)};
  const active=counts.queued+counts.inProgress+counts.pending+counts.waiting+counts.requested;
  const projectedActive=active+counts.projectedNewRuns;
  const projectedQueued=counts.queued+counts.projectedNewRuns;
  let state='HEALTHY',action='ALLOW_BOUNDED_SINGLE_FLIGHT';
  if(providerQueueUnknown){state='PROVIDER_QUEUE_SNAPSHOT_INCONSISTENT';action='HOLD_OPTIONAL_DISPATCH_AND_RECHECK_EXACT_PROVIDER_STATE';}
  else if(active>=limits.hardActive||counts.queued>=limits.hardQueued){state='CIRCUIT_OPEN';action='NO_NEW_RECOVERY_OR_OPTIONAL_WORK_REUSE_DEDUPE_REAP';}
  else if(counts.projectedNewRuns>limits.maxProjectedNewRuns||projectedActive>=limits.hardActive||projectedQueued>=limits.hardQueued){state='PROJECTED_OVERLOAD';action='BATCH_NARROW_OR_DEFER_BEFORE_MUTATION';}
  else if(active>=limits.softActive||counts.queued>=limits.softQueued){state='PRESSURE_HIGH';action='ESSENTIAL_SINGLE_FLIGHT_ONLY_BATCH_WRITES';}
  return Object.freeze({state,action,active,projectedActive,projectedQueued,allowOptionalDispatch:state==='HEALTHY',allowRecoveryFanout:false,providerGhostIncidentOpen:split?.providerIncidentStillOpen===true,queueSnapshotInconsistent:providerQueueUnknown,shouldBatchWrites:state!=='HEALTHY'||counts.projectedNewRuns>1,counts,limits});
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

export function classifyRecovery({mergeable=true,behindBy=0,workflowRuns=[],headUpdatedAt,now=Date.now(),slo=DEFAULT_SLO}={}){
  const headAgeSeconds=headUpdatedAt?Math.max(0,(now-new Date(headUpdatedAt).getTime())/1000):0;
  const latest=latestCriticalWorkflowRuns(workflowRuns);
  const openPrCritical=[latest.required].filter(Boolean);
  const active=openPrCritical.filter(r=>ACTIVE.has(r.status));
  const failed=openPrCritical.filter(r=>r.status==='completed'&&FAILED.has(r.conclusion));
  const cancelledRequired=openPrCritical.filter(r=>r.status==='completed'&&r.conclusion==='cancelled');
  const coverage=criticalWorkflowCoverage(workflowRuns);
  const behind=Number(behindBy);

  if(mergeable===false)return {state:'MERGE_CONFLICT_RECOVERY',action:'KEEP_SAME_LINEAGE_AND_REFRESH_FROM_MAIN',terminal:false,coverage};
  if(workflowRuns.length===0&&headAgeSeconds>=slo.firstSignalSeconds)return {state:'ZERO_RUN_RECOVERY',action:'DISPATCH_REQUIRED',terminal:false,coverage};
  if(!coverage.complete&&headAgeSeconds>=slo.firstSignalSeconds)return {state:'PARTIAL_START_RECOVERY',action:'DISPATCH_MISSING_CRITICAL_WORKFLOWS',terminal:false,coverage};
  if(Number.isFinite(behind)&&behind>0&&coverage.complete&&active.length===0&&cancelledRequired.length)return {
    state:'MAIN_DRIFT_RECOVERY',
    action:'KEEP_SAME_LINEAGE_AND_REFRESH_FROM_MAIN',
    terminal:false,
    coverage,
    behindBy:behind,
    recoveryCause:'CANCELLED_REQUIRED_ON_STALE_MAIN'
  };
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

  if(Number.isFinite(behind)&&behind>0&&coverage.complete&&active.length===0)return {
    state:'MAIN_DRIFT_RECOVERY',
    action:'KEEP_SAME_LINEAGE_AND_REFRESH_FROM_MAIN',
    terminal:false,
    coverage,
    behindBy:behind
  };

  return {state:'HEALTHY_PROGRESS',action:'CONTINUE',terminal:false,coverage};
}



// Advisory preflight impact only. This does not change mandatory exact-head,
// security, provider, tenant or production release checks.
export const DELIVERY_LANES=Object.freeze(['website','backend-supabase','portal','cms','one-brain','powerhouse','heartbeat']);
export function classifyDeliveryImpact(changedPaths=[]){
  const lanes=new Set(),crossLaneContracts=new Set(),unknownPaths=[];
  const paths=Array.isArray(changedPaths)?[...new Set(changedPaths.map(String))]:[];
  for(const original of paths){
    const path=original.trim().replaceAll('\\','/').replace(/^\.\//,'').toLowerCase();
    if(!path||path.startsWith('/')||path==='..'||path.startsWith('../')||path.includes('/../')){
      unknownPaths.push(original);continue;
    }
    let recognized=false;
    const add=(...xs)=>{xs.forEach(x=>lanes.add(x));recognized=true;};
    if(/^(cms\/|content\/|blog\/|posts\/|scripts\/(blog|content)\/)/.test(path)){
      add('cms','website');crossLaneContracts.add('cms-to-website');
    }
    if(/^(website\/|site\/|src\/|pages\/|styles\/|public\/)/.test(path))add('website');
    if(/^netlify\//.test(path)||path==='netlify.toml'){
      add('website');
      if(/^netlify\/functions\//.test(path)){
        add('portal','one-brain');crossLaneContracts.add('serverless-to-portal-brain');
      }
    }
    if(/^supabase\//.test(path)){
      add('backend-supabase');
      if(/^supabase\/migrations\//.test(path)){
        add('one-brain','portal','heartbeat');crossLaneContracts.add('schema-to-runtime-consumers');
      }
    }
    if(/^(portal\/|portal-next\/|portal-v2\/)/.test(path))add('portal');
    if(/^(brain\/|scripts\/brain\/)/.test(path)){
      add('one-brain');
      if(/^brain\/contracts\//.test(path)){
        add('powerhouse','portal','heartbeat');crossLaneContracts.add('brain-contract-to-consumers');
      }
    }
    if(/^(\.github\/|tools\/delivery\/|tools\/ci\/|\.agents\/|platform\/system-map\/|docs\/)/.test(path)||path==='agents.md'||path==='readme.md'){
      add('powerhouse');
      if(path.includes('heartbeat'))add('heartbeat');
    }
    if(/^(heartbeat\/|tools\/heartbeat\/)/.test(path))add('heartbeat');
    if(/^tests\//.test(path)){
      if(/^tests\/(delivery|powerhouse|github|ci)[/-]/.test(path))add('powerhouse');
      else if(/^tests\/(brain|one-brain)[/-]/.test(path))add('one-brain');
      else if(/^tests\/portal[/-]/.test(path))add('portal');
      else if(/^tests\/(cms|blog|content)[/-]/.test(path)){
        add('cms','website');crossLaneContracts.add('cms-to-website');
      }
      else if(/^tests\/(supabase|sql)[/-]/.test(path))add('backend-supabase');
      else{add(...DELIVERY_LANES);crossLaneContracts.add('unscoped-test-impact');}
    }
    if(!recognized)unknownPaths.push(original);
  }
  if(!paths.length)unknownPaths.push('<missing changed paths>');
  if(unknownPaths.length)DELIVERY_LANES.forEach(l=>lanes.add(l));
  return Object.freeze({
    lanes:Object.freeze(DELIVERY_LANES.filter(l=>lanes.has(l))),
    crossLaneContracts:Object.freeze([...crossLaneContracts].sort()),
    unknownPaths:Object.freeze(unknownPaths),
    preflightMode:unknownPaths.length?'FULL_CROSS_LANE_PREFLIGHT':'TARGETED_EARLY_PREFLIGHT',
    mandatoryProtectedChecks:Object.freeze(['hygiene / admission','test','CodeQL javascript-typescript']),
    maySkipProtectedChecks:false
  });
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
  writerLease=null,
  capturedMainEpoch='',
  limits=AGENT_DELIVERY_DEFAULTS
}={}){
  const pressure=assessQueuePressure({...queue,projectedNewRuns});
  const deliveryImpact=classifyDeliveryImpact(changedPaths);
  const normalizedHead=String(currentHead||'').trim().toLowerCase();
  const normalizedMain=String(currentMain||'').trim().toLowerCase();
  const normalizedCaptured=String(capturedMainEpoch||'').trim().toLowerCase();
  const leaseState=String(writerLease?.state||'').trim().toUpperCase();
  const leaseHead=String(writerLease?.headSha||'').trim().toLowerCase();
  const leaseMain=String(writerLease?.mainEpochSha||'').trim().toLowerCase();

  if(leaseState==='TERMINAL_DELIVERY'){
    const staleLeaseHead=Boolean(leaseHead&&normalizedHead&&leaseHead!==normalizedHead);
    const staleLeaseMain=Boolean(leaseMain&&normalizedMain&&leaseMain!==normalizedMain);
    return Object.freeze({
      state:'TERMINAL_CANDIDATE_IMMUTABLE',
      action:staleLeaseHead
        ? 'RELOAD_CANONICAL_HEAD_BEFORE_ACTION'
        : staleLeaseMain
          ? 'REVALIDATE_ZERO_OVERLAP_AND_SYNC_EXISTING_CANDIDATE'
          : 'DO_NOT_REWRITE_TERMINAL_CANDIDATE',
      canMutateCandidate:false,
      canContinueIndependentWork:true,
      pressure,deliveryImpact,
      reason:staleLeaseHead?'TERMINAL_LEASE_HEAD_DRIFT':staleLeaseMain?'TERMINAL_LEASE_MAIN_EPOCH_DRIFT':'TERMINAL_LEASE_BRANCH_IMMUTABLE'
    });
  }

  if(normalizedCaptured&&normalizedMain&&normalizedCaptured!==normalizedMain){
    return Object.freeze({
      state:'STALE_MAIN_EPOCH',
      action:'REVALIDATE_ZERO_OVERLAP_AND_SYNC_EXISTING_CANDIDATE',
      canMutateCandidate:false,
      canContinueIndependentWork:true,
      pressure,deliveryImpact,
      reason:'CAPTURED_MAIN_EPOCH_STALE'
    });
  }

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
    canonicalWriter:competingWriter,pressure,deliveryImpact,reason:'ONE_OBLIGATION_ONE_ACTIVE_WRITER'
  });
  if(terminalIntent && conflicts.length) return Object.freeze({
    state:'SERIALIZE_TERMINAL_LANDING',
    action:'CHECKPOINT_AND_WAIT_FOR_CONFLICTING_LANDING_WHILE_CONTINUING_INDEPENDENT_WORK',
    canMutateCandidate:false,canContinueIndependentWork:true,
    conflicts,pressure,deliveryImpact,reason:'OVERLAPPING_TERMINAL_RESOURCE'
  });
  if(pressure.state==='CIRCUIT_OPEN'||pressure.state==='PROJECTED_OVERLOAD'||pressure.state==='PROVIDER_QUEUE_SNAPSHOT_INCONSISTENT') return Object.freeze({
    state:'BATCH_BEFORE_MUTATION',
    action:'REDUCE_FANOUT_REUSE_ACTIVE_RUNS_AND_CONTINUE_LOCAL_WORK',
    canMutateCandidate:false,canContinueIndependentWork:true,
    pressure,deliveryImpact,reason:'PREDICTED_QUEUE_OVERLOAD'
  });
  const parallelActive=activeCandidates.filter(candidate=>candidate.active!==false).length;
  if(parallelActive>=limits.maxParallelNonConflicting) return Object.freeze({
    state:'PARALLEL_BUDGET_FULL',
    action:'CHECKPOINT_AND_CONTINUE_NONMUTATING_WORK',
    canMutateCandidate:false,canContinueIndependentWork:true,
    pressure,deliveryImpact,reason:'PARALLEL_AGENT_BUDGET'
  });
  return Object.freeze({
    state:'BUILD_PARALLEL',
    action:'MUTATE_OWN_CANDIDATE_AND_REUSE_SINGLE_FLIGHT_CI',
    canMutateCandidate:true,canContinueIndependentWork:true,
    pressure,deliveryImpact,currentMain,reason:'NO_CONFLICT_AND_CAPACITY_AVAILABLE'
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


export const WORKFLOW_OBSERVATION_DEFAULTS = Object.freeze({
  maxTopLevelSnapshotsPerCycle: 1,
  maxFailureDrilldownsPerCycle: 1,
  sameSnapshotCooldownSeconds: 120,
  maxObservationToolCallsPerCycle: 3,
  maxObservationWallSeconds: 30
});

const OBSERVATION_ACTIVE = new Set(['queued','in_progress','waiting','requested','pending']);
const OBSERVATION_FAILED = new Set(['failure','cancelled','timed_out','action_required','startup_failure']);

function workflowSnapshotKey(headSha='', workflowRuns=[]){
  const rows=(workflowRuns||[]).map(run=>[
    String(run?.id??''),
    String(run?.name??''),
    String(run?.status??''),
    String(run?.conclusion??''),
    String(run?.updated_at??'')
  ].join(':')).sort();
  return [String(headSha||'').toLowerCase(),...rows].join('|');
}

export function planWorkflowObservation({
  headSha='',
  workflowRuns=[],
  previousObservation=null,
  topLevelSnapshotsUsed=0,
  failureDrilldownsUsed=0,
  observationToolCallsUsed=0,
  observationWallSeconds=0,
  now=Date.now(),
  limits=WORKFLOW_OBSERVATION_DEFAULTS
}={}){
  const snapshotKey=workflowSnapshotKey(headSha,workflowRuns);
  const previousAt=Date.parse(previousObservation?.observedAt||'');
  const unchanged=Boolean(previousObservation?.snapshotKey && previousObservation.snapshotKey===snapshotKey);
  const withinCooldown=unchanged && Number.isFinite(previousAt) &&
    Math.max(0,(Number(now)-previousAt)/1000) < limits.sameSnapshotCooldownSeconds;

  if(observationToolCallsUsed>=limits.maxObservationToolCallsPerCycle || observationWallSeconds>=limits.maxObservationWallSeconds){
    return Object.freeze({
      state:'OBSERVATION_BUDGET_EXHAUSTED',
      action:'CHECKPOINT_AND_CONTINUE_INDEPENDENT_WORK',
      shouldReadTopLevel:false,
      shouldDrillDownFailure:false,
      shouldPoll:false,
      snapshotKey
    });
  }
  if(topLevelSnapshotsUsed>=limits.maxTopLevelSnapshotsPerCycle || withinCooldown){
    return Object.freeze({
      state:withinCooldown?'UNCHANGED_SNAPSHOT_COOLDOWN':'TOP_LEVEL_SNAPSHOT_BUDGET_EXHAUSTED',
      action:'CHECKPOINT_AND_CONTINUE_INDEPENDENT_WORK',
      shouldReadTopLevel:false,
      shouldDrillDownFailure:false,
      shouldPoll:false,
      snapshotKey,
      nextEligibleObservationAt:withinCooldown
        ? new Date(previousAt + limits.sameSnapshotCooldownSeconds*1000).toISOString()
        : null
    });
  }

  const failed=(workflowRuns||[]).find(run=>run?.status==='completed' && OBSERVATION_FAILED.has(run?.conclusion));
  if(failed){
    const mayDrill=failureDrilldownsUsed<limits.maxFailureDrilldownsPerCycle;
    return Object.freeze({
      state:'TERMINAL_FAILURE',
      action:mayDrill?'DRILL_DOWN_FIRST_FAILED_WORKFLOW_JOB_STEP_THEN_REPAIR':'CHECKPOINT_AND_CONTINUE_INDEPENDENT_WORK',
      shouldReadTopLevel:true,
      shouldDrillDownFailure:mayDrill,
      shouldPoll:false,
      failedRunId:failed.id??null,
      failedRunName:failed.name??null,
      snapshotKey
    });
  }

  const active=(workflowRuns||[]).filter(run=>OBSERVATION_ACTIVE.has(run?.status));
  if(active.length){
    return Object.freeze({
      state:'REMOTE_WORKFLOW_ACTIVE',
      action:'CHECKPOINT_AND_CONTINUE_INDEPENDENT_WORK',
      shouldReadTopLevel:true,
      shouldDrillDownFailure:false,
      shouldPoll:false,
      activeRunIds:active.map(run=>run?.id).filter(Boolean),
      snapshotKey,
      nextEligibleObservationAt:new Date(Number(now)+limits.sameSnapshotCooldownSeconds*1000).toISOString()
    });
  }

  return Object.freeze({
    state:'TOP_LEVEL_TERMINAL',
    action:'USE_TOP_LEVEL_RESULT_WITHOUT_ENUMERATING_SIBLING_JOBS',
    shouldReadTopLevel:true,
    shouldDrillDownFailure:false,
    shouldPoll:false,
    snapshotKey
  });
}


// Read-only, bounded GitHub Actions job telemetry. No runner/job state is mutated.
// Job queue delay is distinct from execution duration; incomplete provider evidence
// must never become a zero-duration sample or a production SLO claim.
const EXECUTED_CI_JOB_CONCLUSIONS=new Set(['success','failure','timed_out']);
// Skipped, neutral and cancelled provider records do not establish actual runner execution.
export function summarizeObservedCiJobs(observations=[],{minJobs=20,minRuns=5}={}){
  const rows=Array.isArray(observations)?observations:[];
  const seen=new Set(),valid=[],rejected={invalid_identity:0,partial_job:0,non_executed:0,invalid_time:0,duplicate:0};
  for(const observation of rows){
    const run=observation?.run||{},job=observation?.job||{};
    const runId=run.id,attempt=run.run_attempt,jobId=job.id;
    const sha=String(run.head_sha||'');
    if(!Number.isSafeInteger(runId)||!Number.isSafeInteger(attempt)||attempt<1||
       !Number.isSafeInteger(jobId)||!/^[0-9a-f]{40}$/i.test(sha)){
      rejected.invalid_identity++;continue;
    }
    if(run.status!=='completed'||job.status!=='completed'||!job.conclusion){
      rejected.partial_job++;continue;
    }
    if(!EXECUTED_CI_JOB_CONCLUSIONS.has(job.conclusion)){
      rejected.non_executed++;continue;
    }
    const id=runId+':'+attempt+':'+jobId;
    if(seen.has(id)){rejected.duplicate++;continue;}
    seen.add(id);
    const created=Date.parse(job.created_at||'');
    const started=Date.parse(job.started_at||'');
    const completed=Date.parse(job.completed_at||'');
    const wait=started-created,duration=completed-started;
    if(!Number.isFinite(wait)||!Number.isFinite(duration)||
       wait<0||duration<0||wait>172800000||duration>172800000){
      rejected.invalid_time++;continue;
    }
    valid.push(Object.freeze({
      run_id:runId,run_attempt:attempt,job_id:jobId,head_sha:sha,
      workflow_id:Number.isSafeInteger(run.workflow_id)?run.workflow_id:null,
      workflow_name:String(run.name||job.workflow_name||'unnamed_workflow').replace(/[\x00-\x1f\x7f]/g,' ').trim().slice(0,100),
      job_name:String(job.name||'unnamed_job').replace(/[\x00-\x1f\x7f]/g,' ').trim().slice(0,100),
      conclusion:String(job.conclusion),
      wait_to_start_ms:wait,execution_ms:duration
    }));
  }
  const runs=new Set(valid.map(r=>r.run_id+':'+r.run_attempt));
  const sufficient=valid.length>=minJobs&&runs.size>=minRuns;
  const percentile=(key,p)=>{
    if(!sufficient)return null;
    const values=valid.map(r=>r[key]).sort((a,b)=>a-b);
    return values[Math.max(0,Math.ceil(p*values.length)-1)];
  };
  // Independent attempts, not raw matrix replicas, define recurrence.
  // Only compare jobs from the SAME numeric GitHub workflow ID and exact job name.
  const recurrentGroups=new Map();
  for(const job of valid){
    if(!Number.isSafeInteger(job.workflow_id)||job.workflow_id<1||
       !job.job_name||job.job_name==='unnamed_job')continue;
    const family=job.workflow_id+':'+job.job_name;
    if(!recurrentGroups.has(family))recurrentGroups.set(family,{
      workflow_id:job.workflow_id,job_name:job.job_name,attempts:new Map()
    });
    const group=recurrentGroups.get(family);
    const attempt=job.run_id+':'+job.run_attempt;
    const existing=group.attempts.get(attempt);
    // A matrix retry within one workflow attempt is ONE conservative worst observed job.
    if(!existing||job.execution_ms>existing.execution_ms)group.attempts.set(attempt,job);
  }
  const recurrent=sufficient?[...recurrentGroups.values()].filter(g=>g.attempts.size>=3)
    .map(g=>{
      const occurrences=[...g.attempts.values()];
      const timings=occurrences.map(j=>j.execution_ms).sort((a,b)=>a-b);
      const p50=timings[Math.max(0,Math.ceil(timings.length*0.5)-1)];
      const name=g.job_name.toLowerCase();
      const investigation_lane=/codeql|security/.test(name)?'security'
        :/preflight|admission|janitor|test/.test(name)?'delivery'
        :/supabase|preview/.test(name)?'provider'
        :/website|netlify/.test(name)?'website'
        :/backend/.test(name)?'backend'
        :/portal/.test(name)?'portal':'unclassified';
      return Object.freeze({
        workflow_id:g.workflow_id,job_name:g.job_name,investigation_lane,
        distinct_attempts:occurrences.length,sample_p50_execution_ms:p50,
        sample_max_execution_ms:timings[timings.length-1],
        representative_run_ids:Object.freeze(occurrences.slice(0,6).map(j=>j.run_id))
      });
    })
    .sort((a,b)=>b.sample_p50_execution_ms-a.sample_p50_execution_ms||
      b.distinct_attempts-a.distinct_attempts||a.workflow_id-b.workflow_id||
      a.job_name.localeCompare(b.job_name)).slice(0,5):[];
  return Object.freeze({
    schema:'powerhouse-observed-ci-job-telemetry-v1',
    evidence_kind:'GITHUB_PROVIDER_JOB_TIMESTAMPS',
    status:sufficient?'SAMPLED_METRICS_NOT_SLO':'INSUFFICIENT_EVIDENCE',
    sample_jobs:valid.length,distinct_runs:runs.size,
    input_rows:rows.length,rejected:Object.freeze(rejected),
    p50_wait_to_start_ms:percentile('wait_to_start_ms',0.5),
    p95_wait_to_start_ms:percentile('wait_to_start_ms',0.95),
    p50_execution_ms:percentile('execution_ms',0.5),
    p95_execution_ms:percentile('execution_ms',0.95),
    // These observed maxima identify investigation candidates, NOT a causal critical path.
    diagnostic_hotspots:Object.freeze({
      status:sufficient?'SAMPLED_DIAGNOSTIC_NOT_CRITICAL_PATH':'INSUFFICIENT_EVIDENCE',
      jobs:Object.freeze(sufficient?[...valid]
        .sort((a,b)=>b.execution_ms-a.execution_ms||b.wait_to_start_ms-a.wait_to_start_ms||a.job_id-b.job_id)
        .slice(0,5).map(r=>Object.freeze({
          run_id:r.run_id,run_attempt:r.run_attempt,job_id:r.job_id,
          head_sha:r.head_sha,workflow_name:r.workflow_name,job_name:r.job_name,
          conclusion:r.conclusion,execution_ms:r.execution_ms,wait_to_start_ms:r.wait_to_start_ms
        })):[])
    }),
    // Advisory learning signal only: at least three DIFFERENT attempts per stable
    // workflow/job identity; no historical baseline or change-lead-time claim.
    recurrent_hotspots:Object.freeze({
      status:!sufficient?'INSUFFICIENT_EVIDENCE'
        :recurrent.length?'REPEATED_JOB_SAMPLE_NOT_SLO':'INSUFFICIENT_REPEATED_JOB_EVIDENCE',
      minimum_distinct_attempts:3,
      jobs:Object.freeze(recurrent)
    }),
    job_evidence:Object.freeze(valid)
  });
}
