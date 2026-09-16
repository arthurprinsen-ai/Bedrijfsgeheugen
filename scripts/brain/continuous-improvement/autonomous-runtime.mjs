import { createHash } from 'node:crypto';

export const FINGERPRINT = 'powerhouse-autonomous-improvement-runtime-v1';

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  }
  return value;
}

function hash(value) {
  return createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

export function buildRunId({ sourceSha = 'unknown', observedAt, evidence = [] } = {}) {
  const bucket = observedAt ? new Date(observedAt).toISOString().slice(0, 13) : 'unknown-time';
  return `air_${hash({ fingerprint: FINGERPRINT, sourceSha, bucket, evidence }).slice(0, 24)}`;
}

export function measureArchitectureFitness({ baseline = {}, current = {}, lowerIsBetter = [] } = {}) {
  const dimensions = {};
  const materialRegressions = [];
  const keys = [...new Set([...Object.keys(baseline), ...Object.keys(current)])].sort();
  for (const key of keys) {
    const before = baseline[key];
    const now = current[key];
    if (!finite(before) || !finite(now)) {
      dimensions[key] = { baseline: finite(before) ? before : null, current: finite(now) ? now : null, delta: null, percent_change: null, trend: 'unknown', material_regression: false };
      continue;
    }
    const delta = now - before;
    const percent = before === 0 ? null : (delta / Math.abs(before)) * 100;
    const inversion = lowerIsBetter.includes(key);
    const regression = inversion ? delta > 0 : delta < 0;
    const material = regression && (percent === null ? Math.abs(delta) > 0 : Math.abs(percent) >= 10);
    const row = {
      baseline: before,
      current: now,
      delta,
      percent_change: percent,
      trend: delta === 0 ? 'flat' : regression ? 'worse' : 'better',
      material_regression: material
    };
    dimensions[key] = row;
    if (material) materialRegressions.push({ dimension: key, ...row });
  }
  return { dimensions, material_regressions: materialRegressions };
}

export function buildCapabilityGraph({ capabilities = [], requirements = [] } = {}) {
  const nodes = capabilities.map(cap => ({
    id: String(cap.id),
    agents: [...new Set(cap.agents ?? [])].sort(),
    components: [...new Set(cap.components ?? [])].sort(),
    tools: [...new Set(cap.tools ?? [])].sort(),
    tests: [...new Set(cap.tests ?? [])].sort(),
    evidence: [...new Set(cap.evidence ?? [])].sort(),
    provides: [...new Set(cap.provides ?? [cap.id])].sort(),
    status: cap.status ?? 'unknown'
  })).sort((a, b) => a.id.localeCompare(b.id));

  const overlaps = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const shared = nodes[i].provides.filter(value => nodes[j].provides.includes(value));
      if (shared.length) overlaps.push({ a: nodes[i].id, b: nodes[j].id, provides: shared });
    }
  }
  const provided = new Set(nodes.flatMap(node => node.provides));
  const gaps = [...new Set(requirements.map(String))].filter(item => !provided.has(item)).sort();
  return { nodes, overlaps, gaps, projection_only: true };
}

export function decideExperimentPortfolio({ champion, challengers = [], primaryMetric, minimumObservations = 30, guardrails = [] } = {}) {
  const all = [champion, ...challengers].filter(Boolean).map(item => ({ ...item }));
  const eligible = all.filter(item => {
    if (!primaryMetric || !finite(item.metrics?.[primaryMetric])) return false;
    if ((item.observations ?? 0) < minimumObservations) return false;
    return guardrails.every(rule => {
      const value = item.metrics?.[rule.metric];
      if (!finite(value)) return false;
      if (rule.min !== undefined && value < rule.min) return false;
      if (rule.max !== undefined && value > rule.max) return false;
      return true;
    });
  });
  if (!eligible.length) return { decision: 'HOLD', winner: null, reason: 'insufficient evidence or guardrail failure', eligible: [] };
  const ordered = eligible.sort((a, b) => (b.metrics[primaryMetric] - a.metrics[primaryMetric]) || String(a.id).localeCompare(String(b.id)));
  const winner = ordered[0];
  const current = champion?.id;
  return {
    decision: winner.id === current ? 'KEEP_CHAMPION' : 'PROMOTE_CHALLENGER',
    winner: winner.id,
    eligible: ordered.map(item => item.id),
    primary_metric: primaryMetric,
    minimum_observations: minimumObservations
  };
}

export function assessCausalEvidence(input = {}) {
  const design = input.design ?? {};
  const randomized = design.type === 'randomized' && design.assignmentRecorded === true;
  const holdout = design.type === 'holdout' && design.controlGroup === true && design.assignmentRecorded === true;
  const quasi = design.type === 'quasi_experimental' && design.identificationAssumptionsDocumented === true && design.preTrendChecked === true;
  const contaminationOk = design.contaminationChecked !== false;
  const causalClaim = contaminationOk && (randomized || holdout || quasi);
  return {
    causalClaim,
    method: causalClaim ? design.type : null,
    limitation: causalClaim ? null : 'Correlation/attribution only: causal identification requirements are not satisfied.'
  };
}

export function replayPolicy({ events = [], baselineDecision, candidateDecision } = {}) {
  if (typeof baselineDecision !== 'function' || typeof candidateDecision !== 'function') throw new TypeError('baselineDecision and candidateDecision must be functions');
  const rows = events.map((event, index) => {
    const baseline = baselineDecision(event);
    const candidate = candidateDecision(event);
    return { index, event_id: event.id ?? String(index), baseline, candidate, changed: JSON.stringify(baseline) !== JSON.stringify(candidate) };
  });
  return { total: rows.length, changed: rows.filter(row => row.changed).length, rows, counterfactual_decisions_only: true };
}

export function runFailureInjection({ scenarios = [], handler } = {}) {
  if (typeof handler !== 'function') throw new TypeError('handler must be a function');
  const results = scenarios.map(scenario => {
    const outcome = handler({ ...scenario, synthetic: true });
    const expected = scenario.expected;
    const observed = outcome?.classification ?? outcome;
    return { id: scenario.id, synthetic: true, expected, observed, passed: expected === undefined ? true : observed === expected };
  });
  return { results, passed: results.every(item => item.passed), destructive: false };
}

export function findSimplificationCandidates({ capabilities = [], helpers = [], rules = [], docs = [], dependencies = [] } = {}) {
  const proposals = [];
  const groups = new Map();
  for (const cap of capabilities) {
    for (const provide of cap.provides ?? [cap.id]) {
      if (!groups.has(provide)) groups.set(provide, []);
      groups.get(provide).push(cap.id);
    }
  }
  for (const [provide, ids] of groups) if (ids.length > 1) proposals.push({ type: 'capability_overlap', key: provide, targets: ids.sort(), action: 'review_coalesce' });
  for (const item of [...helpers, ...rules, ...docs, ...dependencies]) {
    if ((item.usage_count ?? 0) === 0) proposals.push({ type: item.kind ?? 'unused', key: item.id, targets: [item.id], action: 'propose_remove_after_proof' });
  }
  return { proposals: proposals.sort((a, b) => `${a.type}:${a.key}`.localeCompare(`${b.type}:${b.key}`)), destructive_auto_delete: false };
}

function freshnessWeight(observedAt, now) {
  if (!observedAt) return null;
  const ageMs = Math.max(0, new Date(now).getTime() - new Date(observedAt).getTime());
  if (!Number.isFinite(ageMs)) return null;
  const days = ageMs / 86400000;
  return Math.exp(-days / 30);
}

export function prioritizeByBusinessValue({ candidates = [], now = new Date().toISOString() } = {}) {
  return candidates.map(candidate => {
    const value = candidate.realized_value;
    const confidence = candidate.confidence;
    const freshness = freshnessWeight(candidate.observed_at, now);
    const known = finite(value) && finite(confidence) && finite(freshness);
    return {
      ...candidate,
      value_priority: known ? value * Math.max(0, Math.min(1, confidence)) * freshness : null,
      value_known: known
    };
  }).sort((a, b) => {
    if (a.value_known !== b.value_known) return a.value_known ? -1 : 1;
    if (!a.value_known) return String(a.id).localeCompare(String(b.id));
    return (b.value_priority - a.value_priority) || String(a.id).localeCompare(String(b.id));
  });
}

export function buildAutonomousImprovementPacket(input = {}) {
  const observedAt = input.observedAt ?? new Date().toISOString();
  const runId = buildRunId({ sourceSha: input.sourceSha, observedAt, evidence: input.evidence ?? [] });
  const fitness = measureArchitectureFitness(input.fitness ?? {});
  const capabilityGraph = buildCapabilityGraph(input.capabilityGraph ?? {});
  const portfolio = decideExperimentPortfolio(input.experimentPortfolio ?? {});
  const causal = assessCausalEvidence(input.causalEvidence ?? {});
  const replay = input.replay ? replayPolicy(input.replay) : null;
  const chaos = input.chaos ? runFailureInjection(input.chaos) : null;
  const simplification = findSimplificationCandidates(input.simplification ?? {});
  const valueFeedback = prioritizeByBusinessValue({ ...(input.valueFeedback ?? {}), now: observedAt });
  return {
    fingerprint: FINGERPRINT,
    run_id: runId,
    observed_at: observedAt,
    source_sha: input.sourceSha ?? null,
    fitness,
    capability_graph: capabilityGraph,
    portfolio_decision: portfolio,
    causal_evidence: causal,
    replay_result: replay,
    chaos_result: chaos,
    simplification_candidates: simplification,
    value_feedback: valueFeedback,
    persistence_authority: 'existing Brain/Supabase writer routes only',
    projection_only: true
  };
}
