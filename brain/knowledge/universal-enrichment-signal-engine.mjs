import { normalizeKnowledgeEvent } from './knowledge-event.mjs';

const DAY_MS = 86_400_000;
const DEFAULT_STALE_AFTER_DAYS = 30;
const DEFAULT_CONFIDENCE_THRESHOLD = 0.9;

const SCORE_WEIGHTS = Object.freeze({
  problem_fit: 25,
  role_fit: 15,
  timing: 20,
  relationship_warmth: 10,
  commercial_value: 15,
  intent: 15,
});

const SIGNAL_RULES = Object.freeze([
  {
    type: 'leadership_change',
    fields: new Set(['executive_role', 'leadership', 'decision_maker']),
    severity: 0.9,
    matches: change => changed(change),
  },
  {
    type: 'job_change',
    fields: new Set(['person_role', 'employment', 'job_title', 'employer']),
    severity: 0.8,
    matches: change => changed(change),
  },
  {
    type: 'hiring_spike',
    fields: new Set(['job_openings', 'job_openings_data_ai', 'hiring_velocity']),
    severity: 0.8,
    matches: change => numericIncrease(change, { ratio: 2, delta: 3 }),
  },
  {
    type: 'technology_change',
    fields: new Set(['technology_stack', 'erp', 'crm', 'data_platform']),
    severity: 0.72,
    matches: change => changed(change),
  },
  {
    type: 'funding',
    fields: new Set(['funding', 'funding_round', 'investment']),
    severity: 0.86,
    matches: change => changed(change),
  },
  {
    type: 'acquisition',
    fields: new Set(['acquisition', 'ownership', 'investor']),
    severity: 0.92,
    matches: change => changed(change),
  },
  {
    type: 'transformation_initiative',
    fields: new Set(['strategy', 'transformation', 'ai_initiative', 'data_initiative', 'erp_program']),
    severity: 0.82,
    matches: change => changed(change),
  },
  {
    type: 'website_intent',
    fields: new Set(['website_intent', 'account_intent', 'high_intent_page_score']),
    severity: 0.84,
    matches: change => Number(change.after) >= 0.65 && Number(change.after) > Number(change.before ?? 0),
  },
]);

const clean = value => String(value ?? '').trim();
const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
const round = (value, digits = 4) => Number(Number(value).toFixed(digits));
const clone = value => structuredClone(value);

function iso(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function factFromEvidence(input, fallbackSource = 'unknown', now = () => new Date().toISOString()) {
  if (input && typeof input === 'object' && Object.hasOwn(input, 'value')) {
    const observedAt = iso(input.observed_at ?? input.observedAt ?? now()) ?? now();
    const ev = {
      source: clean(input.source) || fallbackSource,
      value: clone(input.value),
      confidence: clamp01(input.confidence ?? 0.5),
      observed_at: observedAt,
      source_ref: input.source_ref ?? input.sourceRef ?? null,
    };
    return {
      value: clone(input.value),
      confidence: ev.confidence,
      observed_at: observedAt,
      evidence: [ev],
      conflicts: [],
    };
  }

  return {
    value: clone(input),
    confidence: 0.5,
    observed_at: now(),
    evidence: [{ source: fallbackSource, value: clone(input), confidence: 0.5, observed_at: now(), source_ref: null }],
    conflicts: [],
  };
}

function normalizedFact(input, fallbackSource, now) {
  if (input && typeof input === 'object' && Array.isArray(input.evidence) && Object.hasOwn(input, 'value')) {
    return {
      value: clone(input.value),
      confidence: clamp01(input.confidence),
      observed_at: iso(input.observed_at ?? input.observedAt ?? now()) ?? now(),
      evidence: clone(input.evidence),
      conflicts: clone(Array.isArray(input.conflicts) ? input.conflicts : []),
    };
  }
  return factFromEvidence(input, fallbackSource, now);
}

function valuesCorroborate(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a === 'string' && typeof b === 'string') {
    return clean(a).toLocaleLowerCase() === clean(b).toLocaleLowerCase();
  }
  if (Number.isFinite(Number(a)) && Number.isFinite(Number(b))) {
    const x = Number(a);
    const y = Number(b);
    if (x === y) return true;
    const base = Math.max(Math.abs(x), Math.abs(y), 1);
    return Math.abs(x - y) / base <= 0.1;
  }
  return false;
}

function mergeCorroboratingFact(current, incoming) {
  const combinedConfidence = 1 - ((1 - clamp01(current.confidence)) * (1 - clamp01(incoming.confidence)));
  const freshest = new Date(current.observed_at).getTime() >= new Date(incoming.observed_at).getTime()
    ? current.observed_at
    : incoming.observed_at;
  return {
    ...clone(current),
    confidence: round(combinedConfidence),
    observed_at: freshest,
    evidence: [...clone(current.evidence ?? []), ...clone(incoming.evidence ?? [])],
    conflicts: clone(current.conflicts ?? []),
  };
}

function mergeConflictingFact(current, incoming) {
  const conflictPenalty = Math.min(0.35, 0.12 + (clamp01(incoming.confidence) * 0.18));
  return {
    ...clone(current),
    confidence: round(clamp01(current.confidence) * (1 - conflictPenalty)),
    evidence: [...clone(current.evidence ?? []), ...clone(incoming.evidence ?? [])],
    conflicts: [
      ...clone(current.conflicts ?? []),
      {
        value: clone(incoming.value),
        confidence: clamp01(incoming.confidence),
        observed_at: incoming.observed_at,
        evidence: clone(incoming.evidence ?? []),
      },
    ],
  };
}

function mergeFact(current, incoming) {
  if (!current) return clone(incoming);
  return valuesCorroborate(current.value, incoming.value)
    ? mergeCorroboratingFact(current, incoming)
    : mergeConflictingFact(current, incoming);
}

function fieldSatisfied(fact, threshold) {
  return Boolean(fact && clamp01(fact.confidence) >= threshold && (fact.conflicts?.length ?? 0) === 0);
}

function provenanceFor(field, fact) {
  return (fact.evidence ?? []).map(item => ({
    field,
    source: item.source,
    source_ref: item.source_ref ?? null,
    observed_at: item.observed_at,
    confidence: clamp01(item.confidence),
    value: clone(item.value),
  }));
}

export async function enrichKnowledgeEntity({
  entity,
  providers = [],
  requiredFields = [],
  confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD,
  now = () => new Date().toISOString(),
} = {}) {
  if (!entity?.id || !entity?.kind) throw new Error('entity.id and entity.kind are required');

  const facts = {};
  for (const [field, value] of Object.entries(entity.facts ?? {})) {
    facts[field] = normalizedFact(value, 'canonical_state', now);
  }

  const threshold = clamp01(confidenceThreshold || DEFAULT_CONFIDENCE_THRESHOLD);
  const orderedProviders = [...providers].sort((a, b) => Number(a.priority ?? 100) - Number(b.priority ?? 100));
  const providerRuns = [];
  const initialEvidenceCounts = Object.fromEntries(Object.entries(facts).map(([field, fact]) => [field, fact.evidence?.length ?? 0]));

  const isComplete = () => requiredFields.length > 0 && requiredFields.every(field => fieldSatisfied(facts[field], threshold));

  if (!isComplete()) {
    for (const provider of orderedProviders) {
      if (!provider || typeof provider.enrich !== 'function') continue;
      if (typeof provider.supports === 'function' && !provider.supports(entity.kind)) continue;

      const requestedFields = requiredFields.filter(field => !fieldSatisfied(facts[field], threshold));
      if (requestedFields.length === 0) break;

      const response = await provider.enrich({ entity: clone(entity), facts: clone(facts), requestedFields });
      const returnedFields = [];
      for (const [field, rawIncoming] of Object.entries(response ?? {})) {
        if (rawIncoming === undefined || rawIncoming === null) continue;
        const incoming = normalizedFact(rawIncoming, clean(provider.id) || 'provider', now);
        facts[field] = mergeFact(facts[field], incoming);
        returnedFields.push(field);
      }
      providerRuns.push(Object.freeze({ provider_id: clean(provider.id) || 'provider', requested_fields: requestedFields, returned_fields: returnedFields }));
      if (isComplete()) break;
    }
  }

  const provenance = [];
  for (const [field, fact] of Object.entries(facts)) {
    const all = provenanceFor(field, fact);
    const skip = initialEvidenceCounts[field] ?? 0;
    provenance.push(...all.slice(skip));
  }

  const dataHealth = calculateDataHealth({ facts, requiredFields, now });
  return Object.freeze({
    schema_version: 'powerhouse.universal-enrichment.v1',
    entity_id: entity.id,
    entity_kind: entity.kind,
    enriched_at: now(),
    facts: clone(facts),
    provenance: Object.freeze(provenance),
    provider_runs: Object.freeze(providerRuns),
    data_health: dataHealth,
  });
}

export function calculateDataHealth({
  facts = {},
  requiredFields = [],
  now = () => new Date().toISOString(),
  staleAfterDays = DEFAULT_STALE_AFTER_DAYS,
} = {}) {
  const nowDate = new Date(now());
  const required = [...new Set(requiredFields)];
  const missingFields = required.filter(field => !facts[field] || facts[field].value === null || facts[field].value === undefined || facts[field].value === '');
  const presentFields = required.filter(field => !missingFields.includes(field));
  const staleFields = presentFields.filter(field => {
    const observed = new Date(facts[field].observed_at ?? 0);
    return !Number.isFinite(observed.getTime()) || (nowDate.getTime() - observed.getTime()) > staleAfterDays * DAY_MS;
  });
  const conflictedFields = presentFields.filter(field => (facts[field].conflicts?.length ?? 0) > 0);
  const lowConfidenceFields = presentFields.filter(field => clamp01(facts[field].confidence) < 0.7);
  const coverage = required.length === 0 ? 1 : presentFields.length / required.length;
  const penaltyBase = Math.max(required.length, 1);
  const penalty = ((staleFields.length * 0.2) + (conflictedFields.length * 0.3) + (lowConfidenceFields.length * 0.15)) / penaltyBase;
  const score = round(Math.max(0, Math.min(1, coverage - penalty)));

  let nextRefreshAt;
  if (missingFields.length || staleFields.length || conflictedFields.length) {
    nextRefreshAt = nowDate.toISOString();
  } else {
    const oldestObserved = presentFields
      .map(field => new Date(facts[field].observed_at).getTime())
      .filter(Number.isFinite)
      .sort((a, b) => a - b)[0] ?? nowDate.getTime();
    nextRefreshAt = new Date(oldestObserved + staleAfterDays * DAY_MS).toISOString();
  }

  return Object.freeze({
    schema_version: 'powerhouse.data-health.v1',
    score,
    coverage,
    missing_fields: Object.freeze(missingFields),
    stale_fields: Object.freeze(staleFields),
    conflicted_fields: Object.freeze(conflictedFields),
    low_confidence_fields: Object.freeze(lowConfidenceFields),
    assessed_at: nowDate.toISOString(),
    next_refresh_at: nextRefreshAt,
  });
}

function changed(change) {
  return JSON.stringify(change?.before) !== JSON.stringify(change?.after);
}

function numericIncrease(change, { ratio, delta }) {
  const before = Number(change?.before ?? 0);
  const after = Number(change?.after ?? 0);
  if (!Number.isFinite(before) || !Number.isFinite(after) || after <= before) return false;
  return after - before >= delta && after >= Math.max(before * ratio, delta);
}

export function detectCommercialSignals({ entityId, changes = [], now = () => new Date().toISOString() } = {}) {
  if (!entityId) throw new Error('entityId is required');
  const signals = [];

  for (const change of changes) {
    for (const rule of SIGNAL_RULES) {
      if (!rule.fields.has(change.field) || !rule.matches(change)) continue;
      const evidence = clone(Array.isArray(change.evidence) ? change.evidence : []);
      const confidence = round(clamp01(change.confidence ?? Math.max(...evidence.map(item => clamp01(item.confidence)), 0.5)));
      signals.push(Object.freeze({
        schema_version: 'powerhouse.commercial-signal.v1',
        signal_id: `${entityId}:${rule.type}:${change.field}:${now()}`,
        entity_id: entityId,
        type: rule.type,
        field: change.field,
        before: clone(change.before),
        after: clone(change.after),
        severity: rule.severity,
        confidence,
        evidence: Object.freeze(evidence),
        observed_at: now(),
      }));
      break;
    }
  }

  return Object.freeze(signals);
}

function nextBestAction(score, dimensions) {
  if (score >= 80 && dimensions.intent >= 0.7 && dimensions.role_fit >= 0.7) {
    return Object.freeze({ type: 'personal_outreach', priority: 'high', rationale: 'High fit, active intent and decision-maker relevance.' });
  }
  if (score >= 65) {
    return Object.freeze({ type: 'relationship_warmup', priority: 'medium', rationale: 'Strong opportunity; improve timing, intent or relationship evidence before direct outreach.' });
  }
  if (score >= 45) {
    return Object.freeze({ type: 'nurture_with_relevant_content', priority: 'normal', rationale: 'Potential fit exists but commercial readiness is incomplete.' });
  }
  return Object.freeze({ type: 'observe_and_enrich', priority: 'low', rationale: 'Evidence is currently insufficient for commercial activation.' });
}

export function scoreOpportunity({ dimensions = {}, confidence = 0.5, evidenceRefs = [] } = {}) {
  const normalizedDimensions = Object.fromEntries(Object.keys(SCORE_WEIGHTS).map(key => [key, clamp01(dimensions[key])]));
  const contributions = Object.entries(SCORE_WEIGHTS).map(([dimension, weight]) => ({
    dimension,
    weight,
    value: normalizedDimensions[dimension],
    points: round(normalizedDimensions[dimension] * weight, 2),
  }));
  const score = round(contributions.reduce((sum, item) => sum + item.points, 0), 1);
  const reasons = contributions
    .filter(item => item.value >= 0.7)
    .sort((a, b) => b.points - a.points)
    .slice(0, 4)
    .map(item => `${item.dimension} contributes ${item.points}/${item.weight} points`);

  return Object.freeze({
    schema_version: 'powerhouse.explainable-opportunity-score.v1',
    score,
    confidence: clamp01(confidence),
    contributions: Object.freeze(contributions),
    reasons: Object.freeze(reasons),
    evidence_refs: Object.freeze([...evidenceRefs]),
    next_best_action: nextBestAction(score, normalizedDimensions),
  });
}

export function buildEnrichmentKnowledgeEvents(enrichment, { actor = { type: 'service', id: 'universal-enrichment-engine' }, now = () => new Date().toISOString() } = {}) {
  if (!enrichment?.entity_id) throw new Error('enrichment.entity_id is required');
  return Object.freeze(Object.entries(enrichment.facts ?? {}).map(([field, fact]) => {
    const refs = (fact.evidence ?? []).map(item => item.source_ref || `${item.source}:${field}`).filter(Boolean);
    return normalizeKnowledgeEvent({
      source_type: 'agent',
      source_refs: refs.length ? refs : [`entity:${enrichment.entity_id}`],
      actor,
      component: 'universal-enrichment-signal-engine',
      architecture_layer: 'knowledge',
      intent: 'ENRICH_CANONICAL_KNOWLEDGE',
      classification: 'IMPROVEMENT',
      confidence: fact.confidence,
      context_summary: `Enriched ${enrichment.entity_id}.${field}`,
      evidence: clone(fact.evidence ?? []),
      outcome: { status: 'success', summary: `Canonical candidate fact ${field} enriched with evidence lineage.` },
      health_signal: enrichment.data_health,
      next_decision: { action: 'project_to_canonical_state', entity_id: enrichment.entity_id, field, value: clone(fact.value) },
    }, { now });
  }));
}

export function buildSignalKnowledgeEvents(signals = [], { actor = { type: 'service', id: 'universal-enrichment-engine' }, now = () => new Date().toISOString() } = {}) {
  return Object.freeze(signals.map(signal => normalizeKnowledgeEvent({
    source_type: 'agent',
    source_refs: (signal.evidence ?? []).map(item => item.source_ref || `${item.source}:${signal.field}`).filter(Boolean).length
      ? (signal.evidence ?? []).map(item => item.source_ref || `${item.source}:${signal.field}`).filter(Boolean)
      : [`signal:${signal.signal_id}`],
    actor,
    component: 'universal-enrichment-signal-engine',
    architecture_layer: 'knowledge',
    intent: 'REGISTER_COMMERCIAL_SIGNAL',
    classification: 'OPPORTUNITY',
    confidence: signal.confidence,
    context_summary: `${signal.type} detected for ${signal.entity_id}`,
    evidence: clone(signal.evidence ?? []),
    outcome: { status: 'success', summary: `Commercial signal ${signal.type} created from canonical knowledge change.` },
    next_decision: { action: 'recalculate_opportunity', entity_id: signal.entity_id, signal_type: signal.type },
  }, { now })));
}

export const ENRICHMENT_SIGNAL_CONTRACT = Object.freeze({
  version: 'UNIVERSAL-ENRICHMENT-SIGNAL-v1',
  canonicalTruth: 'Company Graph / Canonical State',
  principles: Object.freeze([
    'existing canonical knowledge is provider zero',
    'all external facts retain evidence lineage',
    'corroboration increases confidence',
    'contradictions are preserved and reduce confidence',
    'stale or incomplete facts create refresh obligations',
    'signals feed opportunity recalculation rather than a parallel truth store',
  ]),
  signalTypes: Object.freeze(SIGNAL_RULES.map(rule => rule.type)),
  scoringWeights: SCORE_WEIGHTS,
});
