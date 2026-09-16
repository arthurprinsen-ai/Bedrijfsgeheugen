export function recommendLane(t={}) {
  if (t.critical===true || ['critical','high'].includes(t.risk)) return Object.freeze({lane:'required',reason:'risk_fail_closed'});
  if (t.risk==='unknown' || t.defect_yield==null) return Object.freeze({lane:'required',reason:'unknown_is_not_zero_risk'});
  if ((t.runtime_ms??0)>120000 && (t.defect_yield??0)<0.05) return Object.freeze({lane:'scheduled',reason:'expensive_low_observed_yield'});
  return Object.freeze({lane:'pr_parallel',reason:'bounded_feedback'});
}
