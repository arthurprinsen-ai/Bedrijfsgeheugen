import assert from 'node:assert/strict';
import {
  buildImprovementObligation,
  advanceImprovementLifecycle,
  buildSchedulerProvenance,
  classifyAutonomyBoundary,
  buildValueLineage,
  buildMetaLearningPolicy
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

console.log('autonomous improvement completion tests passed');
