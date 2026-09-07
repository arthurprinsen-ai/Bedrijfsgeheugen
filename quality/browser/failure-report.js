function interactionFailure({ contractId, route, viewport, failureClass, expected = null, found = null, evidence = null }) {
  return {
    contractId,
    route,
    viewport,
    failureClass,
    expected,
    found,
    evidence,
    timestamp: new Date().toISOString(),
  };
}

function wrapFailure(error, context) {
  const report = interactionFailure({
    ...context,
    failureClass: error.failureClass || context.failureClass || 'interaction-no-op',
    evidence: error.evidence || context.evidence || null,
  });
  error.interactionReport = report;
  return error;
}

module.exports = { interactionFailure, wrapFailure };
