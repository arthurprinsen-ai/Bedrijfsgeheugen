import { createProjection, applyProjectionDelta } from './projector.mjs';

const MATERIAL_TYPES = new Set(['FindingCreated','RiskEscalated','OpportunityCreated','DecisionRequested','GoalHealthChanged','CriticalChange','RegulatorySignal','TrustIssue','AgentVerificationFailed']);

function score(item) {
  const n = key => Number(item[key] ?? 0);
  return n('relevance') * 0.25 + n('impact') * 0.25 + n('urgency') * 0.2 + n('confidence') * 0.15 + n('responsibility') * 0.1 + n('novelty') * 0.05;
}

export function createManagementSummaryView({ generatedAt = null, sourceStateVersion = 0, companyHealth = null, items = [], maxAttention = 7, stale = false }) {
  const attention = items
    .filter(item => item && MATERIAL_TYPES.has(item.type) && item.permitted !== false)
    .map(item => ({ ...item, materialityScore: score(item) }))
    .sort((a, b) => b.materialityScore - a.materialityScore)
    .slice(0, Math.max(3, Math.min(7, maxAttention)));

  return createProjection({
    name: 'ManagementSummaryView', generatedAt, sourceStateVersion, stale,
    data: { companyHealth, attention },
  });
}

export function applyManagementSummaryDelta(view, delta) {
  return applyProjectionDelta(view, delta);
}
