export const DEFAULT_SLO = Object.freeze({
  firstSignalSeconds: 60,
  staleRunSeconds: 90,
  maxBlockingSeconds: 480,
  conflictRefreshSeconds: 45
});

export function scoreDeliveryRisk({changedPaths=[], historical={}}={}) {
  const paths=[...new Set(changedPaths.filter(Boolean))];
  let score=0;
  const reasons=[];
  const hit=(points,reason)=>{score+=points; reasons.push(reason);};
  if(paths.some(p=>/^\.github\/workflows\//.test(p))){hit(35,'workflow-control-plane');}
  if(paths.some(p=>/^supabase\/(migrations|schema)/.test(p))){hit(30,'schema');}
  if(paths.some(p=>/auth|security|rls|permission|secret/i.test(p))){hit(35,'security-boundary');}
  if(paths.length>24){hit(20,'wide-delta');}
  if((historical.mergeConflictRate??0)>0.15){hit(15,'conflict-history');}
  if((historical.queueP95Seconds??0)>90){hit(10,'queue-history');}
  if((historical.failureRate??0)>0.2){hit(10,'failure-history');}
  return {score:Math.min(score,100), class:score>=60?'CRITICAL':score>=25?'STANDARD':'FAST', reasons};
}

export function classifyRecovery({mergeable=true, workflowRuns=[], headUpdatedAt, now=Date.now(), slo=DEFAULT_SLO}={}) {
  const ageSeconds=headUpdatedAt ? Math.max(0,(now-new Date(headUpdatedAt).getTime())/1000) : 0;
  const active=workflowRuns.filter(r=>['queued','in_progress','waiting','requested','pending'].includes(r.status));
  const failed=workflowRuns.filter(r=>r.status==='completed' && ['failure','cancelled','timed_out','action_required','startup_failure'].includes(r.conclusion));
  const successful=workflowRuns.filter(r=>r.status==='completed' && r.conclusion==='success');
  if(mergeable===false) return {state:'MERGE_CONFLICT_RECOVERY', action:'REFRESH_SAME_ROLLING_LANE_FROM_MAIN', terminal:false};
  if(workflowRuns.length===0 && ageSeconds>=slo.firstSignalSeconds) return {state:'ZERO_RUN_RECOVERY', action:'DISPATCH_REQUIRED_AND_BRAIN', terminal:false};
  if(active.length && ageSeconds>=slo.staleRunSeconds) return {state:'STALE_RUN_RECOVERY', action:'CANCEL_SUPERSEDED_AND_REDISPATCH_EXACT_HEAD', terminal:false};
  if(failed.length) return {state:'FAILED_GATE_RECOVERY', action:'READ_FIRST_CURRENT_FAILURE_AND_REPAIR_SAME_LINEAGE', terminal:false};
  if(successful.length && active.length===0) return {state:'GATES_OBSERVED', action:'EVALUATE_PROTECTED_PROMOTION', terminal:false};
  return {state:'HEALTHY_PROGRESS', action:'CONTINUE', terminal:false};
}

export function adaptiveGatePlan({riskClass='STANDARD', affectedLanes=[], protectedSurfaces=[]}={}) {
  const lanes=[...new Set(affectedLanes)];
  const protectedSet=[...new Set(protectedSurfaces)];
  const blocking=['identity','hygiene',...lanes.map(x=>`lane:${x}`),'exact-head-production-readback'];
  if(riskClass==='CRITICAL' || protectedSet.length) blocking.splice(blocking.length-1,0,'security-integrity','rollback-readiness');
  return {
    blocking:[...new Set(blocking)],
    shadow:riskClass==='FAST'?['broad-regression','cross-surface-browser','quality-intelligence']:['broad-unrelated-assurance'],
    rule:'block only on changed risk, dependency, contract, security/data/schema boundaries and exact production readback'
  };
}
