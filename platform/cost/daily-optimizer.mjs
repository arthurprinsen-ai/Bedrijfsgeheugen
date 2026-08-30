function score(candidate) {
  return Number(candidate.expectedSavings) * Number(candidate.confidence) * Number(candidate.reusability ?? 1)
    / Math.max(1, Number(candidate.implementationCost ?? 1));
}

export function selectDailyCandidate({ alreadyStartedToday = 0, candidates = [] } = {}) {
  if (Number(alreadyStartedToday) >= 1) {
    return Object.freeze({ decision: 'NO_SAFE_CANDIDATE', reason: 'DAILY_EXPERIMENT_LIMIT' });
  }

  const eligible = candidates
    .filter(candidate =>
      candidate?.id
      && Array.isArray(candidate.evidence)
      && candidate.evidence.length > 0
      && candidate.reversible === true
      && Number(candidate.risk) <= 2
      && Number(candidate.expectedSavings) > 0
      && Number(candidate.confidence) > 0
    )
    .map(candidate => ({ candidate, score: score(candidate) }))
    .filter(({ score: candidateScore }) => Number.isFinite(candidateScore) && candidateScore > 0)
    .sort((left, right) => right.score - left.score || String(left.candidate.id).localeCompare(String(right.candidate.id)));

  if (!eligible.length) {
    return Object.freeze({ decision: 'NO_SAFE_CANDIDATE', reason: 'NO_REVERSIBLE_EVIDENCE_BACKED_SAVING' });
  }
  const selected = eligible[0];
  return Object.freeze({
    decision: 'SELECT',
    id: String(selected.candidate.id),
    score: selected.score,
    expectedSavings: Number(selected.candidate.expectedSavings),
    evidence: Object.freeze([...selected.candidate.evidence]),
  });
}

export function evaluateExperiment({ before = {}, after = {}, regressionPassed, protectedMetricsGreen } = {}) {
  const failedConditions = [];
  const beforeCredits = Number(before.creditsPerVerifiedOutcome);
  const afterCredits = Number(after.creditsPerVerifiedOutcome);
  const beforeLatency = Number(before.latencyMsPerVerifiedOutcome);
  const afterLatency = Number(after.latencyMsPerVerifiedOutcome);

  if (regressionPassed !== true) failedConditions.push('REGRESSION_FAILED');
  if (protectedMetricsGreen !== true) failedConditions.push('PROTECTED_METRIC_REGRESSION');
  if (!Number.isFinite(beforeCredits) || !Number.isFinite(afterCredits) || !(afterCredits < beforeCredits)) {
    failedConditions.push('NO_NORMALIZED_CREDIT_SAVING');
  }
  if (Number.isFinite(beforeLatency) && beforeLatency >= 0 && Number.isFinite(afterLatency) && afterLatency > beforeLatency * 1.10) {
    failedConditions.push('LATENCY_REGRESSION');
  }

  return Object.freeze({
    decision: failedConditions.length === 0 ? 'KEEP' : 'ROLLBACK',
    failedConditions: Object.freeze(failedConditions),
  });
}
