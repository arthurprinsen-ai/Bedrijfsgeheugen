function clamp(value,min,max){ return Math.max(min,Math.min(max,value)); }

export function calibrateCi({ report = {}, policy } = {}) {
  if (!policy || policy.version !== 'POWERHOUSE-CI-CALIBRATION-v1') {
    throw new TypeError('POWERHOUSE-CI-CALIBRATION-v1 policy is required');
  }
  const m=report.metrics||{};
  const jobs=Array.isArray(report.jobs)?report.jobs:[];
  const sampled=Math.max(1,Number(report.sampled_jobs||jobs.length||1));
  const failed=Number(m.failed_jobs||0);
  const cancelled=Number(m.cancelled_jobs||0);
  const failureRate=failed/sampled;
  const cancelRate=cancelled/sampled;
  const recommendations=[];

  if(Number(m.queue_wait_seconds_p95||0) > policy.thresholds.queueP95HighSeconds){
    recommendations.push({
      id:'reduce-preview-parallelism',
      priority:'high',
      reason:'queue_p95_high',
      suggested:{
        preview_route_concurrency: clamp(2,policy.guardrails.minSuggestedRouteConcurrency,policy.guardrails.maxSuggestedRouteConcurrency),
        preview_viewport_concurrency: clamp(1,policy.guardrails.minSuggestedViewportConcurrency,policy.guardrails.maxSuggestedViewportConcurrency)
      }
    });
  }

  if(Number(m.workflow_fanout_per_sha_p95||0) > policy.thresholds.fanoutP95High){
    recommendations.push({
      id:'reduce-workflow-fanout',
      priority:'high',
      reason:'fanout_p95_high',
      suggested:{
        preserve_single_required_authority:true,
        consolidate_auxiliary_pr_workflows:true
      }
    });
  }

  if(Number(m.execution_seconds_p95||0) > policy.thresholds.executionP95HighSeconds){
    recommendations.push({
      id:'tighten-impact-routing',
      priority:'medium',
      reason:'execution_p95_high',
      suggested:{
        prefer_capability_scoped_tests:true,
        preserve_full_suite_for_r2_r4:true
      }
    });
  }

  if(failureRate > policy.thresholds.failureRateHigh){
    recommendations.push({
      id:'increase-regression-memory-weight',
      priority:'high',
      reason:'failure_rate_high',
      suggested:{
        preserve_pattern_memory:true,
        max_historical_tests:policy.guardrails.maxHistoricalPatternTests
      }
    });
  }

  if(cancelRate > policy.thresholds.cancelRateHigh){
    recommendations.push({
      id:'reduce-superseded-work',
      priority:'medium',
      reason:'cancel_rate_high',
      suggested:{
        keep_pr_scoped_single_flight:true,
        delay_noncritical_auxiliary_dispatch:true
      }
    });
  }

  return Object.freeze({
    version:policy.version,
    mode:policy.mode,
    observed:{
      queue_p95_seconds:Number(m.queue_wait_seconds_p95||0),
      execution_p95_seconds:Number(m.execution_seconds_p95||0),
      fanout_p95:Number(m.workflow_fanout_per_sha_p95||0),
      failure_rate:Number(failureRate.toFixed(4)),
      cancel_rate:Number(cancelRate.toFixed(4))
    },
    recommendations:Object.freeze(recommendations),
    safe_to_apply_automatically:false,
    mutation_authority:'PROTECTED_CANDIDATE_ONLY'
  });
}

/**
 * Required runs have a display name such as "Required test PR #4174 <sha>".
 * Job-to-run associations must not rely on the exact unparameterized name.
 */
export function isRequiredCiRun(run = {}) {
  const name = String(run?.name ?? '');
  return run?.event === 'pull_request' && /^Required test(?:$| PR #\d+(?:\s|$))/.test(name);
}

/**
 * Keep a bounded Actions API budget but reserve observations of the protection-critical gate.
 * Input is the API's newest-first ordering; no new workflows or API pages are dispatched.
 */
export function selectCiRunsForMeasurement(runs = [], { maxRuns = 60, reservedRequired = 12 } = {}) {
  const limit = Math.max(0, Math.trunc(Number(maxRuns) || 0));
  const reserved = Math.min(limit, Math.max(0, Math.trunc(Number(reservedRequired) || 0)));
  const required = runs.filter(isRequiredCiRun).slice(0, reserved);
  const selected = new Set(required.map(run => String(run.id)));
  const remaining = runs.filter(run => !selected.has(String(run.id))).slice(0, limit - required.length);
  return [...required, ...remaining].sort((a,b) => runs.indexOf(a)-runs.indexOf(b));
}

/**
 * A bounded sample never implies that seven days were fetched. Coverage is evidence,
 * not a success/failure value. Existing *7d field names remain for API compatibility,
 * but consumers must treat them as lower-bound observations if complete is false.
 */
export function describeCiObservationCoverage({ requestedSince, observedAt, oldestFetchedAt = null,
  complete = false, pagesFetched = 0, fetchedRuns = 0, sampledRuns = 0 } = {}) {
  const start = Date.parse(requestedSince ?? '');
  const end = Date.parse(observedAt ?? '');
  const oldest = Date.parse(oldestFetchedAt ?? '');
  const valid = [start,end,oldest].every(Number.isFinite) && end >= start && oldest <= end;
  return Object.freeze({
    requested_window_days: valid ? Number(((end-start)/86400000).toFixed(2)) : null,
    actual_observed_window_hours: valid ? Number(((end-oldest)/3600000).toFixed(2)) : null,
    seven_day_coverage_complete: valid && complete === true,
    bounded_sample_only: !(valid && complete === true),
    pages_fetched: pagesFetched,
    fetched_runs: fetchedRuns,
    sampled_runs: sampledRuns,
    interpretation: valid && complete ? 'REQUESTED_WINDOW_COVERED' : 'BOUNDED_OBSERVATIONS_NOT_FULL_SEVEN_DAYS',
  });
}
