const DESTRUCTIVE = new Set(['delete','delete_account','drop','truncate','purchase','send_email','publish','merge','deploy']);

export function evaluateExplorationAction({ action, stepsUsed = 0, maxSteps = 50 } = {}) {
  const normalized = String(action || '').toLowerCase();
  if (DESTRUCTIVE.has(normalized)) return Object.freeze({ allowed: false, reason: 'destructive_action_forbidden' });
  if (stepsUsed >= maxSteps) return Object.freeze({ allowed: false, reason: 'autonomy_budget_exhausted' });
  return Object.freeze({ allowed: true, reason: 'bounded_non_destructive_action' });
}

export function normalizeCandidateFinding(input = {}) {
  return Object.freeze({
    type: 'candidate_finding',
    kind: String(input.kind || 'unknown'),
    description: String(input.description || ''),
    source: String(input.source || 'exploration'),
    evidence_state: input.deterministic_reproduction ? 'GREEN' : 'UNKNOWN',
    release_authority: false,
    deterministic_reproduction: input.deterministic_reproduction ?? null,
  });
}
