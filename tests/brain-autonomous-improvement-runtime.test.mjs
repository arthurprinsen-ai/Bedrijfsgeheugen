import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import {
  FINGERPRINT,
  buildRunId,
  measureArchitectureFitness,
  buildCapabilityGraph,
  decideExperimentPortfolio,
  assessCausalEvidence,
  replayPolicy,
  runFailureInjection,
  findSimplificationCandidates,
  prioritizeByBusinessValue,
  buildAutonomousImprovementPacket
} from '../scripts/brain/continuous-improvement/autonomous-runtime.mjs';
import { validateAutonomousImprovementRuntime } from '../scripts/brain/continuous-improvement/run-autonomous-improvement.mjs';

test('runtime contract remains integrated with continuous improvement authority', async () => {
  const contract = JSON.parse(await readFile(new URL('../config/powerhouse-autonomous-improvement-runtime.json', import.meta.url), 'utf8'));
  assert.equal(contract.fingerprint, FINGERPRINT);
  assert.equal(contract.extends, 'powerhouse-continuous-improvement-engine-v1');
  assert.equal(contract.authority_model.new_persistent_authority, false);
  assert.equal(contract.scheduler.workflow, '.github/workflows/business-os-intelligence.yml');
  assert.equal(contract.writeback.new_store, false);
  assert.equal(contract.gates.destructive_simplification_auto_delete, false);
  assert.deepEqual((await validateAutonomousImprovementRuntime()).errors, []);
});

test('run identity is deterministic within the same hourly evidence bucket', () => {
  const input = { sourceSha: 'abc', observedAt: '2026-09-16T13:01:00Z', evidence: ['b','a'] };
  assert.equal(buildRunId(input), buildRunId({ ...input, observedAt: '2026-09-16T13:59:00Z' }));
  assert.notEqual(buildRunId(input), buildRunId({ ...input, observedAt: '2026-09-16T14:00:00Z' }));
});

test('architecture fitness detects material regressions without one magic score', () => {
  const result = measureArchitectureFitness({
    baseline: { latency_ms: 100, reliability: 99.9, reuse: 0.8 },
    current: { latency_ms: 131, reliability: 99.9, reuse: 0.8 },
    lowerIsBetter: ['latency_ms']
  });
  assert.equal(Math.round(result.dimensions.latency_ms.percent_change), 31);
  assert.equal(result.dimensions.latency_ms.material_regression, true);
  assert.equal(result.material_regressions[0].dimension, 'latency_ms');
  assert.equal('score' in result, false);
});

test('capability graph remains a projection and reveals overlaps and gaps', () => {
  const graph = buildCapabilityGraph({
    capabilities: [
      { id: 'a', provides: ['dedupe','learn'], agents: ['agent-a'] },
      { id: 'b', provides: ['dedupe'], agents: ['agent-b'] }
    ],
    requirements: ['dedupe','learn','replay']
  });
  assert.equal(graph.projection_only, true);
  assert.deepEqual(graph.overlaps, [{ a: 'a', b: 'b', provides: ['dedupe'] }]);
  assert.deepEqual(graph.gaps, ['replay']);
});

test('champion challenger promotion requires observations and guardrails', () => {
  const held = decideExperimentPortfolio({
    champion: { id: 'champion', observations: 40, metrics: { conversion: 0.1, error_rate: 0.01 } },
    challengers: [{ id: 'challenger', observations: 10, metrics: { conversion: 0.2, error_rate: 0.01 } }],
    primaryMetric: 'conversion', minimumObservations: 30, guardrails: [{ metric: 'error_rate', max: 0.02 }]
  });
  assert.equal(held.decision, 'KEEP_CHAMPION');
  const promoted = decideExperimentPortfolio({
    champion: { id: 'champion', observations: 40, metrics: { conversion: 0.1, error_rate: 0.01 } },
    challengers: [{ id: 'challenger', observations: 40, metrics: { conversion: 0.2, error_rate: 0.015 } }],
    primaryMetric: 'conversion', minimumObservations: 30, guardrails: [{ metric: 'error_rate', max: 0.02 }]
  });
  assert.equal(promoted.decision, 'PROMOTE_CHALLENGER');
  assert.equal(promoted.winner, 'challenger');
});

test('causal learning defaults to correlation only and requires identification', () => {
  assert.equal(assessCausalEvidence({ design: { type: 'observational' } }).causalClaim, false);
  assert.equal(assessCausalEvidence({ design: { type: 'randomized', assignmentRecorded: true, contaminationChecked: true } }).causalClaim, true);
});

test('digital twin replay reports changed decisions, not invented outcomes', () => {
  const result = replayPolicy({
    events: [{ id: '1', score: 1 }, { id: '2', score: 3 }],
    baselineDecision: event => event.score >= 3 ? 'ACT' : 'HOLD',
    candidateDecision: event => event.score >= 2 ? 'ACT' : 'HOLD'
  });
  assert.equal(result.total, 2);
  assert.equal(result.changed, 0);
  assert.equal(result.counterfactual_decisions_only, true);
});

test('safe chaos injection classifies recovery without destructive state', () => {
  const result = runFailureInjection({
    scenarios: [
      { id: 'provider-429', expected: 'RETRY_BOUNDED' },
      { id: 'stale-knowledge', expected: 'HOLD_REVALIDATE' }
    ],
    handler: scenario => ({ classification: scenario.id === 'provider-429' ? 'RETRY_BOUNDED' : 'HOLD_REVALIDATE' })
  });
  assert.equal(result.passed, true);
  assert.equal(result.destructive, false);
});

test('simplification proposes removals but never auto deletes', () => {
  const result = findSimplificationCandidates({
    capabilities: [{ id: 'a', provides: ['x'] }, { id: 'b', provides: ['x'] }],
    helpers: [{ id: 'dead-helper', kind: 'helper', usage_count: 0 }]
  });
  assert.equal(result.destructive_auto_delete, false);
  assert.ok(result.proposals.some(item => item.type === 'capability_overlap'));
  assert.ok(result.proposals.some(item => item.key === 'dead-helper'));
});

test('business value changes priority only for observed known evidence', () => {
  const ranked = prioritizeByBusinessValue({
    now: '2026-09-16T12:00:00Z',
    candidates: [
      { id: 'unknown', realized_value: null, confidence: 1, observed_at: '2026-09-16T11:00:00Z' },
      { id: 'low', realized_value: 10, confidence: 1, observed_at: '2026-09-16T11:00:00Z' },
      { id: 'high', realized_value: 100, confidence: 0.9, observed_at: '2026-09-16T11:00:00Z' }
    ]
  });
  assert.deepEqual(ranked.map(item => item.id), ['high','low','unknown']);
  assert.equal(ranked[2].value_priority, null);
});

test('runtime composes one deterministic evidence packet over existing authorities', () => {
  const input = {
    sourceSha: 'abc', observedAt: '2026-09-16T12:00:00Z', evidence: ['e1'],
    fitness: { baseline: { reliability: 1 }, current: { reliability: 1 } },
    capabilityGraph: { capabilities: [{ id: 'improve', provides: ['improve'] }], requirements: ['improve'] },
    experimentPortfolio: { champion: { id: 'a', observations: 30, metrics: { q: 1 } }, primaryMetric: 'q' },
    causalEvidence: {}, simplification: {}, valueFeedback: { candidates: [] }
  };
  const a = buildAutonomousImprovementPacket(input);
  const b = buildAutonomousImprovementPacket(input);
  assert.deepEqual(a, b);
  assert.equal(a.persistence_authority, 'existing Brain/Supabase writer routes only');
  assert.equal(a.projection_only, true);
});

test('Business OS Intelligence is the reused daily scheduler surface', async () => {
  const workflow = await readFile(new URL('../.github/workflows/business-os-intelligence.yml', import.meta.url), 'utf8');
  assert.match(workflow, /cron:\s*'17 3 \* \* \*'/);
  assert.match(workflow, /run-autonomous-improvement\.mjs/);
  assert.match(workflow, /contents:\s*read/);
});

test('read-only scheduled probe is executable', () => {
  const output = JSON.parse(execFileSync(process.execPath, ['scripts/brain/continuous-improvement/run-autonomous-improvement.mjs'], { encoding: 'utf8', env: { ...process.env, SOURCE_SHA: 'test-sha' } }));
  assert.equal(output.status, 'AUTONOMOUS_IMPROVEMENT_READY');
  assert.equal(output.validation.ok, true);
  assert.equal(output.packet.fingerprint, FINGERPRINT);
  assert.equal(output.writeback, 'not attempted by read-only scheduler probe');
});
