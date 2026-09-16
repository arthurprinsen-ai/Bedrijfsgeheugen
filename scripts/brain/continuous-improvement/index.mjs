import { createHash } from 'node:crypto';

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function uniqueSorted(values = []) {
  return [...new Set(values.map(value => normalizeText(value)).filter(Boolean))].sort();
}

function canonicalIdentity(candidate = {}) {
  return {
    component: normalizeText(candidate.component),
    problemClass: normalizeText(candidate.problemClass),
    evidenceCluster: uniqueSorted(candidate.evidenceCluster),
    changeClass: normalizeText(candidate.changeClass),
    scope: normalizeText(candidate.scope || 'global')
  };
}

export function fingerprintCandidate(candidate) {
  const canonical = JSON.stringify(canonicalIdentity(candidate));
  return createHash('sha256').update(canonical).digest('hex');
}

export function coalesceCandidates(candidates = []) {
  const byFingerprint = new Map();
  let coalesced = 0;
  for (const candidate of candidates) {
    const fingerprint = fingerprintCandidate(candidate);
    if (byFingerprint.has(fingerprint)) {
      coalesced += 1;
      const existing = byFingerprint.get(fingerprint);
      existing.evidenceCluster = uniqueSorted([...(existing.evidenceCluster ?? []), ...(candidate.evidenceCluster ?? [])]);
      continue;
    }
    byFingerprint.set(fingerprint, { ...candidate, fingerprint, evidenceCluster: uniqueSorted(candidate.evidenceCluster) });
  }
  return { candidates: [...byFingerprint.values()], coalesced };
}

export function arbitrateConflict(a = {}, b = {}) {
  const aFingerprint = fingerprintCandidate(a);
  const bFingerprint = fingerprintCandidate(b);
  if (aFingerprint === bFingerprint) return 'COALESCE';
  if (b.supersedesFingerprint === aFingerprint || a.supersedesFingerprint === bFingerprint) return 'SUPERSEDE';
  const sameProblem = normalizeText(a.component) === normalizeText(b.component)
    && normalizeText(a.problemClass) === normalizeText(b.problemClass)
    && normalizeText(a.scope || 'global') === normalizeText(b.scope || 'global');
  if (sameProblem) return 'COMPARE';
  return 'ISOLATE';
}

function hasRollbackIdentity(rollback) {
  return Boolean(rollback?.candidateIdentity && rollback?.lastKnownGoodIdentity);
}

function hasBoundedExperiment(experiment) {
  return Boolean(experiment?.exposure && experiment?.observationWindow && experiment?.rollbackTrigger);
}

export function evaluateCandidate(candidate = {}) {
  const reasons = [];
  const securityEvidence = candidate.criticalEvidence?.security === true;
  const correctnessEvidence = candidate.criticalEvidence?.correctness === true;
  if (!securityEvidence) reasons.push('critical security evidence missing');
  if (!correctnessEvidence) reasons.push('critical correctness evidence missing');
  if (candidate.baselineComparable !== true) reasons.push('baseline and candidate are not comparable');
  if ((candidate.deltas?.security ?? 0) < 0) reasons.push('security non-degradation gate failed');
  if ((candidate.deltas?.correctness ?? 0) < 0) reasons.push('correctness non-degradation gate failed');
  const compensatedRegression = (candidate.deltas?.cost ?? 0) > 0 || (candidate.deltas?.latency ?? 0) > 0;
  if (compensatedRegression && candidate.compensatedBenefitEvidence !== true) reasons.push('cost/latency regression lacks compensated benefit evidence');
  if (candidate.productionPromotion === true && !hasRollbackIdentity(candidate.rollback)) reasons.push('production promotion requires rollback identities');
  if (candidate.businessImpactClaim === true && candidate.businessEvidence !== true) reasons.push('business-impact claim requires business evidence');
  if (reasons.length > 0) return { decision: 'REJECT', reasons };
  if (candidate.nonCriticalEvidenceComplete === false) {
    if (hasBoundedExperiment(candidate.boundedExperiment)) return { decision: 'EXPERIMENT', reasons: ['non-critical evidence incomplete; bounded experiment required'] };
    return { decision: 'REJECT', reasons: ['non-critical evidence incomplete without bounded experiment metadata'] };
  }
  return { decision: 'ALLOW', reasons: [] };
}

export function buildRevalidationDecision(input = {}) {
  if (input.hardBoundary === true) return { state: 'BLOCKED_HARD_BOUNDARY', reasons: ['hard boundary active'] };
  if (input.supersedingVerifiedIdentity) return { state: 'SUPERSEDED', reasons: ['verified superseding identity exists'] };
  const now = input.now instanceof Date ? input.now : new Date(input.now ?? Date.now());
  const revalidateAt = input.revalidateAfter ? new Date(input.revalidateAfter) : null;
  if (revalidateAt && Number.isFinite(revalidateAt.getTime()) && revalidateAt <= now && input.evidenceChanged !== false) {
    return { state: 'CANDIDATE_REQUIRED', reasons: ['revalidation deadline reached and evidence changed or is stale'] };
  }
  return { state: 'CONFIRMED', reasons: [] };
}

export function buildAttribution({ baseline = {}, current = {}, experimentalDesign = null } = {}) {
  const deltas = {};
  for (const [key, baselineValue] of Object.entries(baseline)) {
    const currentValue = current[key];
    if (typeof baselineValue === 'number' && Number.isFinite(baselineValue) && typeof currentValue === 'number' && Number.isFinite(currentValue)) {
      deltas[key] = currentValue - baselineValue;
    }
  }
  const causalClaim = experimentalDesign?.causalIdentification === true;
  return {
    deltas,
    causalClaim,
    limitation: causalClaim ? null : 'Observed deltas are attribution evidence only; causal identification has not been established.'
  };
}
