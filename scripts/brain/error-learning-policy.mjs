export const REQUIRED_LEARNING_FIELDS = Object.freeze([
  'detected_at',
  'evidence',
  'impact',
  'root_cause',
  'corrective_action',
  'regression_test',
  'prevention_rule',
  'production_readback',
  'outcome',
  'writeback_lineage',
]);

/**
 * Release truth is fail-closed.
 * A hosting provider reporting `ready` proves only that a deploy completed.
 * It does not prove that production is reachable, correct, or serving the expected commit.
 */
export function classifyRelease({ deployState, expectedCommit, productionReadback }) {
  if (deployState !== 'ready') return 'not-deployed';
  if (!productionReadback) return 'deployed-not-verified';

  const httpOk =
    productionReadback.ok === true &&
    Number.isInteger(productionReadback.httpStatus) &&
    productionReadback.httpStatus >= 200 &&
    productionReadback.httpStatus < 400;

  if (!httpOk) return 'verification-failed';

  if (
    expectedCommit &&
    productionReadback.commit &&
    productionReadback.commit !== expectedCommit
  ) {
    return 'verification-failed';
  }

  if (expectedCommit && !productionReadback.commit) {
    return 'deployed-not-verified';
  }

  return 'live-verified';
}

/**
 * Material failures are only considered learned when the complete closed loop
 * is present. Empty strings/null/undefined do not satisfy the contract.
 */
export function validateIncidentLearning(record = {}) {
  const missing = REQUIRED_LEARNING_FIELDS.filter((field) => {
    const value = record[field];
    return value === undefined || value === null || String(value).trim() === '';
  });

  return { ok: missing.length === 0, missing };
}

export function assertIncidentLearned(record = {}) {
  const validation = validateIncidentLearning(record);
  if (!validation.ok) {
    throw new Error(`Incomplete incident learning loop: ${validation.missing.join(', ')}`);
  }
  return record;
}
