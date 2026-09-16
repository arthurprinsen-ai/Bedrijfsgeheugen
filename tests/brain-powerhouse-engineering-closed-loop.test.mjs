import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  computeEngineeringScorecard,
  detectFlakyTests,
  buildDependencyGraph,
  computeBlastRadius,
  evaluateRecoveryProof,
  createGoldenPathScaffold,
  evaluateEngineeringMetaLearning,
} from '../scripts/brain/powerhouse-engineering-closed-loop.mjs';

test('scorecard keeps missing evidence unknown and measures Powerhouse lead time', () => {
  const result = computeEngineeringScorecard({
    changes: [{ id:'c1', idea_at:'2026-09-16T08:00:00Z', committed_at:'2026-09-16T08:10:00Z', deployed_at:'2026-09-16T08:30:00Z', live_proven_at:'2026-09-16T08:40:00Z', failed:false }],
  });
  assert.equal(result.metrics.idea_to_live_bewezen_ms.value, 40 * 60 * 1000);
  assert.equal(result.metrics.change_lead_time_ms.value, 20 * 60 * 1000);
  assert.equal(result.metrics.failed_deployment_recovery_time_ms.status, 'unknown');
  assert.ok(result.evidence_completeness > 0 && result.evidence_completeness < 1);
});

test('flake intelligence only flags oscillation on the same source revision', () => {
  const result = detectFlakyTests([
    { test_id:'a', source_revision:'sha1', outcome:'pass' },
    { test_id:'a', source_revision:'sha1', outcome:'fail' },
    { test_id:'b', source_revision:'sha1', outcome:'fail' },
    { test_id:'b', source_revision:'sha2', outcome:'pass' },
  ]);
  assert.deepEqual(result.flaky.map(x => x.test_id), ['a']);
  assert.equal(result.can_override_required_failure, false);
});

test('dependency graph computes reverse blast radius deterministically', () => {
  const graph = buildDependencyGraph({nodes:['code:a','test:a','workflow:req','runtime:web'],edges:[['test:a','code:a'],['workflow:req','test:a'],['runtime:web','code:a']]});
  assert.deepEqual(computeBlastRadius(graph, ['code:a']), ['code:a','runtime:web','test:a','workflow:req']);
});

test('recovery proof fails closed for stale or missing domains', () => {
  const result = evaluateRecoveryProof({
    now:'2026-09-16T10:00:00Z', max_age_days:90,
    required_domains:['code_rollback','netlify_rollback','database_restore','migration_recovery','provider_fallback'],
    evidence:[
      {domain:'code_rollback',rehearsed_at:'2026-09-15T10:00:00Z',success:true},
      {domain:'netlify_rollback',rehearsed_at:'2026-09-15T10:00:00Z',success:true},
      {domain:'database_restore',rehearsed_at:'2026-05-01T10:00:00Z',success:true},
    ],
  });
  assert.equal(result.recovery_proven, false);
  assert.deepEqual(result.blocking_domains.sort(), ['database_restore','migration_recovery','provider_fallback']);
});

test('golden path scaffold stays in registered lanes and includes required hooks', () => {
  for (const kind of ['frontend','backend','migration','agent','integration']) {
    const result = createGoldenPathScaffold(kind, 'demo-capability');
    assert.equal(result.kind, kind);
    assert.ok(result.files.length >= 2);
    assert.ok(result.hooks.includes('test'));
    assert.ok(result.hooks.includes('observability'));
    assert.ok(result.hooks.includes('documentation'));
    assert.equal(result.parallel_authority_created, false);
  }
});

test('meta-learning recommends evidence-backed improvements but never mutates gates', () => {
  const result = evaluateEngineeringMetaLearning({
    gates:[{id:'visual',runs:100,caught_defects:8,false_failures:0},{id:'legacy',runs:100,caught_defects:0,false_failures:14}],
    escaped_defects:[{fingerprint:'layout-x',should_have_been_caught_by:'visual'}],
  });
  assert.equal(result.direct_mutation_allowed, false);
  assert.ok(result.recommendations.length > 0);
  assert.ok(result.recommendations.every(x => x.promotion === 'protected_delivery_required'));
});

test('existing Engineering OS remains authority and registers the executable helper', async () => {
  const contract = JSON.parse(await readFile(new URL('../config/powerhouse-engineering-os.json', import.meta.url), 'utf8'));
  assert.equal(contract.continuous_improvement.fingerprint, 'powerhouse-continuous-improvement-engine-v1');
  assert.equal(contract.continuous_improvement.executable_closed_loop.fingerprint, 'powerhouse-engineering-closed-loop-v1');
  assert.equal(contract.continuous_improvement.executable_closed_loop.authority, 'powerhouse-continuous-improvement-engine-v1');
  const required = await readFile(new URL('../.github/workflows/required-test.yml', import.meta.url), 'utf8');
  assert.match(required, /tests\/brain-powerhouse-engineering-closed-loop\.test\.mjs/);
});
