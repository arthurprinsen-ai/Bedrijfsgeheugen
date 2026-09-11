/**
 * Runtime-evidence voor de Brein- en Powerhouse-pagina's.
 *
 * `/api/brain-operating-loop` geeft per tenant de canonieke operating-loopprojectie.
 * Portal V2 projecteert die waarheid en rekent hier geen alternatieve businesslogica uit.
 * Ontbreekt runtimebewijs, dan blijft het scherm leeg in plaats van te gokken.
 */

const arr = value => (Array.isArray(value) ? value : []);
const txt = value => (value == null ? '' : String(value));
const laatste = items => arr(items).map(x => x?.occurredAt || x?.recordedAt || x?.observedAt || x?.at).filter(Boolean).sort().pop() || '';

export const BREIN_STAPPEN = Object.freeze([
  'evidence', 'graph', 'intelligence', 'impact', 'decision', 'action',
  'execution', 'verification', 'outcome', 'value', 'learning', 'memory', 'graph_feedback'
]);

const STAP_LABEL = Object.freeze({
  evidence: 'Bewijs', graph: 'Graaf', intelligence: 'Intelligentie', impact: 'Impact',
  decision: 'Besluit', action: 'Actie', execution: 'Uitvoering', verification: 'Verificatie',
  outcome: 'Uitkomst', value: 'Waarde', learning: 'Leren', memory: 'Geheugen',
  graph_feedback: 'Terugkoppeling'
});

function slice(items, updatedAt, extra = {}) {
  const lijst = arr(items);
  return { items: lijst, updatedAt: updatedAt || laatste(lijst), ...extra };
}

function emptyPortfolio() {
  return { NOW: [], NEXT: [], LATER: [], DO_NOT_DO: [] };
}

function economics(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    expectedValue: Number(source.expectedValue) || 0,
    actualCost: Number(source.actualCost) || 0,
    realizedValue: Number(source.realizedValue) || 0,
    realizedProfit: Number(source.realizedProfit) || 0,
    currency: txt(source.currency || 'EUR')
  };
}

export function mapRuntimeProjection(projection) {
  if (!projection || typeof projection !== 'object') return {};
  const records = arr(projection.records);
  const cockpit = projection.executiveCockpit || {};
  const health = projection.integrationHealth || {};
  const geheugen = projection.livingMemory || {};
  const waarde = projection.verifiedValue || {};
  const lussen = arr(projection.wholeBrainLoops);
  const samenvatting = projection.loopSummary || {};
  const bijgewerkt = laatste(records);

  const perStap = BREIN_STAPPEN.map(stap => {
    const gehaald = lussen.filter(loop => loop?.stages?.[stap] === true).length;
    return {
      naam: STAP_LABEL[stap] || stap,
      stap,
      lussen: gehaald,
      status: lussen.length && gehaald === lussen.length ? 'ok' : gehaald ? 'deels' : 'open',
      healthy: Boolean(lussen.length && gehaald === lussen.length)
    };
  });

  const portfolio = projection.priorityPortfolio && typeof projection.priorityPortfolio === 'object'
    ? {
        NOW: arr(projection.priorityPortfolio.NOW),
        NEXT: arr(projection.priorityPortfolio.NEXT),
        LATER: arr(projection.priorityPortfolio.LATER),
        DO_NOT_DO: arr(projection.priorityPortfolio.DO_NOT_DO)
      }
    : emptyPortfolio();

  return {
    sources: slice(arr(health.components).map(item => ({
      naam: txt(item.name || item.component || item.platform),
      status: item.healthy === false ? 'aandacht' : 'ok',
      healthy: item.healthy !== false,
      laatst: txt(item.lastSeenAt || item.observedAt)
    })), bijgewerkt, { summary: health.summary || {} }),

    datahub: slice(arr(projection.businessGraph?.nodes || projection.businessGraph?.entities).map(node => ({
      naam: txt(node.label || node.id), status: 'ok', healthy: true
    })), bijgewerkt, { edges: arr(projection.businessGraph?.edges).length }),

    brain: slice(perStap, bijgewerkt, {
      loops: samenvatting.total || lussen.length,
      compleet: samenvatting.complete || 0,
      incompleet: samenvatting.incomplete || 0
    }),

    agents: slice(arr(cockpit.activityTimeline).map(item => ({
      naam: txt(item.title || item.subjectId || item.type),
      status: item.status === 'BLOCKED' ? 'aandacht' : 'ok',
      healthy: item.status !== 'BLOCKED',
      laatst: txt(item.occurredAt)
    })), bijgewerkt),

    actions: slice(arr(cockpit.recommendedActions).map(item => ({
      naam: txt(item.title || item.action),
      status: txt(item.priority || 'open'),
      healthy: false,
      waarde: Number(item.value) || 0
    })), bijgewerkt),

    recovery: slice(arr(cockpit.openKnowledgeObligations).map(item => ({
      naam: txt(item.title || item.subjectId),
      status: 'open', healthy: false, laatst: txt(item.occurredAt)
    })), bijgewerkt, { openLoops: arr(cockpit.openLoops).length }),

    outcomes: slice(arr(waarde.verifiedValues || waarde.verifiedOutcomes).map(item => ({
      naam: txt(item.subjectId || item.title),
      status: item.status === 'VERIFIED' ? 'ok' : 'aandacht',
      healthy: item.status === 'VERIFIED',
      waarde: Number(item.value || item.amount) || 0
    })), bijgewerkt, { totals: waarde.totals || {} }),

    learning: slice(arr(geheugen.memories || geheugen.records).map(item => ({
      naam: txt(item.claim || item.subjectId || item.id),
      status: item.status === 'PROVEN' ? 'ok' : 'aandacht',
      healthy: item.status === 'PROVEN'
    })), bijgewerkt, { summary: geheugen.memorySummary || geheugen.summary || {} }),

    selfHeal: slice(lussen.filter(loop => !loop?.complete).map(loop => ({
      naam: txt(loop.correlationId || 'lus'),
      status: 'aandacht', healthy: false,
      ontbreekt: BREIN_STAPPEN.filter(stap => loop?.stages?.[stap] !== true).length
    })), bijgewerkt, { compleet: samenvatting.complete || 0, totaal: samenvatting.total || lussen.length }),

    audit: slice(records.map(record => ({
      naam: txt(record.type || record.subjectId),
      status: 'ok', healthy: true, laatst: txt(record.occurredAt || record.recordedAt || record.observedAt)
    })), bijgewerkt),

    governance: slice(arr(projection.aiGovernance?.systems || projection.aiGovernance).map(item => ({
      naam: txt(item.systemName || item.model),
      status: item.riskLevel === 'HIGH' ? 'aandacht' : 'ok',
      healthy: item.riskLevel !== 'HIGH'
    })), bijgewerkt),

    decisions: slice(arr(projection.companyDecisions), bijgewerkt),
    approvals: slice(arr(projection.approvalQueue), bijgewerkt),
    economics: economics(projection.decisionEconomics),
    timeline: slice(arr(projection.auditTimeline), bijgewerkt),
    portfolio,
    actors: projection.actors && typeof projection.actors === 'object' ? projection.actors : {}
  };
}

export async function loadRuntimeEvidence({ fetchImpl = globalThis.fetch, domainState } = {}) {
  try {
    const response = await fetchImpl('/api/brain-operating-loop', {
      headers: { accept: 'application/json' }, credentials: 'same-origin'
    });
    if (!response.ok) return null;
    const projection = await response.json();
    const runtime = mapRuntimeProjection(projection);
    if (!Object.keys(runtime).length) return null;
    if (domainState?.get && domainState?.set) {
      const state = domainState.get() || {};
      domainState.set({ ...state, portal: { ...state.portal, runtime } });
    }
    return runtime;
  } catch {
    return null;
  }
}

export { STAP_LABEL };
