const REQUIRED = ['defect_yield', 'false_positive_rate', 'runtime_ms', 'cost', 'reproducibility', 'security_fit'];
const complete = candidate => REQUIRED.every(key => candidate?.[key] !== undefined && candidate?.[key] !== null);
const finiteNonNegative = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const validMetrics = values =>
  finiteNonNegative(values.defect_yield) &&
  finiteNonNegative(values.false_positive_rate) && values.false_positive_rate <= 1 &&
  finiteNonNegative(values.runtime_ms) &&
  finiteNonNegative(values.cost) &&
  finiteNonNegative(values.reproducibility) && values.reproducibility <= 1 &&
  typeof values.security_fit === 'boolean';
// Benchmark comparison alone never authorizes production promotion or model adoption.
const advisory = (decision, reasons) => ({
  decision, reasons, promotion_authorized: false, benchmark_advisory_only: true
});

export function evaluateInnovationBenchmark({ incumbent = {}, candidate = {} } = {}) {
  if (!complete(incumbent) || !complete(candidate)) return advisory('INSUFFICIENT_EVIDENCE', ['benchmark_dimensions_incomplete']);
  if (!validMetrics(incumbent) || !validMetrics(candidate)) return advisory('INSUFFICIENT_EVIDENCE', ['benchmark_values_invalid']);
  if (incumbent.security_fit !== true) return advisory('INSUFFICIENT_EVIDENCE', ['incumbent_security_baseline_unproven']);
  if (candidate.security_fit !== true) return advisory('REJECT', ['security_fit_regression']);
  const improvesYield = candidate.defect_yield > incumbent.defect_yield;
  const noFpRegression = candidate.false_positive_rate <= incumbent.false_positive_rate;
  const noRuntimeRegression = candidate.runtime_ms <= incumbent.runtime_ms * 1.1;
  const noCostRegression = candidate.cost <= incumbent.cost * 1.1;
  const reproducible = candidate.reproducibility >= Math.max(0.9, incumbent.reproducibility - 0.02);
  const reasons = [];
  if (!improvesYield) reasons.push('defect_yield_not_improved');
  if (!noFpRegression) reasons.push('false_positive_rate_regressed');
  if (!noRuntimeRegression) reasons.push('runtime_regressed');
  if (!noCostRegression) reasons.push('cost_regressed');
  if (!reproducible) reasons.push('reproducibility_insufficient');
  return advisory(reasons.length ? 'REJECT' : 'ADOPT', reasons);
}
