const TERMINAL_OBLIGATION_STATUSES = new Set([
  'GREEN',
  'VERIFIED',
  'COMPLETE',
  'COMPLETED',
  'PROVEN',
  'ROLLED_BACK_GREEN'
]);

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasTrustedCompletionEvidence(evidence) {
  return evidence?.trusted === true
    && evidence?.identityBound === true
    && nonEmptyString(evidence?.candidateIdentity)
    && nonEmptyString(evidence?.productionIdentity)
    && nonEmptyString(evidence?.readbackIdentity)
    && evidence?.functionalReadback === true
    && evidence?.learningWriteback === true
    && evidence?.capabilityHandoff === true;
}

export function evaluateCompletionReadiness({
  materialObligations = [],
  hardBoundary = null,
  completionEvidence = null
} = {}) {
  const obligations = Array.isArray(materialObligations) ? materialObligations : [];
  const openObligations = obligations
    .filter(obligation => !TERMINAL_OBLIGATION_STATUSES.has(String(obligation?.status || '').toUpperCase()))
    .map((obligation, index) => obligation?.id || `obligation-${index + 1}`);

  const hardBoundaryProven = hardBoundary?.present === true
    && hardBoundary?.proven === true
    && nonEmptyString(hardBoundary?.evidence);

  if (hardBoundaryProven) {
    return Object.freeze({
      canComplete: false,
      canWait: true,
      state: 'HARD_BOUNDARY',
      openObligations: Object.freeze(openObligations),
      requiredEvidence: Object.freeze(['completionEvidence']),
      evidence: hardBoundary.evidence
    });
  }

  if (openObligations.length === 0 && hasTrustedCompletionEvidence(completionEvidence)) {
    return Object.freeze({
      canComplete: true,
      canWait: false,
      state: 'LIVE_VERIFIED',
      openObligations: Object.freeze([]),
      requiredEvidence: Object.freeze([])
    });
  }

  return Object.freeze({
    canComplete: false,
    canWait: false,
    state: 'CONTINUE',
    openObligations: Object.freeze(openObligations),
    requiredEvidence: Object.freeze(['completionEvidence'])
  });
}
