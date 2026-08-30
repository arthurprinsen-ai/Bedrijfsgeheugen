const TEN_MIB = 10 * 1024 * 1024;

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export function decideSupabasePerformanceAction(finding = {}) {
  const level = String(finding.level ?? 'INFO').toUpperCase();
  const lint = String(finding.lint ?? 'unknown');
  const workload = finding.workload ?? {};

  if (level === 'WARN' || level === 'ERROR') {
    return {
      action: 'INVESTIGATE',
      autoApply: false,
      reason: `${level} findings require verified root-cause evidence before any production mutation.`
    };
  }

  if (lint === 'unused_index') {
    return {
      action: 'OBSERVE',
      autoApply: false,
      reason: 'Unused-index INFO alone is insufficient evidence for a destructive index drop.'
    };
  }

  if (lint === 'unindexed_foreign_keys') {
    const rows = finiteNumber(finding.estimatedRows);
    const bytes = finiteNumber(finding.totalBytes);
    const relevantQueries = finiteNumber(workload.relevantQueries);
    const p95Ms = finiteNumber(workload.p95Ms);

    const scaleEvidence = rows >= 10000 || bytes >= TEN_MIB;
    const workloadEvidence = relevantQueries >= 100 || workload.fkDeletePressure === true || p95Ms >= 100;

    if (scaleEvidence && workloadEvidence) {
      return {
        action: 'CANDIDATE_INDEX',
        autoApply: false,
        reason: 'Scale and workload evidence justify a governed candidate index; production still requires normal BRAIN verification.'
      };
    }

    return {
      action: 'OBSERVE',
      autoApply: false,
      reason: 'The linter INFO lacks sufficient scale and workload evidence to justify index write/storage overhead.'
    };
  }

  return {
    action: 'OBSERVE',
    autoApply: false,
    reason: 'No evidence-backed performance mutation is justified.'
  };
}
