export function createRegressionCandidate({ defect = {} } = {}) {
  if (!defect.id || !defect.fingerprint) throw new Error('escaped defect id and fingerprint are required');
  return Object.freeze({
    fingerprint: 'powerhouse-quality-regression-candidate-v1',
    defect_id: defect.id,
    defect_fingerprint: defect.fingerprint,
    surface_id: defect.surface_id || null,
    source_evidence: defect.evidence || null,
    state: 'CANDIDATE',
    deterministic_reproduction_required: true,
    catches_original_defect_required: true,
    learning_authority: 'BRAIN-CLOSED-LOOP-v1',
    auto_promote: false,
  });
}

export function evaluateRegressionCandidate(candidate = {}, proof = {}) {
  if (candidate.state !== 'CANDIDATE') return Object.freeze({ ...candidate, state: 'REJECTED', reason: 'invalid_candidate_state' });
  if (proof.catches_original_defect !== true) return Object.freeze({ ...candidate, state: 'REJECTED', reason: 'does_not_catch_original_defect' });
  if (proof.deterministic !== true) return Object.freeze({ ...candidate, state: 'REJECTED', reason: 'not_deterministic' });
  return Object.freeze({
    ...candidate,
    state: 'PROVEN_REGRESSION',
    proof: {
      catches_original_defect: true,
      deterministic: true,
      evidence: proof.evidence || null,
      candidate_sha: proof.candidate_sha || null,
    },
  });
}
