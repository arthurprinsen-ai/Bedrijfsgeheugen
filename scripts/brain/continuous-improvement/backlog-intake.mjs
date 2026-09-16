import {
  arbitrateConflict,
  buildRevalidationDecision,
  evaluateCandidate,
  fingerprintCandidate
} from './index.mjs';

const VALID_KINDS = new Set(['pull_request', 'obligation', 'dependency']);
const VALID_CLASSIFICATIONS = new Set(['COALESCE', 'COMPARE', 'SUPERSEDED', 'ISOLATE', 'CANDIDATE_REQUIRED']);

function normalizeItem(item = {}) {
  return {
    id: String(item.id ?? ''),
    kind: VALID_KINDS.has(item.kind) ? item.kind : 'obligation',
    component: String(item.component ?? ''),
    problemClass: String(item.problemClass ?? ''),
    evidenceCluster: Array.isArray(item.evidenceCluster) ? item.evidenceCluster : [],
    changeClass: String(item.changeClass ?? item.kind ?? 'unknown'),
    scope: String(item.scope ?? 'global'),
    supersedesFingerprint: item.supersedesFingerprint ?? null,
    stale: item.stale === true,
    retiredAuthority: item.retiredAuthority ?? null,
    replacementAuthority: item.replacementAuthority ?? null,
    criticalEvidence: item.criticalEvidence ?? {},
    baselineComparable: item.baselineComparable,
    deltas: item.deltas ?? {},
    compensatedBenefitEvidence: item.compensatedBenefitEvidence,
    productionPromotion: item.productionPromotion,
    rollback: item.rollback,
    businessImpactClaim: item.businessImpactClaim,
    businessEvidence: item.businessEvidence,
    nonCriticalEvidenceComplete: item.nonCriticalEvidenceComplete,
    boundedExperiment: item.boundedExperiment,
    hardBoundary: item.hardBoundary === true,
    supersedingVerifiedIdentity: item.supersedingVerifiedIdentity ?? null,
    revalidateAfter: item.revalidateAfter ?? null,
    evidenceChanged: item.evidenceChanged,
    metadata: item.metadata ?? {}
  };
}

function classifyPair(item, active) {
  const arbitration = arbitrateConflict(active, item);
  if (arbitration === 'SUPERSEDE') return 'SUPERSEDED';
  return arbitration;
}

export function classifyBacklogItem(rawItem = {}, activeCandidates = [], { now } = {}) {
  const item = normalizeItem(rawItem);
  if (!item.id || !item.component || !item.problemClass) {
    return {
      id: item.id || null,
      kind: item.kind,
      classification: 'CANDIDATE_REQUIRED',
      decision: 'REJECT',
      reasons: ['backlog item lacks canonical identity fields'],
      fingerprint: item.id ? fingerprintCandidate(item) : null,
      fail_closed: true
    };
  }

  if (item.stale && item.retiredAuthority) {
    if (!item.replacementAuthority) {
      return {
        id: item.id,
        kind: item.kind,
        classification: 'CANDIDATE_REQUIRED',
        decision: 'REJECT',
        reasons: [`stale obligation references retired authority ${item.retiredAuthority} without replacement authority`],
        fingerprint: fingerprintCandidate(item),
        fail_closed: true
      };
    }
    return {
      id: item.id,
      kind: item.kind,
      classification: 'SUPERSEDED',
      decision: 'HOLD_RECONCILE',
      reasons: [`retired authority ${item.retiredAuthority} must reconcile to ${item.replacementAuthority}`],
      fingerprint: fingerprintCandidate(item),
      fail_closed: false,
      reconciliation: {
        from: item.retiredAuthority,
        to: item.replacementAuthority,
        destructive_execution_allowed: false
      }
    };
  }

  const revalidation = buildRevalidationDecision({
    hardBoundary: item.hardBoundary,
    supersedingVerifiedIdentity: item.supersedingVerifiedIdentity,
    revalidateAfter: item.revalidateAfter,
    evidenceChanged: item.evidenceChanged,
    now
  });
  if (revalidation.state === 'SUPERSEDED') {
    return {
      id: item.id,
      kind: item.kind,
      classification: 'SUPERSEDED',
      decision: 'NO_ACTION',
      reasons: revalidation.reasons,
      fingerprint: fingerprintCandidate(item),
      fail_closed: false
    };
  }
  if (revalidation.state === 'CANDIDATE_REQUIRED' || revalidation.state === 'BLOCKED_HARD_BOUNDARY') {
    return {
      id: item.id,
      kind: item.kind,
      classification: 'CANDIDATE_REQUIRED',
      decision: revalidation.state === 'BLOCKED_HARD_BOUNDARY' ? 'REJECT' : 'HOLD_REVALIDATE',
      reasons: revalidation.reasons,
      fingerprint: fingerprintCandidate(item),
      fail_closed: true
    };
  }

  const normalizedActive = activeCandidates.map(normalizeItem).filter(candidate => candidate.id && candidate.component && candidate.problemClass);
  let classification = 'ISOLATE';
  const related = [];
  for (const active of normalizedActive) {
    const result = classifyPair(item, active);
    if (result !== 'ISOLATE') related.push({ id: active.id, classification: result });
  }
  if (related.some(row => row.classification === 'SUPERSEDED')) classification = 'SUPERSEDED';
  else if (related.some(row => row.classification === 'COALESCE')) classification = 'COALESCE';
  else if (related.some(row => row.classification === 'COMPARE')) classification = 'COMPARE';

  const evaluation = evaluateCandidate(item);
  if (evaluation.decision === 'REJECT' && classification === 'ISOLATE') classification = 'CANDIDATE_REQUIRED';
  if (!VALID_CLASSIFICATIONS.has(classification)) classification = 'CANDIDATE_REQUIRED';

  return {
    id: item.id,
    kind: item.kind,
    classification,
    decision: evaluation.decision,
    reasons: evaluation.reasons,
    fingerprint: fingerprintCandidate(item),
    related,
    fail_closed: evaluation.decision === 'REJECT'
  };
}

export function consumeBacklog({ items = [], activeCandidates = [], now } = {}) {
  const results = items.map(item => classifyBacklogItem(item, activeCandidates, { now }));
  const counts = Object.fromEntries([...VALID_CLASSIFICATIONS].sort().map(key => [key, results.filter(row => row.classification === key).length]));
  const executable = results.filter(row => row.decision === 'ALLOW' || row.decision === 'EXPERIMENT');
  const held = results.filter(row => !executable.includes(row));
  return {
    results,
    counts,
    executable,
    held,
    destructive_execution_allowed: false,
    classification_authority: 'powerhouse-continuous-improvement-engine-v1'
  };
}
