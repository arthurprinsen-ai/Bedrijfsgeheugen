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

export function evaluateBusinessInvariants(input = {}) {
  const violations = [];
  const chain = ['action', 'provider', 'readback', 'outcome', 'learning'];
  for (const stage of chain) if (!input[stage]) violations.push(`chain:${stage}`);
  if (!input.tenant_id || !input.readback_tenant_id) violations.push('tenant_integrity_unknown');
  else if (input.tenant_id !== input.readback_tenant_id) violations.push('tenant_integrity');
  if (!input.idempotency_key) violations.push('idempotency_unknown');
  if (Number(input.duplicate_count ?? 1) > 1) violations.push('idempotency');
  if (input.destination_ok === false || input.identity_ok === false) violations.push('exact_destination_identity');
  if (input.partial_write === true) violations.push('no_partial_success_green');
  return Object.freeze({
    status: violations.length ? 'RED' : 'GREEN',
    violations,
    invariant_chain: chain,
    learning_authority: 'BRAIN-CLOSED-LOOP-v1',
    production_authority: 'BG169',
  });
}
