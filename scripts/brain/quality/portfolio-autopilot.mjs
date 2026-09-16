export function recommendPortfolioAction(test = {}) {
  if (test.critical === true) return Object.freeze({ id: test.id || null, action: 'KEEP_PROTECTED', auto_delete: false, reason: 'critical_control' });
  switch (test.classification) {
    case 'FLAKY': return Object.freeze({ id: test.id || null, action: 'REPAIR_FLAKE', auto_delete: false, reason: 'unstable_signal' });
    case 'MISSED_ESCAPED_DEFECT': return Object.freeze({ id: test.id || null, action: 'STRENGTHEN_OR_REPLACE', auto_delete: false, reason: 'escaped_defect_missed' });
    case 'HIGH_VALUE': return Object.freeze({ id: test.id || null, action: 'KEEP', auto_delete: false, reason: 'proven_defect_yield' });
    case 'LOW_OBSERVED_YIELD': return Object.freeze({ id: test.id || null, action: 'REVIEW_VALUE', auto_delete: false, reason: 'low_observed_yield_requires_human_or_benchmark_review' });
    default: return Object.freeze({ id: test.id || null, action: 'GATHER_MORE_EVIDENCE', auto_delete: false, reason: 'insufficient_evidence' });
  }
}

export function buildPortfolioPlan(tests = []) {
  return Object.freeze({
    fingerprint: 'powerhouse-quality-portfolio-autopilot-v1',
    recommendations: tests.map(recommendPortfolioAction),
    auto_deletions: [],
    critical_auto_removal_forbidden: true,
  });
}
