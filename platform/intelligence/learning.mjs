export function createLearningRecord({ id, tenantId, recommendationId, decisionId = null, actionId = null, changeId = null, expectedImpact, observedImpact, verifiedImpact, confidence, attribution, recordedAt }) {
  for (const field of ['id','tenantId','recommendationId','recordedAt']) if (!arguments[0]?.[field]) throw new TypeError(`${field} is required`);
  if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) throw new TypeError('confidence must be between 0 and 1');
  const predictionError = typeof expectedImpact === 'number' && typeof verifiedImpact === 'number' ? verifiedImpact - expectedImpact : null;
  return Object.freeze({ id, tenantId, type:'Learning', recommendationId, decisionId, actionId, changeId, expectedImpact, observedImpact, verifiedImpact, confidence, attribution:attribution ?? 'Unknown', predictionError, recordedAt });
}

export function valueEfficiency({ verifiedValue, cost }) {
  if (typeof verifiedValue !== 'number' || typeof cost !== 'number' || cost < 0) throw new TypeError('verifiedValue and non-negative cost are required');
  return Object.freeze({ verifiedValue, cost, ratio: cost === 0 ? null : verifiedValue / cost });
}
