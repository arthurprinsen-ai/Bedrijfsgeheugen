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


function recordText(record={}) {
  return [
    record.type,record.eventType,record.category,record.subjectId,record.title,record.name,
    record.status,record.state,record.actor,record.actorId,record.source,record.platform,
    record.layer,record.component,record.message,record.detail,record.error,record.fingerprint
  ].filter(Boolean).join(' ');
}
function classifyRecord(record={}) {
  const hay=recordText(record).toLowerCase();
  if(/skill|projection/.test(hay)) return 'skill';
  if(/learning|writeback|memory|ledger|document/.test(hay)) return 'knowledge';
  if(/github|pull request|workflow|commit|merge|deploy|release|production|readback|ci/.test(hay)) return 'delivery';
  if(/error|fail|blocked|drift|incident|exception|timeout|rate.limit|429/.test(hay)) return 'error';
  if(/agent|chat|worker|actor/.test(hay)) return 'agent';
  if(/supabase|netlify|notion|buffer|openart|placid|composio/.test(hay)) return 'platform';
  return 'activity';
}
function inferLayer(record={}) {
  if(record.layer)return txt(record.layer);
  const hay=recordText(record).toLowerCase();
  if(/github|workflow|commit|merge|pull request|ci/.test(hay))return 'GitHub / Delivery';
  if(/supabase|database|sql|migration/.test(hay))return 'Supabase / Data';
  if(/netlify|deploy|website|site/.test(hay))return 'Netlify / Runtime';
  if(/notion|document|ledger/.test(hay))return 'Notion / Documentatie';
  if(/skill|projection/.test(hay))return 'Skills';
  if(/learning|memory|writeback/.test(hay))return 'Brain / Learning';
  if(/agent|chat|worker/.test(hay))return 'Agents / Chats';
  return txt(record.component||record.domain||'Powerhouse');
}
function normalizeObservabilityRecord(record={},index=0) {
  const status=txt(record.status||record.state||record.conclusion||record.outcome?.status||'UNKNOWN');
  const severity=txt(record.severity||record.level||record.errorLevel||'');
  return {
    id:txt(record.id||record.eventId||record.correlationId||record.subjectId||`event-${index}`),
    occurredAt:txt(record.occurredAt||record.recordedAt||record.observedAt||record.updatedAt||record.createdAt),
    rawType:txt(record.type||record.eventType||record.kind||record.category||'event'),
    category:classifyRecord(record),
    subjectId:txt(record.subjectId||record.obligationId||record.correlationId||record.id),
    title:txt(record.title||record.name||record.message||record.type||record.subjectId||'Event'),
    detail:txt(record.detail||record.description||record.error||record.reason||record.message),
    status,
    severity,
    actor:txt(record.actor?.name||record.actor||record.actorId||record.worker||record.agent||'system'),
    source:txt(record.source||record.platform||record.provider||record.origin||'Powerhouse'),
    layer:inferLayer(record),
    fingerprint:txt(record.fingerprint||record.failureFingerprint||record.errorFingerprint)
  };
}
function observabilityProjection({records,cockpit,health,lussen,geheugen,waarde,projection,bijgewerkt}) {
  const normalized=records.map(normalizeObservabilityRecord);
  const timeline=arr(cockpit.activityTimeline).map((item,index)=>normalizeObservabilityRecord(item,records.length+index));
  const combined=[...normalized,...timeline];
  const seen=new Set();
  const events=combined.filter(item=>{const key=[item.id,item.occurredAt,item.title,item.status].join('|');if(seen.has(key))return false;seen.add(key);return true;});
  return {
    updatedAt:bijgewerkt||laatste(events),
    events,
    components:arr(health.components),
    loops:lussen,
    actors:projection.actors&&typeof projection.actors==='object'?projection.actors:{},
    economics:economics(projection.decisionEconomics),
    learningSummary:geheugen.memorySummary||geheugen.summary||{},
    valueTotals:waarde.totals||{},
    source:'brain-operating-loop'
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
    actors: projection.actors && typeof projection.actors === 'object' ? projection.actors : {},
    observability: observabilityProjection({records,cockpit,health,lussen,geheugen,waarde,projection,bijgewerkt})
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
