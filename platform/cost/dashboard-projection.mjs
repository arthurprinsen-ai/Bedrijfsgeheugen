const COMPONENT_FIELDS = [
  'componentKey', 'name', 'kind', 'active', 'costClass', 'classificationState', 'runDecision',
  'creditsDelta', 'operationsDelta', 'dataTransferDelta', 'creditsPerVerifiedOutcome',
  'latencyMsPerVerifiedOutcome', 'verifiedOutcomes', 'state',
];
const BUDGET_FIELDS = ['monthlyLimit', 'usedCredits', 'remainingCredits', 'dailyAllowance', 'paceRatio', 'state', 'decision'];

function select(source, fields) {
  const target = {};
  for (const field of fields) {
    const value = source?.[field];
    if (['string', 'number', 'boolean'].includes(typeof value) || value === null) target[field] = value;
  }
  return Object.freeze(target);
}

function safeRows(rows, fields = COMPONENT_FIELDS, limit = 1_000) {
  return Object.freeze((Array.isArray(rows) ? rows : []).slice(0, limit).map(row => select(row, fields)));
}

export function createDashboardProjection(record = {}, { now = () => new Date().toISOString(), maxAgeMs = 15 * 60 * 1_000 } = {}) {
  const sampledAt = new Date(record.sourceUpdatedAt ?? record.sampledAt ?? '');
  const currentTime = new Date(now());
  const validTime = Number.isFinite(sampledAt.getTime()) && Number.isFinite(currentTime.getTime());
  const ageMs = validTime ? Math.max(0, currentTime.getTime() - sampledAt.getTime()) : null;
  const quality = record.contradicted === true || record.quarantined === true ? 'QUARANTINED' : 'VERIFIED';
  const freshness = quality === 'QUARANTINED'
    ? 'QUARANTINED'
    : ageMs === null || ageMs > maxAgeMs
      ? 'STALE'
      : 'CURRENT';

  return Object.freeze({
    schemaVersion: 1,
    sourceUpdatedAt: validTime ? sampledAt.toISOString() : null,
    generatedAt: currentTime.toISOString(),
    freshness,
    quality,
    current: freshness === 'CURRENT' && quality === 'VERIFIED',
    budget: select(record.budget, BUDGET_FIELDS),
    totals: select(record.totals, ['creditsTotal', 'creditsDelta', 'operationsTotal', 'operationsDelta', 'dataTransferTotal', 'dataTransferDelta', 'verifiedOutcomes']),
    components: safeRows(record.components),
    topConsumers: safeRows(record.topConsumers),
    wasteSignals: safeRows(record.wasteSignals, ['componentKey', 'type', 'severity', 'expectedSavings', 'confidence', 'state']),
    savings: safeRows((record.savings ?? []).filter(row => row?.verified === true), ['componentKey', 'creditsSaved', 'operationsSaved', 'latencyMsSaved', 'verified']),
    deferredWork: safeRows(record.deferredWork, ['componentKey', 'name', 'reason', 'runDecision']),
    contract: select(record.contract, ['teamContract', 'brainSchemaVersion', 'bg167Watermark', 'snapshotFingerprint']),
  });
}
