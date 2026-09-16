const DAY_MS = 86_400_000;

export const CLASSIFICATIONS = Object.freeze({
  CURRENT_DEFECT: 'CURRENT_DEFECT',
  CURRENT_EXTERNAL_BOUNDARY: 'CURRENT_EXTERNAL_BOUNDARY',
  PROVEN_FIXED: 'PROVEN_FIXED',
  SYNTHETIC_TEST_STATE: 'SYNTHETIC_TEST_STATE',
  SUPERSEDED: 'SUPERSEDED',
  RETIRED_DEPENDENCY: 'RETIRED_DEPENDENCY',
  EVIDENCE_MISSING: 'EVIDENCE_MISSING',
});

const MATERIAL = new Set([
  CLASSIFICATIONS.CURRENT_DEFECT,
  CLASSIFICATIONS.CURRENT_EXTERNAL_BOUNDARY,
  CLASSIFICATIONS.EVIDENCE_MISSING,
]);

function validTimestamp(value) {
  const ms = Date.parse(value ?? '');
  return Number.isFinite(ms) ? ms : null;
}

function result(classification, reason, observation = {}) {
  return Object.freeze({
    classification,
    material: MATERIAL.has(classification),
    reason,
    observed_at: observation.observed_at ?? null,
    provenance: Array.isArray(observation.provenance) ? observation.provenance : [],
  });
}

export function classifyClaim(claim = {}, observation = {}) {
  const synthetic = claim?.evidence?.synthetic === true || claim?.synthetic === true;
  const syntheticScope = typeof claim?.scope === 'string' && claim.scope.startsWith('synthetic:');
  if (synthetic && syntheticScope) {
    return result(CLASSIFICATIONS.SYNTHETIC_TEST_STATE, 'explicit_synthetic_test_evidence', observation);
  }

  if (observation?.dependency_retired === true) {
    return result(CLASSIFICATIONS.RETIRED_DEPENDENCY, 'dependency_retired_with_canonical_replacement', observation);
  }

  if (observation?.superseded === true) {
    return result(CLASSIFICATIONS.SUPERSEDED, 'claim_superseded_by_current_authority', observation);
  }

  if (observation?.external_boundary === true) {
    return result(CLASSIFICATIONS.CURRENT_EXTERNAL_BOUNDARY, observation.error || 'current_external_boundary', observation);
  }

  if (observation?.current_defect === true) {
    return result(CLASSIFICATIONS.CURRENT_DEFECT, observation.error || 'current_defect', observation);
  }

  if (observation?.contradicts_claim === true && validTimestamp(observation.observed_at) !== null) {
    return result(CLASSIFICATIONS.PROVEN_FIXED, 'fresh_authority_contradicts_open_claim', observation);
  }

  if (observation?.proves_fixed === true && validTimestamp(observation.observed_at) !== null) {
    return result(CLASSIFICATIONS.PROVEN_FIXED, 'fresh_authority_proves_fixed', observation);
  }

  return result(CLASSIFICATIONS.EVIDENCE_MISSING, 'fresh_authority_evidence_missing', observation);
}

export function evaluateAssurance({ now = new Date().toISOString(), max_age_days = 90, required_domains = [], evidence = [] } = {}) {
  const nowMs = validTimestamp(now);
  if (nowMs === null) throw new TypeError('now must be an ISO timestamp');
  const latest = new Map();
  for (const item of evidence) {
    const observedMs = validTimestamp(item?.observed_at);
    if (!item?.domain || observedMs === null) continue;
    const previous = latest.get(item.domain);
    if (!previous || observedMs > previous.observedMs) latest.set(item.domain, { item, observedMs });
  }

  const domains = {};
  const blocking = [];
  for (const domain of required_domains) {
    const found = latest.get(domain);
    if (!found) {
      domains[domain] = { status: 'missing', success: false, age_days: null };
      blocking.push(domain);
      continue;
    }
    const ageDays = Math.max(0, (nowMs - found.observedMs) / DAY_MS);
    const fresh = ageDays <= max_age_days;
    const success = found.item.success === true;
    const proven = fresh && success;
    domains[domain] = {
      status: proven ? 'proven' : success ? 'stale' : 'failed',
      success,
      age_days: ageDays,
      evidence: found.item,
    };
    if (!proven) blocking.push(domain);
  }

  return Object.freeze({
    proven: required_domains.length > 0 && blocking.length === 0,
    blocking_domains: blocking.sort(),
    domains,
    max_age_days,
    rule: 'fresh_successful_evidence_required',
  });
}

export function evaluateBusinessOutcomeLoop(lineage = {}) {
  if (lineage.synthetic === true) {
    return Object.freeze({ proven: false, reason: 'synthetic_lineage_not_accepted' });
  }

  const { decision, action, provider_outcome: outcome, impact, calibration, next_decision: nextDecision } = lineage;
  const productionNodes = [decision, action, outcome, impact, calibration, nextDecision];
  if (productionNodes.some(node => node?.production !== true)) {
    return Object.freeze({ proven: false, reason: 'production_lineage_incomplete' });
  }
  if (!decision?.id || !action?.id || action.decision_id !== decision.id) {
    return Object.freeze({ proven: false, reason: 'decision_action_link_missing' });
  }
  if (!outcome?.id || outcome.action_id !== action.id) {
    return Object.freeze({ proven: false, reason: 'provider_outcome_link_missing' });
  }
  if (impact?.provider_outcome_id !== outcome.id) {
    return Object.freeze({ proven: false, reason: 'business_impact_link_missing' });
  }
  if (calibration?.impact_id !== outcome.id) {
    return Object.freeze({ proven: false, reason: 'calibration_link_missing' });
  }
  if (nextDecision?.calibration_applied !== true || nextDecision?.changed_by_calibration !== true) {
    return Object.freeze({ proven: false, reason: 'next_decision_not_changed_by_calibration' });
  }
  return Object.freeze({ proven: true, reason: 'real_production_closed_loop_proven' });
}

export function evaluateMaterialClosure({ claims = [], assurance = {}, provider_readback = {}, whole_brain = {}, business_outcome_loop = {} } = {}) {
  const materialClaims = claims.filter(claim => claim?.material === true || MATERIAL.has(claim?.classification));
  const laneFailures = [];
  if (assurance?.proven !== true) laneFailures.push('operations_assurance');
  if (provider_readback?.proven !== true) laneFailures.push('provider_readback');
  if (whole_brain?.proven !== true) laneFailures.push('whole_brain');
  if (business_outcome_loop?.proven !== true) laneFailures.push('business_outcome_loop');

  const live = materialClaims.length === 0 && laneFailures.length === 0;
  return Object.freeze({
    status: live ? 'LIVE_BEWEZEN' : 'DEELS_LIVE',
    material_blockers: materialClaims.length,
    lane_failures: laneFailures,
    material_classifications: materialClaims.map(item => item.classification ?? 'UNKNOWN'),
    rule: 'zero_material_claims_and_all_required_proof_lanes',
  });
}

export function classifyRlsNoPolicyTable({ anon = {}, authenticated = {}, service_role = {} } = {}) {
  const mutating = ['INSERT', 'UPDATE', 'DELETE'];
  const anonAccess = ['SELECT', ...mutating].some(priv => anon?.[priv] === true);
  const authenticatedAccess = ['SELECT', ...mutating].some(priv => authenticated?.[priv] === true);
  if (!anonAccess && !authenticatedAccess) {
    return Object.freeze({ classification: 'INTENTIONAL_DENY_BY_DEFAULT', material: false, service_role_only: Object.values(service_role).some(Boolean) });
  }
  return Object.freeze({ classification: 'CLIENT_ACCESS_REQUIRES_POLICY_REVIEW', material: true, service_role_only: false });
}

export function buildReconciliationEvidence({ classification, authority, observed_at, facts = {}, replaces = [] } = {}) {
  if (!Object.values(CLASSIFICATIONS).includes(classification)) throw new RangeError(`Unsupported classification: ${classification}`);
  if (!authority) throw new TypeError('authority is required');
  if (validTimestamp(observed_at) === null) throw new TypeError('observed_at must be an ISO timestamp');
  return Object.freeze({
    fingerprint: 'powerhouse-canonical-truth-closure-v1',
    classification,
    material: MATERIAL.has(classification),
    authority,
    observed_at,
    facts,
    replaces,
    make_recovery_allowed: false,
  });
}

export function runSelfTest() {
  const synthetic = classifyClaim({ scope: 'synthetic:x', evidence: { synthetic: true } }, { observed_at: '2026-09-16T00:00:00Z' });
  const blocked = classifyClaim({}, { observed_at: '2026-09-16T00:00:00Z', external_boundary: true });
  const closure = evaluateMaterialClosure({
    claims: [synthetic],
    assurance: { proven: true },
    provider_readback: { proven: true },
    whole_brain: { proven: true },
    business_outcome_loop: { proven: true },
  });
  return { ok: synthetic.material === false && blocked.material === true && closure.status === 'LIVE_BEWEZEN' };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runSelfTest();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}
