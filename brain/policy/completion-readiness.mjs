const TERMINAL_OBLIGATION_STATUSES = new Set([
  'GREEN',
  'VERIFIED',
  'COMPLETE',
  'COMPLETED',
  'PROVEN',
  'ROLLED_BACK_GREEN'
]);

export function evaluateCompletionReadiness({
  localGreen = false,
  materialObligations = [],
  hardBoundary = null
} = {}) {
  const obligations = Array.isArray(materialObligations) ? materialObligations : [];
  const openObligations = obligations
    .filter(obligation => !TERMINAL_OBLIGATION_STATUSES.has(String(obligation?.status || '').toUpperCase()))
    .map((obligation, index) => obligation?.id || `obligation-${index + 1}`);

  const hardBoundaryProven = hardBoundary?.present === true
    && hardBoundary?.proven === true
    && typeof hardBoundary?.evidence === 'string'
    && hardBoundary.evidence.trim().length > 0;

  if (hardBoundaryProven) {
    return Object.freeze({
      canComplete: true,
      state: 'HARD_BOUNDARY',
      openObligations: Object.freeze(openObligations),
      evidence: hardBoundary.evidence
    });
  }

  if (localGreen === true && openObligations.length === 0) {
    return Object.freeze({
      canComplete: true,
      state: 'COMPLETE',
      openObligations: Object.freeze([])
    });
  }

  return Object.freeze({
    canComplete: false,
    state: 'CONTINUE',
    openObligations: Object.freeze(openObligations)
  });
}
