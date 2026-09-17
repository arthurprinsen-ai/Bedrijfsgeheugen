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

export function parseDeliveryMetadata(body = '') {
  return Object.freeze({
    obligationId: readField(body, 'Obligation-ID'),
    deliveryLane: readField(body, 'Delivery-Lane').toLowerCase(),
    candidateType: readField(body, 'Candidate-Type').toLowerCase(),
    baseSha: readField(body, 'Base-SHA').toLowerCase(),
    supersedes: normalizeSupersedes(readField(body, 'Supersedes')),
  });
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
  if (candidate.executable === false) return false;
  return !isNonProduct(candidate, policy);
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

  if (normalize(candidate.baseSha).toLowerCase() !== normalize(candidate.metadata.baseSha).toLowerCase()) {
    return Object.freeze({
      ok: false,
      state: 'BLOCKED_STALE_IDENTITY',
      reasons: ['DECLARED_BASE_SHA_MISMATCH'],
      actualBaseSha: normalize(candidate.baseSha).toLowerCase(),
      declaredBaseSha: normalize(candidate.metadata.baseSha).toLowerCase(),
      observedMainSha: normalize(currentMainSha).toLowerCase(),
    });
  }

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
    const maxExecutable = Number(policy?.wip?.maxExecutable ?? 0);
    if (Number.isInteger(maxExecutable) && maxExecutable > 0 && activeExecutable.length >= maxExecutable) {
      return Object.freeze({
        ok: false,
        state: 'BLOCKED_WIP_LIMIT',
        wipCount: activeExecutable.length,
        maxExecutable,
      });
    }
  }

  return Object.freeze({
    ok: true,
    state: 'ADMITTED',
    obligationId: candidate.metadata.obligationId,
    candidateNumber: Number(candidate.number),
    candidateHeadSha: normalize(candidate.headSha).toLowerCase(),
    immutableBaseSha: normalize(candidate.baseSha).toLowerCase(),
    observedMainSha: normalize(currentMainSha).toLowerCase(),
    predecessorNumber: predecessor ? Number(predecessor.number) : null,
  });
}
