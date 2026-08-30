const TEN_MIB = 10 * 1024 * 1024;

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export function buildPerformanceEvidenceSnapshot(finding = {}) {
  const workload = finding.workload ?? {};
  const lint = String(finding.lint ?? 'unknown');
  const schema = String(finding.schema ?? 'unknown');
  const table = String(finding.table ?? 'unknown');
  const findingName = String(finding.findingName ?? finding.name ?? 'unknown');

  return {
    findingKey: [lint, schema, table, findingName].join('|'),
    measuredAt: String(finding.observedAt ?? new Date().toISOString()),
    measurement: {
      estimatedRows: finiteNumber(finding.estimatedRows),
      totalBytes: finiteNumber(finding.totalBytes),
      relevantQueries: finiteNumber(workload.relevantQueries),
      fkDeletePressure: workload.fkDeletePressure === true,
      p95Ms: Number.isFinite(workload.p95Ms) ? workload.p95Ms : null,
    },
  };
}

function hasStrongIndexEvidence(observation = {}) {
  const workload = observation.workload ?? {};
  const rows = finiteNumber(observation.estimatedRows);
  const bytes = finiteNumber(observation.totalBytes);
  const scaleEvidence = rows >= 10000 || bytes >= TEN_MIB;
  const workloadEvidence = finiteNumber(workload.relevantQueries) >= 100
    || workload.fkDeletePressure === true
    || finiteNumber(workload.p95Ms) >= 100;
  return scaleEvidence && workloadEvidence;
}

export function decidePerformanceTrendAction({ lint = 'unknown', observations = [] } = {}) {
  const requiredConsecutiveEvidence = 2;
  if (lint !== 'unindexed_foreign_keys') {
    return {
      action: 'OBSERVE',
      autoApply: false,
      requiredConsecutiveEvidence,
      reason: 'No repeated evidence-backed performance mutation is justified.',
    };
  }

  const recent = observations.slice(-requiredConsecutiveEvidence);
  if (recent.length < requiredConsecutiveEvidence || !recent.every(hasStrongIndexEvidence)) {
    return {
      action: 'OBSERVE',
      autoApply: false,
      requiredConsecutiveEvidence,
      reason: 'Repeated consecutive scale and workload evidence is required before proposing an index candidate.',
    };
  }

  return {
    action: 'CANDIDATE_INDEX',
    autoApply: false,
    requiredConsecutiveEvidence,
    reason: 'Two consecutive measurements contain sufficient scale and workload evidence; create only a governed candidate index through normal BRAIN verification.',
  };
}

export function evaluatePerformanceOutcome({ before = {}, after = {} } = {}) {
  const beforeP95 = finiteNumber(before.p95Ms);
  const afterP95 = finiteNumber(after.p95Ms);
  const rawImprovementPct = beforeP95 > 0 ? ((beforeP95 - afterP95) / beforeP95) * 100 : 0;
  const p95ImprovementPct = Math.round(rawImprovementPct * 100) / 100;

  if (p95ImprovementPct >= 10) {
    return {
      state: 'VERIFIED_IMPROVEMENT',
      positiveLearning: true,
      autoRollback: false,
      p95ImprovementPct,
    };
  }

  return {
    state: 'NO_MEASURABLE_BENEFIT',
    positiveLearning: false,
    autoRollback: false,
    p95ImprovementPct,
  };
}
