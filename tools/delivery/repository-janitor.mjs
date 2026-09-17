import { classifyCandidate, evaluateSupersession, validateDeliveryMetadata } from './delivery-hygiene.mjs';

export function planRepositoryCleanup({ candidates = [], policy = {}, mode = 'dry-run', fulfilledObligationIds = [] } = {}) {
  const normalized = candidates.map(candidate => classifyCandidate(candidate, policy));
  const fulfilled = new Set(fulfilledObligationIds);
  const perform = mode === 'apply-safe';
  const actions = [];
  const reviewRequired = [];
  const legacyUnclassified = [];

  for (const candidate of normalized) {
    const valid = validateDeliveryMetadata(candidate.metadata, policy).ok;
    if (!valid) {
      legacyUnclassified.push(Number(candidate.number));
      if (candidate.uniqueCommits === false) {
        actions.push({
          type: 'CLOSE_PR',
          prNumber: Number(candidate.number),
          reason: 'ALREADY_CONTAINED_IN_MAIN',
          perform,
        });
      } else {
        reviewRequired.push({ prNumber: Number(candidate.number), reason: 'LEGACY_UNCLASSIFIED' });
      }
    }
  }

  for (const successor of normalized) {
    const predecessorNumber = successor.metadata?.supersedes;
    if (!Number.isInteger(predecessorNumber)) continue;
    const predecessor = normalized.find(candidate => Number(candidate.number) === predecessorNumber);
    if (!predecessor) {
      reviewRequired.push({ prNumber: Number(successor.number), reason: 'SUPERSEDES_TARGET_NOT_OPEN', predecessorNumber });
      continue;
    }
    const proof = evaluateSupersession({ successor, predecessor });
    if (!proof.safe) {
      reviewRequired.push({ prNumber: Number(successor.number), reason: 'SUPERSESSION_LINEAGE_AMBIGUOUS', predecessorNumber });
      continue;
    }
    actions.push({
      type: 'CLOSE_PR',
      prNumber: predecessorNumber,
      successorNumber: Number(successor.number),
      obligationId: successor.metadata.obligationId,
      reason: proof.reason,
      perform,
    });
  }

  for (const candidate of normalized) {
    if (actions.some(action => action.prNumber === Number(candidate.number))) continue;
    if (candidate.uniqueCommits === false) {
      actions.push({
        type: 'CLOSE_PR',
        prNumber: Number(candidate.number),
        obligationId: candidate.metadata?.obligationId || undefined,
        reason: 'ALREADY_CONTAINED_IN_MAIN',
        perform,
      });
      continue;
    }
    if (!fulfilled.has(candidate.metadata?.obligationId)) continue;
    reviewRequired.push({ prNumber: Number(candidate.number), reason: 'FULFILLED_WITH_UNIQUE_COMMITS' });
  }

  const groups = new Map();
  for (const candidate of normalized) {
    if (!validateDeliveryMetadata(candidate.metadata, policy).ok || !candidate.metadata.obligationId) continue;
    const bucket = groups.get(candidate.metadata.obligationId) ?? [];
    bucket.push(Number(candidate.number));
    groups.set(candidate.metadata.obligationId, bucket);
  }
  const duplicateGroups = [...groups.entries()]
    .filter(([, numbers]) => numbers.length > 1)
    .map(([obligationId, prNumbers]) => ({ obligationId, prNumbers: prNumbers.sort((a, b) => a - b) }));

  const wipCount = normalized.filter(candidate =>
    candidate.state !== 'closed'
    && validateDeliveryMetadata(candidate.metadata, policy).ok
    && candidate.executable !== false
    && !policy.nonProductLanes?.includes(candidate.metadata.deliveryLane)
  ).length;

  const dedupedActions = actions.filter((action, index, all) => all.findIndex(other => other.type === action.type && other.prNumber === action.prNumber) === index);
  const actionPrs = new Set(dedupedActions.map(action => action.prNumber));
  const dedupedReviews = reviewRequired
    .filter(row => !actionPrs.has(row.prNumber))
    .filter((row, index, all) => all.findIndex(other => other.prNumber === row.prNumber && other.reason === row.reason) === index);

  return Object.freeze({
    version: policy.version ?? 'POWERHOUSE-DELIVERY-HYGIENE-v1',
    mode,
    wipCount,
    maxExecutable: Number(policy?.wip?.maxExecutable ?? 0),
    duplicateGroups,
    legacyUnclassified: legacyUnclassified.sort((a, b) => a - b),
    actions: dedupedActions,
    reviewRequired: dedupedReviews,
  });
}
