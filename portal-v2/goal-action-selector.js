/**
 * Explainable next-best action for one authenticated entrepreneur.
 * Read-only projection: never authorizes, queues, or executes an action.
 * The existing owner operating model remains authoritative for evidence and policy.
 */
const OPEN_STATES = new Set(['', 'PROPOSED', 'ELIGIBLE', 'APPROVAL_REQUIRED', 'AUTO_APPROVED', 'PENDING_APPROVAL', 'DECISION_REQUIRED', 'AWAITING_DECISION']);
const PRESENTABLE_LEVELS = new Set(['inzage', 'binnen-beleid', 'goedkeuring']);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const nonnegative = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;

function uniqueSources(item) {
  if (!Array.isArray(item?.source_refs)) return [];
  return [...new Set(item.source_refs.filter(nonempty).map(ref => ref.trim()))];
}

function admissible(item, tenantId, categories) {
  if (!item || item.tenant_id !== tenantId || !categories.has(item.ownerCategory)) return false;
  if (item.evidence_health?.status !== 'healthy' || item.evidence_health?.stale === true) return false;
  if (uniqueSources(item).length === 0) return false;
  // A readable, evidenced proposal is not necessarily safe to present as actionable.
  if (!PRESENTABLE_LEVELS.has(item.ownerSafety?.level) || item.ownerSafety?.eligibility === 'BLOCKED') return false;
  // Decision states may be shown for review, but the selector never grants approval.
  if (![item.state, item.status].every(value => value == null || OPEN_STATES.has(String(value).trim().toUpperCase()))) return false;
  return true;
}

/**
 * Deterministic selection from the existing tenant-bound, safety-evaluated projection.
 * Does not invent impact, ROI, conversion probability, cost savings, or measured results.
 */
export function selectGoalAlignedAction(actions, goalCategories, tenantId) {
  if (!nonempty(tenantId) || !Array.isArray(actions) || !Array.isArray(goalCategories)) return null;
  const categories = new Set(goalCategories.filter(nonempty));
  if (!categories.size) return null;
  const candidates = actions
    .filter(item => admissible(item, tenantId, categories))
    .map((item, order) => ({
      item, order,
      priority: nonnegative(item.priority ?? item.score),
      ownerDecision: Number(item.ownerSafety.level === 'goedkeuring'),
      confidence: nonnegative(item.evidence_health.confidence),
      identity: String(item.id ?? item.action_id ?? item.title ?? '')
    }));
  candidates.sort((a, b) =>
    b.priority - a.priority ||
    b.ownerDecision - a.ownerDecision ||
    b.confidence - a.confidence ||
    a.identity.localeCompare(b.identity) ||
    a.order - b.order
  );
  return candidates[0]?.item ?? null;
}

export function countDistinctActionSources(item) {
  return uniqueSources(item).length;
}
