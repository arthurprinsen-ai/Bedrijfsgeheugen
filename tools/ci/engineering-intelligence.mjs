import crypto from 'node:crypto';

export function selectTests(changedPaths, graph) {
  const selected = new Set(graph.safetyKernel || []);
  let matched = false;
  for (const path of changedPaths) for (const rule of graph.rules || []) if (path.startsWith(rule.path)) { matched = true; for (const t of rule.tests) selected.add(t); }
  if (!matched) for (const t of graph.fullLane || []) selected.add(t);
  return [...selected].sort();
}

export function testReliability(observation) {
  const fingerprint = crypto.createHash('sha256').update(`${observation.test}|${observation.failure || ''}`).digest('hex');
  const runs = Math.max(1, observation.runs || 1);
  const failures = observation.failures || 0;
  return { fingerprint, reliability: 1 - failures / runs, owner: observation.owner || null, quarantine: failures / runs >= 0.2 && Boolean(observation.owner) };
}

export function evaluateBudget({baseline,current,absoluteMax,ratchetMaxRatio=1.1}) {
  if (absoluteMax != null && current > absoluteMax) return {status:'REGRESSION_BLOCK'};
  if (baseline == null) return {status:'BASELINE_DEBT'};
  if (current > baseline * ratchetMaxRatio) return {status:'REGRESSION_BLOCK'};
  return {status:'PASS'};
}

export function rollbackProof({lastProvenAt,maxAgeMs,now=Date.now(),safeEnvironment=true}) {
  if (!safeEnvironment) return {ok:false,status:'UNSAFE_DRILL_ENVIRONMENT'};
  if (!lastProvenAt) return {ok:false,status:'ROLLBACK_PROOF_MISSING'};
  const fresh = now - new Date(lastProvenAt).getTime() <= maxAgeMs;
  return {ok:fresh,status:fresh?'ROLLBACK_PROOF_FRESH':'ROLLBACK_PROOF_STALE'};
}

export function detectWorkConflict(active, proposed, now=Date.now()) {
  const live = active.filter(x => !x.expiresAt || new Date(x.expiresAt).getTime() > now);
  const conflict = live.find(x => x.component === proposed.component || (x.authorities||[]).some(a => (proposed.authorities||[]).includes(a)));
  return conflict ? {ok:false,conflictWith:conflict.changeId} : {ok:true};
}

export function projectScorecard(events=[]) {
  const deployments = events.filter(e=>e.type==='deployment');
  const failures = deployments.filter(e=>e.failed);
  const recoveries = events.filter(e=>e.type==='recovery');
  const avg = xs => xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : 0;
  return {
    deployment_frequency: deployments.length,
    lead_time_ms: avg(deployments.map(e=>e.leadTimeMs||0)),
    change_failure_rate: deployments.length ? failures.length/deployments.length : 0,
    recovery_time_ms: avg(recoveries.map(e=>e.durationMs||0)),
    source: 'existing_brain_events_and_ci_evidence'
  };
}
