export function normalizeShadowObservation(input = {}) {
  const hasEvidence = Boolean(input.evidence);
  const contractKnown = typeof input.contract_ok === 'boolean';
  const sloKnown = typeof input.slo_ok === 'boolean';
  if (!hasEvidence || (!contractKnown && !sloKnown)) {
    return Object.freeze({ surface_id: input.surface_id ?? null, state: 'UNKNOWN', evidence: input.evidence ?? null, obligation: null });
  }
  const drift = input.contract_ok === false || input.slo_ok === false;
  return Object.freeze({
    surface_id: input.surface_id ?? null,
    state: drift ? 'RED' : 'GREEN',
    evidence: input.evidence,
    obligation: drift ? {
      type: 'escaped_defect',
      surface_id: input.surface_id ?? null,
      root_cause_required: true,
      regression_test_required: true,
      prevention_rule_required: true,
      learning_authority: 'BRAIN-CLOSED-LOOP-v1',
      production_authority: 'BG169',
    } : null,
  });
}
