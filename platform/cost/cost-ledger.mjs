import { createHash } from 'node:crypto';

const CUMULATIVE_FIELDS = ['creditsTotal', 'operationsTotal', 'dataTransferTotal'];

function finiteNonNegative(value, field) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0) throw new TypeError(`${field} must be non-negative`);
  return number;
}

function stableHash(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function delta(current, previous) {
  if (previous === undefined) return current;
  return current >= previous ? current - previous : current;
}

export function createCostSnapshot({ sampledAt, components = [], previous = null } = {}) {
  const sampledDate = new Date(sampledAt);
  if (!Number.isFinite(sampledDate.getTime())) throw new TypeError('valid sampledAt is required');

  const previousByKey = new Map((previous?.components ?? []).map(row => [row.componentKey, row]));
  const seen = new Set();
  const sanitized = components.map(row => {
    const componentKey = String(row?.componentKey ?? '').trim();
    if (!componentKey) throw new TypeError('componentKey is required');
    if (seen.has(componentKey)) throw new Error(`duplicate component key: ${componentKey}`);
    seen.add(componentKey);

    const current = Object.fromEntries(CUMULATIVE_FIELDS.map(field => [field, finiteNonNegative(row[field], field)]));
    const prior = previousByKey.get(componentKey);
    const priorCounters = prior
      ? Object.fromEntries(CUMULATIVE_FIELDS.map(field => [field, finiteNonNegative(prior[field], field)]))
      : {};
    const verifiedOutcomes = finiteNonNegative(row.verifiedOutcomes, 'verifiedOutcomes');
    const latencyMs = finiteNonNegative(row.latencyMs, 'latencyMs');
    const creditsDelta = delta(current.creditsTotal, priorCounters.creditsTotal);
    const operationsDelta = delta(current.operationsTotal, priorCounters.operationsTotal);
    const dataTransferDelta = delta(current.dataTransferTotal, priorCounters.dataTransferTotal);
    const counterReset = Boolean(prior && CUMULATIVE_FIELDS.some(field => current[field] < priorCounters[field]));

    return Object.freeze({
      componentKey,
      ...current,
      verifiedOutcomes,
      latencyMs,
      creditsDelta,
      operationsDelta,
      dataTransferDelta,
      creditsPerVerifiedOutcome: verifiedOutcomes > 0 ? creditsDelta / verifiedOutcomes : null,
      latencyMsPerVerifiedOutcome: verifiedOutcomes > 0 ? latencyMs / verifiedOutcomes : null,
      counterReset,
    });
  }).sort((left, right) => left.componentKey.localeCompare(right.componentKey));

  const changedComponentIds = sanitized
    .filter(row => row.creditsDelta !== 0 || row.operationsDelta !== 0 || row.dataTransferDelta !== 0 || row.counterReset)
    .map(row => row.componentKey);
  const totals = Object.freeze(sanitized.reduce((sum, row) => ({
    creditsTotal: sum.creditsTotal + row.creditsTotal,
    operationsTotal: sum.operationsTotal + row.operationsTotal,
    dataTransferTotal: sum.dataTransferTotal + row.dataTransferTotal,
    creditsDelta: sum.creditsDelta + row.creditsDelta,
    operationsDelta: sum.operationsDelta + row.operationsDelta,
    dataTransferDelta: sum.dataTransferDelta + row.dataTransferDelta,
    verifiedOutcomes: sum.verifiedOutcomes + row.verifiedOutcomes,
  }), {
    creditsTotal: 0,
    operationsTotal: 0,
    dataTransferTotal: 0,
    creditsDelta: 0,
    operationsDelta: 0,
    dataTransferDelta: 0,
    verifiedOutcomes: 0,
  }));

  const fingerprintRows = sanitized.map(({ componentKey, creditsTotal, operationsTotal, dataTransferTotal, verifiedOutcomes, latencyMs }) => ({
    componentKey,
    creditsTotal,
    operationsTotal,
    dataTransferTotal,
    verifiedOutcomes,
    latencyMs,
  }));
  return Object.freeze({
    sampledAt: sampledDate.toISOString(),
    totals,
    components: Object.freeze(sanitized),
    fingerprint: stableHash(fingerprintRows),
    changedComponentIds: Object.freeze(changedComponentIds),
  });
}
