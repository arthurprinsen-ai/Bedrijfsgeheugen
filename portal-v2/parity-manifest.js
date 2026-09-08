const item = (legacyId, v2Pages, requiredBehaviors) => Object.freeze({
  legacyId,
  v2Pages: Object.freeze([...v2Pages]),
  requiredBehaviors: Object.freeze([...requiredBehaviors]),
  status: 'open'
});

export const LEGACY_PARITY_ITEMS = Object.freeze([
  item('overzicht', ['overzicht'], ['KPI overview', 'company state', 'maturity', 'blockers', 'progress', 'advice']),
  item('profiel', ['profiel'], ['per-domain assessment', 'inspectable detail']),
  item('dataai', ['data-ai'], ['data state', 'AI readiness', 'sources', 'quality', 'related actions']),
  item('aiscan', ['ai-scan', 'kansenkaart'], ['scan outcomes', 'opportunities', 'risks', 'prioritization']),
  item('invoeren', ['gegevens-invullen'], ['editable input', 'validation', 'save state']),
  item('antwoorden', ['ingevulde-gegevens'], ['submitted data readback', 'revisit and edit path']),
  item('business', ['businesscase'], ['assumptions', 'value logic', 'scenario outputs']),
  item('cijfers', ['cijfers-maatstaven'], ['metrics', 'benchmarks', 'comparison context']),
  item('waarde', ['waarde-financiering'], ['value logic', 'financial context', 'supporting explanation']),
  item('mensen', ['mensen'], ['people context', 'team context', 'knowledge dependency']),
  item('branche', ['branche-markt'], ['market context', 'industry context', 'benchmarks']),
  item('onderzoek', ['onderzoek'], ['research findings', 'evidence', 'source context']),
  item('beleid', ['compliance-governance', 'compliance-command-center'], ['governance status', 'policy status', 'risks', 'actions', 'evidence']),
  item('aicap', ['ai-capabilities'], ['AI capability maturity', 'gaps', 'next steps']),
  item('strategie', ['strategiemodellen', 'strategie-naar-maandagochtend'], ['strategy model', 'translation to execution']),
  item('canvassen', ['canvassen'], ['canvas views', 'canvas editing']),
  item('eindconclusie', ['eindconclusie'], ['final synthesis', 'priorities', 'recommendations']),
  item('dd', ['due-diligence'], ['due diligence overview', 'evidence', 'risks']),
  item('dna', ['strategy-dna'], ['Strategy DNA interaction', 'Strategy DNA state']),
  item('bijhouden', ['actueel-houden'], ['recency', 'monitoring', 'update workflow']),
  item('wijzigingen', ['wijzigingen'], ['activity history', 'change history', 'usable detail']),
  item('advies', ['advies'], ['recommendations', 'rationale', 'priority', 'action path']),
  item('offerte', ['offerte'], ['package selection', 'totals', 'delivery story', 'next action']),
  item('roadmap', ['roadmap'], ['timeline', 'tasks', 'progress', 'interactions'])
]);

export const GLOBAL_PARITY_CAPABILITIES = Object.freeze([
  item('auth', [], ['authenticated access boundary']),
  item('logout', [], ['authenticated logout']),
  item('export', [], ['deterministic customer/project data export']),
  item('import', [], ['validated safe import']),
  item('print', [], ['permission-gated print/report action']),
  item('feedback', [], ['contextual feedback submission']),
  item('customer-branding', [], ['customer name or mark with safe fallback']),
  item('mobile-navigation', [], ['five functional primary navigation controls'])
]);

const PARITY_BY_ID = new Map([
  ...LEGACY_PARITY_ITEMS.map(record => [record.legacyId, record]),
  ...GLOBAL_PARITY_CAPABILITIES.map(record => [record.legacyId, record])
]);

export function getParityItem(id) {
  return PARITY_BY_ID.get(id) || null;
}

export function listOpenParityItems() {
  return [...LEGACY_PARITY_ITEMS, ...GLOBAL_PARITY_CAPABILITIES].filter(record => record.status !== 'proven');
}
