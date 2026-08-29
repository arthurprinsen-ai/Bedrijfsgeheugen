export function evaluateProductionPromotion(state, policy = {}) {
  const terminalStates = new Set(policy.terminalStates || [
    'PRODUCTION_GREEN',
    'ROLLED_BACK_GREEN',
    'BLOCKED_HARD_BOUNDARY'
  ]);

  const out = (releaseState, reason, nextAction, extra = {}) => ({
    state: releaseState,
    reason,
    nextAction,
    obligationOpen: !terminalStates.has(releaseState),
    ...extra
  });

  if (state.hardBoundary) {
    return out(
      'BLOCKED_HARD_BOUNDARY',
      state.hardBoundaryReason || 'A declared hard boundary blocks the next safe action.',
      'WAIT_FOR_HARD_BOUNDARY_CLEARANCE'
    );
  }

  if (state.productionRegression) {
    if (!state.lastKnownGoodSha || state.lastKnownGoodSha === state.productionCommitRef) {
      return out(
        'PRODUCTION_RED',
        'Production regressed and no distinct verified last-known-good SHA is available.',
        'VERIFY_LAST_KNOWN_GOOD'
      );
    }
    return out(
      'ROLLING_BACK',
      'Production regression detected; restore the verified last-known-good artifact.',
      'ROLLBACK_TO_LKG',
      { rollbackSha: state.lastKnownGoodSha }
    );
  }

  if (!state.candidateGreen) {
    return out(
      'CANDIDATE_RED',
      'Candidate is not verified green.',
      'REPAIR_CANDIDATE'
    );
  }

  if (!state.candidateEvidenceComplete) {
    return out(
      'CANDIDATE_RED',
      'Candidate acceptance evidence is incomplete.',
      'VERIFY_CANDIDATE'
    );
  }

  if (state.supersededBySha && state.supersededBySha !== state.candidateSha) {
    const explicitlyReconciled = state.mainSha === state.supersededBySha;
    if (!explicitlyReconciled) {
      return out(
        'CANDIDATE_GREEN',
        'Candidate is marked superseded but the superseding SHA is not current main.',
        'VERIFY_SUPERSESSION'
      );
    }
    return out(
      'MAIN_ACCEPTED',
      `Candidate ${state.candidateSha} is explicitly superseded by newer releasable main ${state.supersededBySha}.`,
      'RECONCILE_NEWEST_MAIN',
      {
        obligationOpen: false,
        superseded: true,
        closedBySupersession: true,
        activeSha: state.supersededBySha
      }
    );
  }

  if (!state.candidateSha || !state.mainSha || state.candidateSha !== state.mainSha) {
    return out(
      'PROMOTING_TO_MAIN',
      'The accepted candidate is not yet the current production branch SHA.',
      'PROMOTE_EXACT_CANDIDATE',
      { candidateSha: state.candidateSha, mainSha: state.mainSha }
    );
  }

  const age = Number.isFinite(state.deployAgeSeconds) ? state.deployAgeSeconds : 0;
  const grace = Number.isFinite(policy.graceSeconds) ? policy.graceSeconds : 180;
  const exactProductionSha = Boolean(state.productionCommitRef) && state.productionCommitRef === state.mainSha;

  if (!exactProductionSha) {
    if (age < grace) {
      return out(
        'DEPLOY_PENDING',
        'Production has not yet converged to current main and is still within the deployment grace period.',
        'WAIT_FOR_AUTO_DEPLOY',
        { mainSha: state.mainSha, productionCommitRef: state.productionCommitRef || null }
      );
    }
    return out(
      'DEPLOY_STALE',
      'Production is behind current accepted main beyond the deployment grace period.',
      'TRIGGER_DEPLOY',
      { mainSha: state.mainSha, productionCommitRef: state.productionCommitRef || null }
    );
  }

  if (state.deployState !== 'ready') {
    if (age < grace) {
      return out(
        'DEPLOYING',
        'The exact production SHA is deploying but is not ready yet.',
        'WAIT_FOR_DEPLOY_READY'
      );
    }
    return out(
      'DEPLOY_STALE',
      `The exact production SHA did not reach ready within ${grace} seconds.`,
      'REPAIR_OR_RETRY_DEPLOY'
    );
  }

  if (state.smokePass !== true || state.regressionPass !== true || state.protectedMetricsPass !== true) {
    const missing = [];
    if (state.smokePass !== true) missing.push('smoke');
    if (state.regressionPass !== true) missing.push('regression');
    if (state.protectedMetricsPass !== true) missing.push('protected_metrics');
    return out(
      'VERIFYING_PRODUCTION',
      `Exact production SHA is ready but required outcome evidence is incomplete: ${missing.join(', ')}.`,
      'VERIFY_PRODUCTION_EVIDENCE',
      { missingEvidence: missing }
    );
  }

  return out(
    'PRODUCTION_GREEN',
    'Current main is deployed at the exact production SHA and all required production evidence is green.',
    'PRODUCTION_GREEN',
    {
      obligationOpen: false,
      productionSha: state.productionCommitRef,
      deployState: state.deployState
    }
  );
}

export default evaluateProductionPromotion;
