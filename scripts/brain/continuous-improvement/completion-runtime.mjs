import { createHash } from 'node:crypto';

export const IMPROVEMENT_FINGERPRINT = 'powerhouse-autonomous-improvement-runtime-v1';
export const IMPROVEMENT_LIFECYCLE = Object.freeze(['OBSERVED','EXPERIMENTING','PROVEN','PROMOTED','PROD_VERIFIED','VALUE_VERIFIED','LEARNED']);
const HARD_BOUNDARIES = new Set(['external_communication','customer_data','privileges_or_secrets','destructive_schema','large_spend','rollback_unavailable']);
const DEFAULT_EVIDENCE = Object.freeze(['replay','experiment','guardrails','rollback','production_readback','value','learning_writeback']);

const clean = value => String(value ?? '').trim();
const finite = value => typeof value === 'number' && Number.isFinite(value);
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
function digest(value) { return createHash('sha256').update(JSON.stringify(stable(value))).digest('hex'); }
function causalAssessment(design = {}) {
  const randomized = design.type === 'randomized' && design.assignmentRecorded === true;
  const holdout = design.type === 'holdout' && design.controlGroup === true && design.assignmentRecorded === true;
  const quasi = design.type === 'quasi_experimental' && design.identificationAssumptionsDocumented === true && design.preTrendChecked === true;
  const causal = design.contaminationChecked !== false && (randomized || holdout || quasi);
  return { causal, method: causal ? design.type : null };
}

export function buildImprovementObligation(candidate = {}, { observedAt = new Date().toISOString() } = {}) {
  if (!clean(candidate.id)) throw new TypeError('candidate.id is required');
  if (!clean(candidate.hypothesis)) throw new TypeError('candidate.hypothesis is required');
  const obligationId = `air-obligation:${digest({ id: candidate.id, signal: candidate.signal, hypothesis: candidate.hypothesis }).slice(0, 24)}`;
  return {
    obligation_id: obligationId,
    fingerprint: IMPROVEMENT_FINGERPRINT,
    candidate_id: candidate.id,
    signal: candidate.signal ?? null,
    hypothesis: candidate.hypothesis,
    hypothesis_class: candidate.hypothesis_class ?? candidate.signal ?? 'general',
    owner: candidate.owner ?? 'bedrijfsgeheugen-powerhouse',
    executor: candidate.executor ?? 'agent-fabric',
    lifecycle: 'OBSERVED',
    blocker: null,
    baseline: candidate.baseline ?? null,
    success_metric: { metric: candidate.metric ?? null, target: candidate.target ?? null },
    guardrails: candidate.guardrails ?? ['security','correctness','tenant_isolation'],
    rollback: candidate.rollback ?? 'required_before_promotion',
    budget: candidate.budget ?? null,
    evidence_requirements: [...DEFAULT_EVIDENCE],
    evidence: [],
    expected_business_outcome: candidate.expected_business_outcome ?? null,
    autonomy: classifyAutonomyBoundary(candidate),
    observed_at: observedAt,
    updated_at: observedAt,
    same_obligation_resume: true
  };
}

export function advanceImprovementLifecycle(obligation = {}, transition = {}) {
  if (!IMPROVEMENT_LIFECYCLE.includes(obligation.lifecycle)) throw new TypeError('invalid obligation lifecycle');
  const now = transition.observedAt ?? new Date().toISOString();
  if (transition.blocker) return { ...obligation, blocker: { ...transition.blocker, status: 'ACTIVE', observed_at: now }, updated_at: now, same_obligation_resume: true };
  if (transition.blockerCleared) return { ...obligation, blocker: null, updated_at: now, same_obligation_resume: true };
  const target = transition.to;
  if (!target) return { ...obligation, updated_at: now };
  if (!IMPROVEMENT_LIFECYCLE.includes(target)) throw new TypeError('invalid target lifecycle');
  const fromIndex = IMPROVEMENT_LIFECYCLE.indexOf(obligation.lifecycle);
  const toIndex = IMPROVEMENT_LIFECYCLE.indexOf(target);
  if (toIndex !== fromIndex + 1) throw new Error(`missing required evidence: lifecycle must advance one stage at a time (${obligation.lifecycle} -> ${target})`);
  const evidence = [...new Set([...(obligation.evidence ?? []), ...(transition.evidence ?? [])])];
  if (target === 'EXPERIMENTING' && evidence.length === 0) throw new Error('missing required evidence: replay evidence required');
  if (target === 'PROVEN') {
    const min = Number(transition.minimumObservations ?? 30);
    if (Number(transition.observations ?? 0) < min) throw new Error('missing required evidence: minimum observations not met');
    const g = transition.guardrails ?? {};
    for (const key of ['security','correctness','tenant_isolation','rollback_ready']) if (g[key] !== true) throw new Error(`missing required evidence: ${key} guardrail`);
    if (evidence.length < 2) throw new Error('missing required evidence: experiment evidence required');
  }
  if (['PROMOTED','PROD_VERIFIED','VALUE_VERIFIED','LEARNED'].includes(target) && evidence.length === 0) throw new Error(`missing required evidence: ${target}`);
  return { ...obligation, lifecycle: target, evidence, blocker: null, updated_at: now };
}

export function executeReplayExperiment({ events = [], champion, challenger, primaryMetric, minimumObservations = 30, guardrails = {} } = {}) {
  if (typeof champion !== 'function' || typeof challenger !== 'function') throw new TypeError('champion and challenger must be functions');
  const rows = events.map((event, index) => ({ event_id: event.id ?? String(index), champion: champion(event), challenger: challenger(event) }));
  const guardrailsPassed = ['security','correctness','tenant_isolation','rollback_ready'].every(key => guardrails[key] === true);
  const metricKnown = Boolean(primaryMetric) && rows.every(row => finite(row.champion?.[primaryMetric]) && finite(row.challenger?.[primaryMetric]));
  const enough = rows.length >= minimumObservations;
  const challengerBetter = metricKnown && rows.reduce((sum, row) => sum + (row.champion[primaryMetric] - row.challenger[primaryMetric]), 0) > 0;
  return { executed: true, observations: rows.length, primary_metric: primaryMetric ?? null, rows, guardrails_passed: guardrailsPassed, minimum_observations_met: enough, decision: enough && guardrailsPassed && metricKnown && challengerBetter ? 'CHALLENGER_ELIGIBLE' : 'HOLD', counterfactual_only: true, production_mutation: false };
}

export function runSafeChaosSuite({ scenarios = [], handler } = {}) {
  if (typeof handler !== 'function') throw new TypeError('handler must be a function');
  const results = scenarios.map((entry, index) => {
    const scenario = typeof entry === 'string' ? { id: entry } : { ...entry };
    const observed = handler({ ...scenario, synthetic: true, isolated: true });
    const passed = observed?.recovered === true && observed?.idempotent === true && observed?.consistent === true && observed?.isolated === true;
    return { id: scenario.id ?? String(index), synthetic: true, isolated: true, passed, observed };
  });
  return { results, passed: results.length > 0 && results.every(row => row.passed), destructive: false, production_target: false };
}

export function buildCapabilityInventory({ capabilities = [], requirements = [], now = new Date().toISOString(), staleAfterDays = 60 } = {}) {
  const normalized = capabilities.map(cap => ({ ...cap, id: clean(cap.id), provides: [...new Set(cap.provides ?? [cap.id])].map(String).sort() })).filter(cap => cap.id);
  const overlaps = [];
  for (let i = 0; i < normalized.length; i += 1) for (let j = i + 1; j < normalized.length; j += 1) {
    const shared = normalized[i].provides.filter(value => normalized[j].provides.includes(value));
    if (shared.length) overlaps.push({ a: normalized[i].id, b: normalized[j].id, provides: shared });
  }
  const provided = new Set(normalized.flatMap(cap => cap.provides));
  const gaps = [...new Set(requirements.map(String))].filter(req => !provided.has(req)).sort();
  const nowMs = new Date(now).getTime();
  const simplificationCandidates = normalized.filter(cap => {
    const observedMs = cap.last_observed_at ? new Date(cap.last_observed_at).getTime() : NaN;
    const stale = Number.isFinite(observedMs) ? (nowMs - observedMs) / 86400000 >= staleAfterDays : true;
    return Number(cap.usage_count ?? 0) === 0 || stale;
  }).map(cap => ({ id: cap.id, reason: Number(cap.usage_count ?? 0) === 0 ? 'unused' : 'stale', auto_delete: false, requires_dependency_proof: true, requires_replay_and_tests: true, rollback_required: true }));
  return { generated_at: now, capabilities: normalized, overlaps, gaps, simplification_candidates: simplificationCandidates, new_persistent_authority: false };
}

export function selectTechnologyCandidates({ inventory = {}, discoveries = [] } = {}) {
  const relevant = new Set([...(inventory.capabilities ?? []).flatMap(cap => cap.provides ?? []), ...(inventory.gaps ?? [])]);
  return discoveries.filter(item => item.stable === true && (item.capabilities ?? []).some(cap => relevant.has(cap))).map(item => ({ ...item, requires_benchmark: true, requires_replay: true, requires_challenger: true, auto_upgrade: false, source_relevance_proven: true })).sort((a, b) => Number(Boolean(b.security_improvement)) - Number(Boolean(a.security_improvement)) || String(a.id).localeCompare(String(b.id)));
}

export function buildSchedulerProvenance({ invocationSource, jobName, scheduledMinute, invokedAt, cronRunId } = {}) {
  const minute = invokedAt ? new Date(invokedAt).getUTCMinutes() : null;
  const natural = invocationSource === 'pg_cron' && clean(jobName) === 'powerhouse-autonomous-improvement-cycle-v1' && Number.isInteger(cronRunId) && minute === Number(scheduledMinute);
  return { invocation_source: invocationSource ?? null, job_name: jobName ?? null, cron_run_id: cronRunId ?? null, invoked_at: invokedAt ?? null, scheduled_minute: scheduledMinute ?? null, natural_scheduler_run: natural, scheduler_proven: natural };
}

export function classifyAutonomyBoundary(input = {}) {
  const boundary = clean(input.boundary);
  if (HARD_BOUNDARIES.has(boundary)) return { decision: 'FAIL_CLOSED', boundary, reason: 'hard autonomy boundary' };
  if (input.reversible === true && (input.risk === 'low' || input.risk === 'very_low')) return { decision: 'AUTO_ALLOWED', boundary: null, reason: 'low-risk reversible improvement' };
  return { decision: 'REVIEW_REQUIRED', boundary: boundary || null, reason: 'autonomy proof insufficient' };
}

export function buildValueLineage({ changeId, exposureId, outcomeId, realizedValue, unit, confidence, design = {}, baseline = null, control = null } = {}) {
  const { causal, method } = causalAssessment(design);
  return { change_id: changeId ?? null, exposure_id: exposureId ?? null, outcome_id: outcomeId ?? null, realized_value: finite(realizedValue) ? realizedValue : null, unit: unit ?? null, confidence: finite(confidence) ? clamp(confidence) : null, baseline, control, causal_claim: causal, causal_method: method, attribution_class: causal ? 'CAUSAL' : 'CORRELATION', revenue_must_be_observed: unit === 'eur', invented_value: false };
}

export function buildMetaLearningPolicy(runs = []) {
  const groups = new Map();
  for (const run of runs) {
    const key = `${run.hypothesis_class ?? 'general'}::${run.executor ?? 'unknown'}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(run);
  }
  return [...groups.entries()].map(([key, rows]) => {
    const [hypothesisClass, executor] = key.split('::');
    const successes = rows.filter(row => row.success === true).length;
    const cost = rows.reduce((sum, row) => sum + Math.max(0, Number(row.cost ?? 0)), 0);
    const value = rows.reduce((sum, row) => sum + Math.max(0, Number(row.realized_value ?? 0)), 0);
    const duration = rows.reduce((sum, row) => sum + Math.max(0, Number(row.duration_ms ?? 0)), 0) / Math.max(rows.length, 1);
    const successRate = successes / rows.length;
    const roi = cost > 0 ? value / cost : value > 0 ? value : 0;
    const speed = 1 / Math.max(1, Math.log10(duration + 10));
    const multiplier = Number((0.5 + successRate + Math.min(2, roi / 10) + speed / 2).toFixed(4));
    return { hypothesis_class: hypothesisClass, executor, sample_size: rows.length, success_rate: successRate, realized_value: value, cost, avg_duration_ms: duration, priority_multiplier: multiplier, recommended_sample_multiplier: successRate < 0.5 ? 1.5 : 1, recommended_test_depth: successRate < 0.5 ? 'DEEPER' : 'STANDARD' };
  }).sort((a, b) => b.priority_multiplier - a.priority_multiplier || `${a.hypothesis_class}:${a.executor}`.localeCompare(`${b.hypothesis_class}:${b.executor}`));
}

export function buildExecutiveImprovementProjection({ obligations = [], scheduler = {}, inventory = {}, metaLearning = [] } = {}) {
  return { fingerprint: IMPROVEMENT_FINGERPRINT, new_persistent_authority: false, authority: 'existing Brain/Supabase', scheduler, obligations: obligations.map(item => ({ obligation_id: item.obligation_id, lifecycle: item.lifecycle, blocker: item.blocker ?? null, drilldown: { change_sha: item.change_sha ?? null, evidence: item.evidence ?? [], candidate_id: item.candidate_id ?? null } })), inventory: { overlaps: inventory.overlaps ?? [], gaps: inventory.gaps ?? [], simplification_candidates: inventory.simplification_candidates ?? [] }, meta_learning: metaLearning, lifecycle: [...IMPROVEMENT_LIFECYCLE] };
}
