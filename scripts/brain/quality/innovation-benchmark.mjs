const REQUIRED = ['defect_yield', 'false_positive_rate', 'runtime_ms', 'cost', 'reproducibility', 'security_fit'];
const complete = candidate => REQUIRED.every(key => candidate?.[key] !== undefined && candidate?.[key] !== null);

export function evaluateInnovationBenchmark({ incumbent = {}, candidate = {} } = {}) {
  if (!complete(incumbent) || !complete(candidate)) return { decision: 'INSUFFICIENT_EVIDENCE', reasons: ['benchmark_dimensions_incomplete'] };
  if (candidate.security_fit !== true) return { decision: 'REJECT', reasons: ['security_fit_regression'] };
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
  return { decision: reasons.length ? 'REJECT' : 'ADOPT', reasons };
}
