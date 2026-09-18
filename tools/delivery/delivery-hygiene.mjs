import { evaluateFinishingPressure } from './one-loop.mjs';

const SHA40 = /^[0-9a-f]{40}$/i;

function normalize(value) {
  return String(value ?? '').trim();
}

function readField(body, label) {
  const pattern = new RegExp(`^${label}:\\s*(.+)$`, 'im');
  const match = String(body ?? '').match(pattern);
  return match ? normalize(match[1]) : '';
}

function normalizeSupersedes(value) {
  const raw = normalize(value);
  if (!raw || /^none$/i.test(raw)) return null;
  if (!/^\d+$/.test(raw)) return Number.NaN;
  return Number(raw);
}

function pathMatches(path, pattern) {
  const cleanPath = normalize(path).replace(/^\.\//, '');
  const cleanPattern = normalize(pattern).replace(/^\.\//, '');
  if (!cleanPath || !cleanPattern) return false;
  if (cleanPattern.endsWith('/')) return cleanPath.startsWith(cleanPattern);
  if (cleanPattern.endsWith('/**')) return cleanPath.startsWith(cleanPattern.slice(0, -3));
  if (cleanPattern.endsWith('-')) return cleanPath.startsWith(cleanPattern.slice(0, -1));
  return cleanPath === cleanPattern || cleanPath.startsWith(`${cleanPattern}/`);
}

export function deriveHygieneConflictContracts(changedPaths = [], brainPolicy = {}, hygienePolicy = {}) {
  const paths = [...new Set(changedPaths.map(value => normalize(value).replace(/^\.\//, '')).filter(Boolean))];
  const contracts = new Set(
    (brainPolicy.conflictContracts || [])
      .filter(contract => (contract.paths || []).some(pattern => paths.some(path => pathMatches(path, pattern))))
      .map(contract => contract.id)
  );
  if ((hygienePolicy.deliveryControlPlanePaths || []).some(pattern => paths.some(path => pathMatches(path, pattern)))) {
    contracts.add('delivery-control-plane');
  }
  return [...contracts].filter(Boolean).sort();
}

export function parseDeliveryMetadata(body = '') {
  return Object.freeze({
    obligationId: readField(body, 'Obligation-ID'),
    deliveryLane: readField(body, 'Delivery-Lane').toLowerCase(),
    candidateType: readField(body, 'Candidate-Type').toLowerCase(),
    baseSha: readField(body, 'Base-SHA').toLowerCase(),
    supersedes: normalizeSupersedes(readField(body, 'Supersedes')),
  });
}

export function parseWriterLease(body = '') {
  return Object.freeze({
    state: readField(body, 'Writer-Lease-State').toUpperCase(),
    owner: readField(body, 'Writer-Lease-Owner'),
    scope: readField(body, 'Writer-Lease-Scope'),
    headSha: readField(body, 'Writer-Lease-Head').toLowerCase(),
    mainEpochSha: readField(body, 'Writer-Lease-Main-Epoch').toLowerCase(),
    obligationId: readField(body, 'Writer-Lease-Obligation'),
    nonOwnerAction: readField(body, 'Writer-Lease-NonOwner-Action').toUpperCase(),
    release: readField(body, 'Writer-Lease-Release'),
  });
}

export function evaluateWriterLease({ body = '', candidateHeadSha = '', currentMainSha = '', obligationId = '', enforceCurrentMainEpoch = false } = {}) {
  const lease = parseWriterLease(body);
  const actualHead = normalize(candidateHeadSha).toLowerCase();
  const actualMain = normalize(currentMainSha).toLowerCase();
  const actualObligation = normalize(obligationId);
  if (lease.state !== 'TERMINAL_DELIVERY') {
    return Object.freeze({ ok: true, state: 'LEASE_INACTIVE', lease, actualHead });
  }
  const reasons = [];
  if (!lease.owner) reasons.push('WRITER_LEASE_OWNER_MISSING');
  if (!lease.scope) reasons.push('WRITER_LEASE_SCOPE_MISSING');
  if (!SHA40.test(lease.headSha)) reasons.push('WRITER_LEASE_HEAD_INVALID');
  if (!SHA40.test(lease.mainEpochSha)) reasons.push('WRITER_LEASE_MAIN_EPOCH_INVALID');
  if (!lease.obligationId) reasons.push('WRITER_LEASE_OBLIGATION_MISSING');
  if (!SHA40.test(actualHead)) reasons.push('CANDIDATE_HEAD_INVALID');
  if (actualMain && !SHA40.test(actualMain)) reasons.push('CURRENT_MAIN_SHA_INVALID');
  if (!reasons.length && lease.headSha !== actualHead) reasons.push('TERMINAL_LEASE_HEAD_DRIFT');
  if (!reasons.length && enforceCurrentMainEpoch && actualMain && lease.mainEpochSha !== actualMain) reasons.push('TERMINAL_LEASE_MAIN_EPOCH_DRIFT');
  if (!reasons.length && actualObligation && lease.obligationId !== actualObligation) reasons.push('TERMINAL_LEASE_OBLIGATION_DRIFT');
  if (reasons.length) {
    return Object.freeze({
      ok: false,
      state: reasons.some(reason => reason.endsWith('_DRIFT')) ? 'BLOCKED_TERMINAL_LEASE_DRIFT' : 'BLOCKED_WRITER_LEASE_INVALID',
      reasons,
      expectedHead: lease.headSha || null,
      actualHead: actualHead || null,
      lease,
    });
  }
  return Object.freeze({ ok: true, state: 'TERMINAL_LEASE_BOUND', expectedHead: lease.headSha, actualHead, expectedMainEpoch: lease.mainEpochSha, actualMain: actualMain || null, obligationId: lease.obligationId, lease });
}

export function validateDeliveryMetadata(metadata = {}, policy = {}) {
  const errors = [];
  if (!normalize(metadata.obligationId)) errors.push('OBLIGATION_ID_MISSING');
  if (!Array.isArray(policy.allowedLanes) || !policy.allowedLanes.includes(metadata.deliveryLane)) errors.push('DELIVERY_LANE_INVALID');
  if (!Array.isArray(policy.allowedCandidateTypes) || !policy.allowedCandidateTypes.includes(metadata.candidateType)) errors.push('CANDIDATE_TYPE_INVALID');
  if (!SHA40.test(normalize(metadata.baseSha))) errors.push('BASE_SHA_INVALID');
  if (Number.isNaN(metadata.supersedes) || (metadata.supersedes !== null && (!Number.isInteger(metadata.supersedes) || metadata.supersedes < 1))) errors.push('SUPERSEDES_INVALID');
  return Object.freeze({ ok: errors.length === 0, errors });
}

export function classifyCandidate(pr = {}, policy = {}) {
  const metadata = pr.metadata ?? parseDeliveryMetadata(pr.body ?? '');
  const nonProduct = Array.isArray(policy.nonProductLanes) && policy.nonProductLanes.includes(metadata.deliveryLane);
  return Object.freeze({
    ...pr,
    metadata,
    executable: typeof pr.executable === 'boolean' ? pr.executable : !nonProduct,
    conflictContracts: Array.isArray(pr.conflictContracts) ? [...new Set(pr.conflictContracts)] : [],
  });
}

export function evaluateSupersession({ successor, predecessor } = {}) {
  const successorNumber = Number(successor?.number);
  const predecessorNumber = Number(predecessor?.number);
  const supersedes = successor?.metadata?.supersedes;
  const sameObligation = Boolean(successor?.metadata?.obligationId) && successor.metadata.obligationId === predecessor?.metadata?.obligationId;
  const safe = Number.isInteger(successorNumber)
    && Number.isInteger(predecessorNumber)
    && Number(supersedes) === predecessorNumber
    && successorNumber !== predecessorNumber
    && sameObligation;
  return Object.freeze({
    safe,
    reason: safe ? 'EXPLICIT_SAME_OBLIGATION_SUCCESSOR' : 'LINEAGE_NOT_PROVEN',
    successorNumber,
    predecessorNumber,
    obligationId: successor?.metadata?.obligationId ?? null,
  });
}

function isNonProduct(candidate, policy) {
  return Array.isArray(policy?.nonProductLanes) && policy.nonProductLanes.includes(candidate?.metadata?.deliveryLane);
}

function isOpenExecutable(candidate, policy) {
  if (!candidate || candidate.state === 'closed') return false;
  if (!validateDeliveryMetadata(candidate.metadata, policy).ok) return false;
  if (candidate.executable === false) return false;
  return !isNonProduct(candidate, policy);
}

function isFinishingCandidate(candidate) {
  const type = candidate?.metadata?.candidateType;
  return type === 'promotion' || type === 'recovery';
}

function overlap(left = [], right = []) {
  const rightSet = new Set(right);
  return left.some(item => rightSet.has(item));
}

export function evaluatePromotionSerialization({ candidate, openCandidates = [] } = {}) {
  if (candidate?.metadata?.candidateType !== 'promotion') return Object.freeze({ ok: true, state: 'ADMITTED', blockers: [] });
  const blocker = openCandidates.find(other =>
    Number(other?.number) !== Number(candidate?.number)
    && other?.state !== 'closed'
    && other?.metadata?.candidateType === 'promotion'
    && overlap(candidate?.conflictContracts ?? [], other?.conflictContracts ?? [])
  );
  if (!blocker) return Object.freeze({ ok: true, state: 'ADMITTED', blockers: [] });
  return Object.freeze({
    ok: false,
    state: 'BLOCKED_PROMOTION_SERIALIZATION',
    blockers: [Number(blocker.number)],
  });
}

export function evaluateAdmission({ candidate: rawCandidate, openCandidates = [], policy = {}, currentMainSha = '' } = {}) {
  const candidate = classifyCandidate(rawCandidate, policy);
  const candidates = openCandidates.map(item => classifyCandidate(item, policy));
  const validation = validateDeliveryMetadata(candidate.metadata, policy);
  if (!validation.ok) {
    return Object.freeze({ ok: false, state: 'BLOCKED_METADATA_INVALID', reasons: validation.errors });
  }

  const authoritativeBaseSha = normalize(candidate.baseSha).toLowerCase();
  if (!SHA40.test(authoritativeBaseSha) || !SHA40.test(normalize(candidate.headSha).toLowerCase())) {
    return Object.freeze({
      ok: false,
      state: 'BLOCKED_STALE_IDENTITY',
      reasons: ['MISSING_IMMUTABLE_CANDIDATE_IDENTITY'],
    });
  }

  const declaredBaseSha = normalize(candidate.metadata.baseSha).toLowerCase();
  const metadataBaseDrift = declaredBaseSha !== authoritativeBaseSha
    ? Object.freeze({ declaredBaseSha, authoritativeBaseSha })
    : null;

  const supersedingCandidate = candidates.find(other => evaluateSupersession({ successor: other, predecessor: candidate }).safe);
  if (supersedingCandidate) {
    return Object.freeze({
      ok: false,
      state: 'BLOCKED_SUPERSEDED',
      blockers: [Number(supersedingCandidate.number)],
    });
  }

  let predecessor = null;
  if (candidate.metadata.supersedes !== null) {
    predecessor = candidates.find(other => Number(other.number) === Number(candidate.metadata.supersedes)) ?? null;
    if (!predecessor || !evaluateSupersession({ successor: candidate, predecessor }).safe) {
      return Object.freeze({
        ok: false,
        state: 'BLOCKED_LINEAGE_AMBIGUOUS',
        blockers: predecessor ? [Number(predecessor.number)] : [],
      });
    }
  }

  const sameObligation = candidates.filter(other =>
    other.state !== 'closed'
    && Number(other.number) !== Number(candidate.number)
    && other.metadata?.obligationId === candidate.metadata.obligationId
    && (!predecessor || Number(other.number) !== Number(predecessor.number))
  );
  if (sameObligation.length) {
    return Object.freeze({
      ok: false,
      state: 'BLOCKED_DUPLICATE_OBLIGATION',
      blockers: sameObligation.map(item => Number(item.number)),
    });
  }

  const promotion = evaluatePromotionSerialization({ candidate, openCandidates: candidates });
  if (!promotion.ok) return promotion;

  if (!isNonProduct(candidate, policy) && candidate.executable !== false) {
    const predecessorNumber = predecessor ? Number(predecessor.number) : null;
    const activeExecutable = candidates.filter(other =>
      Number(other.number) !== Number(candidate.number)
      && Number(other.number) !== predecessorNumber
      && isOpenExecutable(other, policy)
    );
    // Development remains parallel by default. Integration pressure is scoped to
    // candidates that share an explicit conflict contract with this candidate;
    // unrelated work must never consume this candidate's integration WIP budget.
    const integrationPressure = activeExecutable.filter(other =>
      overlap(candidate.conflictContracts ?? [], other.conflictContracts ?? [])
    );
    const maxExecutable = Number(policy?.wip?.maxExecutable ?? 0);
    const finishingCandidates = integrationPressure.filter(isFinishingCandidate);
    const pressure = evaluateFinishingPressure({
      maxExecutable,
      admittedExecutable: integrationPressure.length,
      finishing: finishingCandidates.length,
      candidate: {
        lane: candidate.metadata.deliveryLane,
        type: candidate.metadata.candidateType,
      },
    });

    if (pressure.decision === 'WAITING_CAPACITY') {
      return Object.freeze({
        ok: false,
        state: 'WAITING_CAPACITY',
        reason: pressure.reason,
        obligationId: candidate.metadata.obligationId,
        candidateNumber: Number(candidate.number),
        candidateHeadSha: normalize(candidate.headSha).toLowerCase(),
        immutableBaseSha: authoritativeBaseSha,
        observedMainSha: normalize(currentMainSha).toLowerCase(),
        predecessorNumber,
        metadataBaseDrift,
      });
    }

    if (pressure.decision === 'ADMIT_PRIORITY_RECOVERY') {
      return Object.freeze({
        ok: true,
        state: 'ADMITTED',
        priorityRecovery: true,
        reason: pressure.reason,
        obligationId: candidate.metadata.obligationId,
        candidateNumber: Number(candidate.number),
        candidateHeadSha: normalize(candidate.headSha).toLowerCase(),
        immutableBaseSha: authoritativeBaseSha,
        observedMainSha: normalize(currentMainSha).toLowerCase(),
        predecessorNumber,
        metadataBaseDrift,
      });
    }
  }

  return Object.freeze({
    ok: true,
    state: 'ADMITTED',
    obligationId: candidate.metadata.obligationId,
    candidateNumber: Number(candidate.number),
    candidateHeadSha: normalize(candidate.headSha).toLowerCase(),
    immutableBaseSha: authoritativeBaseSha,
    observedMainSha: normalize(currentMainSha).toLowerCase(),
    predecessorNumber: predecessor ? Number(predecessor.number) : null,
    metadataBaseDrift,
  });
}
