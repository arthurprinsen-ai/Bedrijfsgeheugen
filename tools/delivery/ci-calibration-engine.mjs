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
