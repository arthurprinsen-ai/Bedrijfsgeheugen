import { detectCommercialSignals } from './universal-enrichment-signal-engine.mjs';

const DAY_MS = 86_400_000;
const clean = value => String(value ?? '').trim();
const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
const round = (value, digits = 4) => Number(Number(value).toFixed(digits));
const clone = value => structuredClone(value);

const PAGE_ROLE_WEIGHT = Object.freeze({
  conversion: 1,
  money: 0.9,
  product: 0.82,
  service: 0.8,
  case: 0.68,
  editorial: 0.42,
  navigation: 0.28,
});

const FUNNEL_WEIGHT = Object.freeze({
  decision: 1,
  consideration: 0.82,
  awareness: 0.42,
  retention: 0.35,
});

function timestamp(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.getTime() : 0;
}

function stableEvents(events = []) {
  const seen = new Set();
  return events
    .filter(event => event?.event_id && !seen.has(event.event_id) && seen.add(event.event_id))
    .map(clone)
    .sort((a, b) => timestamp(b.occurred_at) - timestamp(a.occurred_at));
}

function visitorKey(events) {
  for (const field of ['account_resolution_key', 'anonymous_id', 'session_id']) {
    const value = events.find(event => clean(event?.[field]))?.[field];
    if (clean(value)) return { field, value: clean(value) };
  }
  return null;
}

function recencyFactor(event, nowMs) {
  const age = Math.max(0, nowMs - timestamp(event.occurred_at));
  const days = age / DAY_MS;
  if (days <= 1) return 1;
  if (days <= 7) return 0.82;
  if (days <= 30) return 0.58;
  return 0.3;
}

function eventIntentScore(event, nowMs) {
  const page = PAGE_ROLE_WEIGHT[clean(event.page_role).toLowerCase()] ?? 0.5;
  const funnel = FUNNEL_WEIGHT[clean(event.funnel_stage).toLowerCase()] ?? 0.5;
  const explicitIntent = clean(event.intent || event.intent_id) ? 1 : 0.55;
  const recency = recencyFactor(event, nowMs);
  return round((page * 0.4 + funnel * 0.35 + explicitIntent * 0.15 + recency * 0.1) * recency);
}

async function resolveAccount(events, accountResolvers) {
  const key = visitorKey(events);
  if (!key) return null;
  const ordered = [...accountResolvers].sort((a, b) => Number(a.priority ?? 100) - Number(b.priority ?? 100));
  for (const resolver of ordered) {
    if (!resolver || typeof resolver.resolve !== 'function') continue;
    const resolved = await resolver.resolve({
      [key.field]: key.value,
      resolution_key: key,
      events: clone(events),
    });
    if (!resolved?.company_id) continue;
    return {
      company_id: clean(resolved.company_id),
      company_name: clean(resolved.company_name) || null,
      confidence: clamp01(resolved.confidence ?? 0.5),
      source: clean(resolved.source) || clean(resolver.id) || 'account-resolver',
      source_ref: clean(resolved.source_ref) || null,
      resolution_key: key,
    };
  }
  return null;
}

function aggregateIntent(events, account, nowIso) {
  const nowMs = timestamp(nowIso);
  const evidence = events.map(event => ({
    event_id: event.event_id,
    canonical: event.canonical ?? null,
    page_role: event.page_role ?? null,
    funnel_stage: event.funnel_stage ?? null,
    intent: event.intent ?? event.intent_id ?? null,
    occurred_at: event.occurred_at ?? null,
    event_score: eventIntentScore(event, nowMs),
  })).sort((a, b) => b.event_score - a.event_score || timestamp(b.occurred_at) - timestamp(a.occurred_at));

  const top = evidence.slice(0, 5);
  const weighted = top.reduce((sum, item, index) => sum + item.event_score * (1 / (index + 1)), 0);
  const divisor = top.reduce((sum, _item, index) => sum + (1 / (index + 1)), 0) || 1;
  const repetitionLift = Math.min(0.12, Math.max(0, events.length - 1) * 0.04);
  const score = round(Math.min(1, weighted / divisor + repetitionLift));
  const confidence = round(Math.min(1, account.confidence * 0.7 + Math.min(1, events.length / 3) * 0.3));

  return Object.freeze({
    schema_version: 'powerhouse.website-account-intent.v1',
    score,
    confidence,
    evidence: Object.freeze(top),
    observed_at: nowIso,
  });
}

export async function resolveWebsiteAccountIntent({
  events = [],
  accountResolvers = [],
  previousIntentScore = 0,
  now = () => new Date().toISOString(),
} = {}) {
  const uniqueEvents = stableEvents(events);
  if (uniqueEvents.length === 0) {
    return Object.freeze({ account: null, events: Object.freeze([]), intent: null, signal: null, activation_allowed: false, reason: 'events-missing' });
  }

  const account = await resolveAccount(uniqueEvents, accountResolvers);
  if (!account) {
    return Object.freeze({
      schema_version: 'powerhouse.website-account-intent-resolution.v1',
      account: null,
      events: Object.freeze(uniqueEvents),
      intent: null,
      signal: null,
      activation_allowed: false,
      reason: 'account-unresolved',
    });
  }

  const observedAt = now();
  const intent = aggregateIntent(uniqueEvents, account, observedAt);
  const [signal = null] = detectCommercialSignals({
    entityId: account.company_id,
    changes: [{
      field: 'website_intent',
      before: clamp01(previousIntentScore),
      after: intent.score,
      confidence: intent.confidence,
      evidence: intent.evidence.map(item => ({
        source: 'website',
        source_ref: `growth-event:${item.event_id}`,
        value: { canonical: item.canonical, score: item.event_score, intent: item.intent },
        confidence: intent.confidence,
        observed_at: item.occurred_at || observedAt,
      })),
    }],
    now: () => observedAt,
  });

  return Object.freeze({
    schema_version: 'powerhouse.website-account-intent-resolution.v1',
    account: Object.freeze(account),
    events: Object.freeze(uniqueEvents),
    intent,
    signal,
    activation_allowed: Boolean(signal && account.confidence >= 0.7 && intent.confidence >= 0.7),
    reason: signal ? 'intent-resolved' : 'intent-below-signal-threshold',
    next_decision: signal ? Object.freeze({ action: 'recalculate_opportunity', entity_id: account.company_id, signal_type: signal.type }) : null,
  });
}

export const WEBSITE_ACCOUNT_INTENT_CONTRACT = Object.freeze({
  version: 'WEBSITE-ACCOUNT-INTENT-v1',
  canonicalTruth: 'Company Graph / Canonical State',
  parallelVisitorTruthStore: false,
  sourceContract: '/api/growth-event',
  nextDecision: 'recalculate_opportunity',
  failClosed: Object.freeze([
    'no company activation when account is unresolved',
    'no company activation below account confidence threshold',
    'all intent evidence retains growth-event lineage',
  ]),
});
