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
export function planDailyConversion({ searchRows = [], events = [], humanViewProbe = [], pageDailyRows = [], outcomes = [], registry = {}, now = new Date(),
  searchLimit = 2000, eventLimit = 2500, dailyLimit = 1500, outcomeLimit = 500 } = {}) {
  const at = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(at.getTime())) throw new Error('INVALID_CRO_OBSERVATION_TIME');
  const day = isoDay(at);
  const incomplete = searchRows.length >= searchLimit || events.length >= eventLimit || pageDailyRows.length >= dailyLimit || outcomes.length >= outcomeLimit;
  const pages = moneyPages(registry);
  const search = new Map(), seen = new Set(), behavior = new Map(), results = new Map(), daily = new Map(), dailySeen = new Set();
  let newestSearch = null, newestEvent = null;
  const startSearch = at.getTime() - 35 * DAY, startEvents = at.getTime() - 28 * DAY;
  // A bounded, non-PII first-party human page-view freshness probe is not a full
  // denominator. Legacy daily rollups lack independently proved human/bot parity.
  // Never infer visitor drop-off or low CTA rate from them until a validated
  // human-only denominator + click-attribution contract exists.
  let lastHumanView = null;
  for(const ev of humanViewProbe){
    const timestamp=Date.parse(String(ev?.occurred_at||''));
    if(ev?.event_type!=='page_view'||ev?.is_robot!==false||!canonical(ev?.canonical)||
      !Number.isFinite(timestamp)||timestamp<startEvents||timestamp>at.getTime())continue;
    lastHumanView=Math.max(lastHumanView??0,timestamp);
  }
  const rawHumanFresh=lastHumanView!==null&&at.getTime()-lastHumanView<=3*DAY;
  const measurementStatus=rawHumanFresh?'HUMAN_ROLLUP_PARITY_UNVERIFIED':'RAW_HUMAN_PAGEVIEW_STALE_OR_MISSING';
  for (const row of searchRows) {
    const page = canonical(row.pagina || row.canonical);
    const date = Date.parse(String(row.datum || ''));
    const updated = Date.parse(String(row.opgehaald_op || ''));
    if (!page || !Number.isFinite(date) || date < startSearch || date > at.getTime() || !Number.isFinite(updated) || updated > at.getTime()) continue;
    if (newestSearch === null || updated > newestSearch) newestSearch = updated;
    const rowKey = [page, String(row.zoekterm || ''), row.datum].join('|');
    if (seen.has(rowKey)) continue; // ordered newest-first from canonical GSC sync
    seen.add(rowKey);
    const aggregate = search.get(page) || { impressions: 0, clicks: 0, weightedPosition: 0, weight: 0, latestUpdated: 0 };
    const impressions = num(row.vertoningen), clicks = num(row.klikken);
    aggregate.impressions += impressions;
    aggregate.clicks += clicks;
    aggregate.weightedPosition += num(row.positie) * impressions;
    aggregate.weight += impressions;
    aggregate.latestUpdated=Math.max(aggregate.latestUpdated,updated);
    search.set(page, aggregate);
  }
  // Existing canonical daily page rollups are bounded and avoid truncating the high-volume event table.
  // Only observed rows with a valid day, unique day/intent owner and fresh update are counted.
  let latestDaily = null;
  for (const row of pageDailyRows) {
    const page = canonical(row.canonical), timestamp = Date.parse(String(row.day || ''));
    const updated = Date.parse(String(row.updated_at || ''));
    if (!page || !Number.isFinite(timestamp) || timestamp < startEvents || timestamp > at.getTime() ||
        !Number.isFinite(updated) || updated > at.getTime()) continue;
    const key = [page, row.day, String(row.intent_owner || '')].join('|');
    if (dailySeen.has(key)) continue;
    dailySeen.add(key);
    if (latestDaily === null || updated > latestDaily) latestDaily = updated;
    const d = daily.get(page) || { views: 0, cta: 0, qualifiedLeads: 0, orders: 0,
      realizedRevenueEur: 0, latestDay: 0, latestUpdated: 0 };
    d.views += num(row.page_views);
    d.cta += num(row.cta_clicks);
    d.qualifiedLeads += num(row.qualified_leads);
    d.orders += num(row.won_orders);
    d.realizedRevenueEur += num(row.revenue_eur);
    d.latestDay = Math.max(d.latestDay, timestamp);
    d.latestUpdated = Math.max(d.latestUpdated, updated);
    daily.set(page, d);
  }
  const observedEvents = new Set();
  for (const event of events) {
    const page = canonical(event.canonical), timestamp = Date.parse(String(event.occurred_at || ''));
    if (!page || !Number.isFinite(timestamp) || timestamp < startEvents || timestamp > at.getTime()) continue;
    if (observedEvents.has(event.event_id)) continue;
    if (event.event_id) observedEvents.add(event.event_id);
    if (newestEvent === null || timestamp > newestEvent) newestEvent = timestamp;
    const item = behavior.get(page) || { views: 0, engaged: 0, cta: 0 };
    if (event.event_type === 'page_view' && event.is_robot === false) item.views++;
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
  const latestBehavior = Math.max(newestEvent ?? 0, latestDaily ?? 0);
  const eventFresh = latestBehavior > 0 && at.getTime() - latestBehavior <= 3 * DAY;
  const sourceStatus = incomplete ? 'PARTIAL_TRUNCATED' :
    gscFresh ? 'GSC_FRESH_CRO_DENOMINATOR_UNVERIFIED' :
    eventFresh ? 'GSC_MISSING_CRO_DENOMINATOR_UNVERIFIED' : 'MISSING_OR_STALE';
  const candidates = [];
  const pageSummaries = [];
  for (const page of pages) {
    const gsc = search.get(page.canonical) || { impressions: 0, clicks: 0, weight: 0, weightedPosition: 0, latestUpdated: 0 };
    const observed = behavior.get(page.canonical) || { views: 0, engaged: 0, cta: 0 };
    const rollup = daily.get(page.canonical) || null;
    const rollupFresh = Boolean(rollup && at.getTime() - rollup.latestUpdated <= 7 * DAY && at.getTime() - rollup.latestDay <= 7 * DAY);
    // No verified human-only visitor denominator is available yet.
    // Keep raw and rollup observations separate; never calculate an apparent CTA rate.
    const ev = { views: null, engaged: observed.engaged, cta: rollupFresh ? Math.max(rollup.cta, observed.cta) : observed.cta };
    const pageEventFresh = rollupFresh || (eventFresh && observed.views > 0);
    const pageGscFresh = Boolean(gsc.latestUpdated && at.getTime() - gsc.latestUpdated <= 7 * DAY);
    const business = results.get(page.canonical) || { qualifiedLeads: 0, orders: 0, realizedRevenueEur: 0 };
    const ctr = gsc.impressions ? gsc.clicks / gsc.impressions : null;
    const ctaRate = null; // Fail closed: page daily rollup has no proven human/bot parity.
    const position = gsc.weight ? gsc.weightedPosition / gsc.weight : null;
    pageSummaries.push({ canonical: page.canonical, impressions: pageGscFresh ? gsc.impressions : null,
      clicks: pageGscFresh ? gsc.clicks : null, ctr: pageGscFresh ? ctr : null,
      views: null, ctaClicks: pageEventFresh ? ev.cta : null,
      unverifiedRollupViews:rollupFresh?rollup.views:null,
      ctaRate,
      ctaRateEvidenceStatus:'HUMAN_DENOMINATOR_NOT_VERIFIED',
      qualifiedLeads: incomplete ? null : results.has(page.canonical) ? business.qualifiedLeads : rollupFresh ? rollup.qualifiedLeads : null,
      orders: incomplete ? null : results.has(page.canonical) ? business.orders : rollupFresh ? rollup.orders : null,
      realizedRevenueEur: incomplete ? null : results.has(page.canonical) ? Number(business.realizedRevenueEur.toFixed(2)) : rollupFresh ? Number(rollup.realizedRevenueEur.toFixed(2)) : null });
    if (incomplete) continue;
    let action = null, reason = null, target = null, priority = 0, refs = [];
    if(rollupFresh && rollup.views>=50){
      // Measurement integrity, not bad human conversion, is the observed opportunity.
      action='evidence-gap';reason='human-pageview-and-cta-denominator-parity-unverified';
      target='human_primary_cta_measurement_coverage';priority=120+Math.log1p(rollup.views);
      refs=['growth_page_daily:'+page.canonical+':'+day];
    } else if (pageGscFresh && gsc.impressions >= 200 && ctr < 0.025) {
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
      terminal: { state: 'REJECTED_WITH_EVIDENCE',
        reason_code:action==='evidence-gap'?'HUMAN_CONVERSION_MEASUREMENT_UNVERIFIED':'NO_SAFE_REVERSIBLE_CHANGE',
        missing_or_conflicting_evidence:action==='evidence-gap'
          ? 'Daily page rollup and non-robot raw pageview/CTA attribution have no independently verified matching denominator; do not infer abandonment'
          : 'No independently validated challenger copy or protected delivery/readback for this observation',
        future_execution_condition:action==='evidence-gap'
          ? 'Verify first-party human-only pageview cohort and CTA tracking parity; preserve existing instrumentation PR ownership and provider readback'
          : 'Validated reversible challenger with exact-head CI, protected delivery, and independent production readback' }
    };
    if (validateOptimizationCandidate(proposal).length === 0) candidates.push(proposal);
  }
  candidates.sort((a, b) => b.priority - a.priority || a.canonical.localeCompare(b.canonical));
  return { day, sourceStatus, sourceFreshness: { gscFresh, eventFresh, truncated: incomplete,
      lastHumanPageViewAt:lastHumanView===null?null:new Date(lastHumanView).toISOString(),
      rawHumanPageViewFresh:rawHumanFresh,
      measurementStatus,ctaRateDenominatorVerified:false,
      botTrafficExcludedFromCtaDecision:true },
    pagesReviewed: pages.length, candidates: candidates.slice(0, 3), pages: pageSummaries,
    publicationStatus: 'NOT_PUBLISHED_REQUIRES_PROTECTED_DELIVERY',
    revenueEvidenceStatus: incomplete ? 'INCOMPLETE' : 'OBSERVED_ONLY' };
}
