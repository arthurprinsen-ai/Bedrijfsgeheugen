const items = slice => Array.isArray(slice?.items) ? slice.items : [];
const rank = value => Number.isFinite(Number(value)) ? Number(value) : Number.MAX_SAFE_INTEGER;

export function selectTopPriorities(runtime = {}) {
  return items(runtime.decisions)
    .filter(item => ['NOW', 'NEXT'].includes(item?.portfolioBucket))
    .slice()
    .sort((a, b) => rank(a.rank) - rank(b.rank));
}

export function selectApprovalNeeded(runtime = {}) {
  return items(runtime.approvals).filter(item => ['PENDING', 'REQUESTED'].includes(item?.approval?.state || item?.status));
}

export function selectBlocked(runtime = {}) {
  return items(runtime.decisions).filter(item => Boolean(item?.blockedBy) || String(item?.dependencyState || '').startsWith('BLOCKED') || item?.dependencyState === 'WAITING_FOR_DEPENDENCIES');
}

export function selectValueLeakage(runtime = {}) {
  const measured = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
  const expected = runtime?.economics?.expectedValue;
  const realized = runtime?.economics?.realizedValue;
  // Missing or unverified measurements must not become a fabricated €0 gap.
  if (!measured(expected) || !measured(realized)) return null;
  return Math.max(0, Number(expected) - Number(realized));
}

export function decisionById(runtime = {}, decisionId) {
  return items(runtime.decisions).find(item => item?.id === decisionId) || null;
}
