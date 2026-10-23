import { validateOptimizationCandidate } from './optimization-contract.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const DAY = 86_400_000;
const num = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
const isoDay = date => date.toISOString().slice(0, 10);
function canonical(value) {
  if (!value || !String(value).trim()) return null;
  try {
    const url = new URL(String(value || ''), ORIGIN);
    if (url.protocol !== 'https:' || url.hostname !== 'www.bedrijfsgeheugen.nl') return null;
    return ORIGIN + (url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, ''));
  } catch { return null; }
}
function moneyPages(registry) {
  return (registry?.pages || []).filter(page => ['money', 'pillar'].includes(page.role))
    .map(page => ({ ...page, canonical: canonical(page.route) })).filter(page => page.canonical);
}

/**
 * A decision-only, deterministic projection of existing canonical GSC, growth
 * event and verified business-outcome sources. Never deploys or publishes copy.
 * Source gaps, truncation and poor sampling prevent false zero-conversion claims.
 */
export function planDailyConversion({ searchRows = [], events = [], outcomes = [], registry = {}, now = new Date(),
  searchLimit = 2000, eventLimit = 2500, outcomeLimit = 500 } = {}) {
  const at = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(at.getTime())) throw new Error('INVALID_CRO_OBSERVATION_TIME');
  const day = isoDay(at);
  const incomplete = searchRows.length >= searchLimit || events.length >= eventLimit || outcomes.length >= outcomeLimit;
  const pages = moneyPages(registry);
  const search = new Map(), seen = new Set(), behavior = new Map(), results = new Map();
  let newestSearch = null, newestEvent = null;
  const startSearch = at.getTime() - 35 * DAY, startEvents = at.getTime() - 28 * DAY;
  for (const row of searchRows) {
    const page = canonical(row.pagina || row.canonical);
    const date = Date.parse(String(row.datum || ''));
    const updated = Date.parse(String(row.opgehaald_op || ''));
    if (!page || !Number.isFinite(date) || date < startSearch || date > at.getTime() || !Number.isFinite(updated) || updated > at.getTime()) continue;
    if (newestSearch === null || updated > newestSearch) newestSearch = updated;
    const rowKey = [page, String(row.zoekterm || ''), row.datum].join('|');
    if (seen.has(rowKey)) continue; // ordered newest-first from canonical GSC sync
    seen.add(rowKey);
    const aggregate = search.get(page) || { impressions: 0, clicks: 0, weightedPosition: 0, weight: 0 };
    const impressions = num(row.vertoningen), clicks = num(row.klikken);
    aggregate.impressions += impressions;
    aggregate.clicks += clicks;
    aggregate.weightedPosition += num(row.positie) * impressions;
    aggregate.weight += impressions;
    search.set(page, aggregate);
  }
  const observedEvents = new Set();
  for (const event of events) {
    const page = canonical(event.canonical), timestamp = Date.parse(String(event.occurred_at || ''));
    if (!page || !Number.isFinite(timestamp) || timestamp < startEvents || timestamp > at.getTime()) continue;
    if (observedEvents.has(event.event_id)) continue;
    if (event.event_id) observedEvents.add(event.event_id);
    if (newestEvent === null || timestamp > newestEvent) newestEvent = timestamp;
    const item = behavior.get(page) || { views: 0, engaged: 0, cta: 0 };
    if (event.event_type === 'page_view') item.views++;
    if (event.event_type === 'engaged_view') item.engaged++;
    if (event.event_type === 'primary_cta_click') item.cta++;
    behavior.set(page, item);
  }
  for (const outcome of outcomes) {
    const page = canonical(outcome.canonical), timestamp = Date.parse(String(outcome.occurred_at || ''));
    if (!page || !Number.isFinite(timestamp) || timestamp < startEvents || timestamp > at.getTime()) continue;
    const current = results.get(page) || { qualifiedLeads: 0, orders: 0, realizedRevenueEur: 0 };
    if (outcome.stage === 'qualified_lead') current.qualifiedLeads++;
    if (outcome.stage === 'won_order') current.orders++;
    if (outcome.stage === 'revenue') current.realizedRevenueEur += num(outcome.revenue_eur);
    results.set(page, current);
  }
  const gscFresh = newestSearch !== null && at.getTime() - newestSearch <= 7 * DAY;
  const eventFresh = newestEvent !== null && at.getTime() - newestEvent <= 3 * DAY;
  const sourceStatus = incomplete ? 'PARTIAL_TRUNCATED' :
    gscFresh && eventFresh ? 'GSC_AND_BEHAVIOR_FRESH' :
    gscFresh ? 'BEHAVIOR_MISSING_OR_STALE' :
    eventFresh ? 'GSC_MISSING_OR_STALE' : 'MISSING_OR_STALE';
  const candidates = [];
  const pageSummaries = [];
  for (const page of pages) {
    const gsc = search.get(page.canonical) || { impressions: 0, clicks: 0, weight: 0, weightedPosition: 0 };
    const ev = behavior.get(page.canonical) || { views: 0, engaged: 0, cta: 0 };
    const business = results.get(page.canonical) || { qualifiedLeads: 0, orders: 0, realizedRevenueEur: 0 };
    const ctr = gsc.impressions ? gsc.clicks / gsc.impressions : null;
    const ctaRate = ev.views ? ev.cta / ev.views : null;
    const position = gsc.weight ? gsc.weightedPosition / gsc.weight : null;
    pageSummaries.push({ canonical: page.canonical, impressions: gscFresh ? gsc.impressions : null,
      clicks: gscFresh ? gsc.clicks : null, ctr: gscFresh ? ctr : null,
      views: eventFresh ? ev.views : null, ctaClicks: eventFresh ? ev.cta : null,
      ctaRate: eventFresh ? ctaRate : null, qualifiedLeads: incomplete || !results.has(page.canonical) ? null : business.qualifiedLeads,
      orders: incomplete || !results.has(page.canonical) ? null : business.orders,
      realizedRevenueEur: incomplete || !results.has(page.canonical) ? null : Number(business.realizedRevenueEur.toFixed(2)) });
    if (incomplete) continue;
    let action = null, reason = null, target = null, priority = 0, refs = [];
    if (eventFresh && ev.views >= 50 && ev.engaged >= 15 && ctaRate < 0.04) {
      action = 'cta-copy-position'; reason = 'observed-low-primary-cta-rate';
      target = 'primary_cta_click_rate'; priority = 100 + ev.views * (0.04 - ctaRate);
      refs = ['growth_events:' + page.canonical + ':' + day];
    } else if (gscFresh && gsc.impressions >= 200 && ctr < 0.025) {
      action = position !== null && position > 10 ? 'content-gap' : 'title-meta';
      reason = position !== null && position > 10 ? 'observed-ranking-gap' : 'observed-low-organic-ctr';
      target = 'organic_click_through_rate'; priority = 40 + gsc.impressions * (0.025 - ctr);
      refs = ['bg_zoekprestaties:' + page.canonical + ':' + day];
    }
    if (!action) continue;
    const proposal = {
      action, canonical: page.canonical, hypothesis: reason,
      target_metric: target, rollback_condition: 'independent post-deploy decline in qualified leads or primary conversions',
      evidence_refs: refs, auto_publish: false, introduces_new_factual_claim: false,
      evidence_safe: true, proposed_change: { kind: 'human-validation-required', primary_cta: page.primary_cta || null },
      priority: Number(priority.toFixed(2)), observation_day: day, source_status: sourceStatus,
      actual_business_outcomes: results.has(page.canonical) ? { ...business, realizedRevenueEur: Number(business.realizedRevenueEur.toFixed(2)) } : null,
      terminal: { state: 'REJECTED_WITH_EVIDENCE', reason_code: 'NO_SAFE_REVERSIBLE_CHANGE',
        missing_or_conflicting_evidence: 'No independently validated challenger copy or protected delivery/readback for this observation',
        future_execution_condition: 'Validated reversible challenger with exact-head CI, protected delivery, and independent production readback' }
    };
    if (validateOptimizationCandidate(proposal).length === 0) candidates.push(proposal);
  }
  candidates.sort((a, b) => b.priority - a.priority || a.canonical.localeCompare(b.canonical));
  return { day, sourceStatus, sourceFreshness: { gscFresh, eventFresh, truncated: incomplete },
    pagesReviewed: pages.length, candidates: candidates.slice(0, 3), pages: pageSummaries,
    publicationStatus: 'NOT_PUBLISHED_REQUIRES_PROTECTED_DELIVERY',
    revenueEvidenceStatus: incomplete ? 'INCOMPLETE' : 'OBSERVED_ONLY' };
}
