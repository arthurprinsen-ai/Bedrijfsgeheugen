import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildImprovementObligation,
  advanceImprovementLifecycle,
  buildSchedulerProvenance,
  classifyAutonomyBoundary,
  buildValueLineage,
  buildMetaLearningPolicy,
  executeReplayExperiment,
  runSafeChaosSuite,
  buildCapabilityInventory,
  selectTechnologyCandidates,
  buildExecutiveImprovementProjection
} from '../scripts/brain/continuous-improvement/completion-runtime.mjs';

const candidate = {
  id: 'runtime-p95-regression',
  signal: 'runtime_p95_regression',
  hypothesis: 'Reducing duplicate reads lowers runtime p95 without correctness regressions.',
  metric: 'runtime_p95_ms',
  baseline: 1200,
  target: 1000,
  executor: 'agent-fabric',
  rollback: 'revert_exact_sha',
  risk: 'low',
  expected_business_outcome: { kind: 'time_saved_ms', unit: 'ms/request' }
};

const obligation = buildImprovementObligation(candidate, { observedAt: '2026-09-16T13:00:00.000Z' });
assert.equal(obligation.lifecycle, 'OBSERVED');
assert.equal(obligation.same_obligation_resume, true);
assert.ok(obligation.hypothesis);
assert.ok(obligation.success_metric);
assert.ok(obligation.rollback);
assert.ok(Array.isArray(obligation.evidence_requirements));

const blocked = advanceImprovementLifecycle(obligation, { blocker: { id: 'provider-429', external: true } });
assert.equal(blocked.lifecycle, 'OBSERVED');
assert.equal(blocked.blocker.status, 'ACTIVE');
const resumed = advanceImprovementLifecycle(blocked, { blockerCleared: true });
assert.equal(resumed.obligation_id, blocked.obligation_id);
assert.equal(resumed.blocker, null);

assert.throws(() => advanceImprovementLifecycle(obligation, { to: 'PROMOTED' }), /missing required evidence/i);
const experimenting = advanceImprovementLifecycle(obligation, { to: 'EXPERIMENTING', evidence: ['replay:pass'] });
const proven = advanceImprovementLifecycle(experimenting, {
  to: 'PROVEN',
  observations: 30,
  minimumObservations: 30,
  guardrails: { security: true, correctness: true, tenant_isolation: true, rollback_ready: true },
  evidence: ['experiment:metric-pass']
});
assert.equal(proven.lifecycle, 'PROVEN');

const replay = executeReplayExperiment({
  events: [{ id: '1', latency: 100 }, { id: '2', latency: 110 }],
  champion: event => ({ route: 'old', score: event.latency }),
  challenger: event => ({ route: 'new', score: event.latency - 10 }),
  primaryMetric: 'score',
  minimumObservations: 2,
  guardrails: { security: true, correctness: true, tenant_isolation: true, rollback_ready: true }
});
assert.equal(replay.executed, true);
assert.equal(replay.observations, 2);
assert.equal(replay.decision, 'CHALLENGER_ELIGIBLE');
assert.equal(replay.counterfactual_only, true);

const chaos = runSafeChaosSuite({
  scenarios: ['supabase_unavailable','provider_429','schema_mismatch','stale_knowledge','agent_timeout','partial_writeback'],
  handler: scenario => ({ recovered: true, idempotent: true, consistent: true, isolated: scenario.synthetic === true })
});
assert.equal(chaos.passed, true);
assert.equal(chaos.destructive, false);
assert.equal(chaos.results.length, 6);

const inventory = buildCapabilityInventory({
  capabilities: [
    { id: 'a', provides: ['replay'], usage_count: 2, last_observed_at: '2026-09-16T12:00:00Z' },
    { id: 'b', provides: ['replay'], usage_count: 0, last_observed_at: '2026-06-01T12:00:00Z' }
  ],
  requirements: ['replay','chaos'],
  now: '2026-09-16T13:00:00Z'
});
assert.equal(inventory.overlaps.length, 1);
assert.deepEqual(inventory.gaps, ['chaos']);
assert.equal(inventory.simplification_candidates[0].auto_delete, false);
assert.equal(inventory.simplification_candidates[0].requires_dependency_proof, true);

const tech = selectTechnologyCandidates({
  inventory,
  discoveries: [
    { id: 'replay-lib', capabilities: ['replay'], stable: true, security_improvement: true },
    { id: 'irrelevant-lib', capabilities: ['payments'], stable: true }
  ]
});
assert.deepEqual(tech.map(x => x.id), ['replay-lib']);
assert.equal(tech[0].requires_benchmark, true);
assert.equal(tech[0].auto_upgrade, false);

const cronProof = buildSchedulerProvenance({
  invocationSource: 'pg_cron',
  jobName: 'powerhouse-autonomous-improvement-cycle-v1',
  scheduledMinute: 42,
  invokedAt: '2026-09-16T13:42:01.000Z',
  cronRunId: 123
});
assert.equal(cronProof.natural_scheduler_run, true);
assert.equal(cronProof.scheduler_proven, true);
assert.equal(buildSchedulerProvenance({ invocationSource: 'manual', scheduledMinute: 42 }).scheduler_proven, false);

assert.equal(classifyAutonomyBoundary({ risk: 'low', reversible: true }).decision, 'AUTO_ALLOWED');
for (const boundary of ['external_communication','customer_data','privileges_or_secrets','destructive_schema','large_spend','rollback_unavailable']) {
  assert.equal(classifyAutonomyBoundary({ boundary }).decision, 'FAIL_CLOSED');
}

const correlation = buildValueLineage({
  changeId: 'sha:abc', exposureId: 'exp:1', outcomeId: 'out:1', realizedValue: 12,
  unit: 'minutes/day', confidence: 0.7, design: { type: 'observational' }
});
assert.equal(correlation.causal_claim, false);
assert.equal(correlation.attribution_class, 'CORRELATION');
const causal = buildValueLineage({
  changeId: 'sha:def', exposureId: 'exp:2', outcomeId: 'out:2', realizedValue: 100,
  unit: 'eur', confidence: 0.95,
  design: { type: 'randomized', assignmentRecorded: true, contaminationChecked: true }
});
assert.equal(causal.causal_claim, true);
assert.equal(causal.attribution_class, 'CAUSAL');

const meta = buildMetaLearningPolicy([
  { hypothesis_class: 'performance', executor: 'agent-fabric', success: true, cost: 2, duration_ms: 1000, realized_value: 20 },
  { hypothesis_class: 'performance', executor: 'agent-fabric', success: true, cost: 3, duration_ms: 1200, realized_value: 25 },
  { hypothesis_class: 'dependency', executor: 'github', success: false, cost: 10, duration_ms: 5000, realized_value: 0 }
]);
assert.equal(meta[0].hypothesis_class, 'performance');
assert.ok(meta[0].priority_multiplier > meta.at(-1).priority_multiplier);

const control = buildExecutiveImprovementProjection({
  obligations: [{ ...proven, change_sha: 'abc123', evidence: ['experiment:metric-pass'] }],
  scheduler: cronProof,
  inventory,
  metaLearning: meta
});
assert.equal(control.new_persistent_authority, false);
assert.equal(control.obligations[0].drilldown.change_sha, 'abc123');
assert.equal(control.scheduler.scheduler_proven, true);

const completionGateWorkflow = await readFile('.github/workflows/autonomous-improvement-completion-gate.yml', 'utf8');
assert.match(
  completionGateWorkflow,
  /::error::Parallel authority or retired Make dependency detected\./,
  'a failing autonomous-improvement completion gate must emit an actionable GitHub error annotation'
);

console.log('autonomous improvement completion tests passed');
