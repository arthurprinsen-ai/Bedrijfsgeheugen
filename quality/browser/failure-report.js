function interactionFailure({ contractId, route, viewport, failureClass, originalFailureClass = null, expected = null, found = null, evidence = null }) {
  return { contractId, route, viewport, failureClass, originalFailureClass, expected, found, evidence, timestamp: new Date().toISOString() };
}

function wrapFailure(error, context) {
  const originalFailureClass = error.failureClass || context.failureClass || 'interaction-no-op';
  const production = process.env.INTERACTION_ENVIRONMENT === 'production';
  const report = interactionFailure({
    ...context,
    failureClass: production ? 'preview-production-drift' : originalFailureClass,
    originalFailureClass: production ? originalFailureClass : null,
    evidence: error.evidence || context.evidence || null,
  });
  error.interactionReport = report;
  return error;
}

module.exports = { interactionFailure, wrapFailure };
