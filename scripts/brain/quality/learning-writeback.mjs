const CANONICAL_TARGETS = Object.freeze({
  learning_router: '7136176',
  outcome_audit: '7136188',
  context_retrieval: '7136196',
});

function clean(value) {
  return String(value ?? '').trim();
}

function requireProvenRegression(candidate = {}) {
  if (candidate.state !== 'PROVEN_REGRESSION') throw new Error('quality learning requires a PROVEN_REGRESSION candidate');
}

export function buildQualityLearningPayload({ defect = {}, rootCause, preventionRule, regressionCandidate = {} } = {}) {
  if (!defect.id || !defect.fingerprint || !defect.surface_id) throw new Error('defect id, fingerprint and surface_id are required');
  requireProvenRegression(regressionCandidate);
  if (!clean(rootCause) || !clean(preventionRule)) throw new Error('rootCause and preventionRule are required');
  if (regressionCandidate.defect_id && regressionCandidate.defect_id !== defect.id) throw new Error('regression candidate must match escaped defect');

  return Object.freeze({
    fingerprint: 'BRAIN-CLOSED-LOOP-v1',
    source: 'powerhouse-quality',
    event_type: 'escaped_defect_prevention',
    canonical_targets: CANONICAL_TARGETS,
    parallel_learning_store: false,
    defect: Object.freeze({
      id: defect.id,
      fingerprint: defect.fingerprint,
      surface_id: defect.surface_id,
      evidence: defect.evidence || null,
    }),
    root_cause: clean(rootCause),
    prevention_rule: clean(preventionRule),
    prevention_route: 'regression_test',
    regression_candidate: Object.freeze({
      state: regressionCandidate.state,
      defect_id: regressionCandidate.defect_id || defect.id,
      proof: regressionCandidate.proof || null,
    }),
    dedupe_key: `escaped_defect|${defect.surface_id}|add_proven_regression_prevention|powerhouse-quality`,
    required_readback: Object.freeze({
      learning_write_ok: true,
      readback_ok: true,
      new_context_visible: true,
    }),
  });
}

export function evaluateLearningReadback({ learning_write_ok = false, readback_ok = false, new_context_visible = false } = {}) {
  if (learning_write_ok !== true) return Object.freeze({ status: 'WRITEBACK_REQUIRED', learned: false });
  if (readback_ok !== true) return Object.freeze({ status: 'READBACK_REQUIRED', learned: false });
  if (new_context_visible !== true) return Object.freeze({ status: 'CONTEXT_NOT_VISIBLE', learned: false });
  return Object.freeze({ status: 'LEARNED', learned: true });
}

export function prepareQualityLearningWriteback({ payload = {}, callableInterface = null } = {}) {
  if (payload.fingerprint !== 'BRAIN-CLOSED-LOOP-v1') {
    return Object.freeze({ status: 'REJECTED', reason: 'wrong_learning_authority', persisted: false });
  }
  if (typeof callableInterface !== 'function') {
    return Object.freeze({
      status: 'WRITEBACK_REQUIRED',
      reason: 'canonical_learning_runtime_not_callable_in_repository',
      persisted: false,
      canonical_targets: CANONICAL_TARGETS,
    });
  }
  return Object.freeze({
    status: 'READY_FOR_CANONICAL_WRITE',
    persisted: false,
    callableInterface,
    payload,
    canonical_targets: CANONICAL_TARGETS,
  });
}

export { CANONICAL_TARGETS };
