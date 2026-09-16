const FAIL_CLOSED = new Set(['security','data_integrity','tenant_isolation']);

export function recommendLane({ dimension, critical = false, runtime_seconds = 0, defect_yield = null, risk = 'medium' } = {}) {
  if (critical || FAIL_CLOSED.has(dimension)) {
    return Object.freeze({ lane: 'pr_required', waive_gate: false, reason: 'fail_closed_critical_dimension' });
  }
  const unknownYield = defect_yield === null || defect_yield === undefined;
  if (risk === 'high' || unknownYield) {
    return Object.freeze({ lane: runtime_seconds > 900 ? 'parallel_required' : 'pr_required', waive_gate: false, reason: unknownYield ? 'unknown_yield_preserve_risk' : 'high_risk' });
  }
  if (runtime_seconds > 900 && Number(defect_yield) === 0) {
    return Object.freeze({ lane: 'nightly', waive_gate: false, reason: 'high_cost_low_observed_yield_review_only' });
  }
  return Object.freeze({ lane: 'pr_parallel', waive_gate: false, reason: 'balanced_cost_risk_yield' });
}
