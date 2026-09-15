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
