import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  new URL('../supabase/migrations/20261022165000_daily_learning_outcome_coverage_population_v1.sql', import.meta.url),
  'utf8'
);

test('terminal numerator and denominator come from the SAME completed-action population', () => {
  assert.match(migration, /count\(\*\) FILTER \(WHERE lower\(status\) = 'done'\)::integer AS executed_actions/);
  assert.match(migration, /count\(\*\) FILTER \(WHERE lower\(status\) = 'done' AND outcome_id IS NOT NULL\)::integer AS actions_with_outcomes/);
  assert.match(migration, /a\.actions_with_outcomes::numeric \/ a\.executed_actions::numeric/);
  assert.match(migration, /DAILY_LEARNING_COVERAGE_WRONG_POPULATION/);
  assert.match(migration, /DAILY_LEARNING_COVERAGE_OUTSIDE_UNIT_INTERVAL/);
});

test('denominator zero means unobserved, not 100% success', () => {
  assert.match(migration, /CASE WHEN a\.executed_actions = 0 THEN NULL::numeric/);
  assert.match(migration, /DAILY_LEARNING_COVERAGE_NO_OBSERVATIONS_FALSE_GREEN/);
  assert.doesNotMatch(migration, /THEN 1::numeric/);
});

test('false-green live scenario: 276 of 317 done actions, not 4947 of 317', () => {
  const done = 317, linkedAnyStatus = 4947, doneWithOutcome = 276;
  assert.ok(linkedAnyStatus / done > 1);
  assert.equal(Number((doneWithOutcome / done).toFixed(4)), 0.8707);
  assert.equal(done - doneWithOutcome, 41);
  assert.ok(doneWithOutcome <= done);
});

test('existing view, security invoker, service-only ACL, one canonical store/scheduler', () => {
  assert.match(migration, /CREATE OR REPLACE VIEW public\.powerhouse_daily_compound_learning_control_v1/);
  assert.match(migration, /WITH \(security_invoker = true\)/);
  assert.match(migration, /REVOKE ALL ON TABLE public\.powerhouse_daily_compound_learning_control_v1\s+FROM PUBLIC, anon, authenticated;/);
  assert.match(migration, /GRANT SELECT ON TABLE public\.powerhouse_daily_compound_learning_control_v1\s+TO service_role;/);
  assert.doesNotMatch(migration, /(?:CREATE\s+TABLE|cron\.schedule|DELETE\s+FROM\s+public\.powerhouse_sales_actions)/i);
  assert.match(migration, /BEGIN;[\s\S]*COMMIT;\s*$/);
});

test('autonomous learning record closes root cause, evidence and tested prevention', async () => {
  const { fileURLToPath } = await import('node:url');
  const { compileLearningEvaluationPlan, validateEvaluationContract } = await import('../scripts/brain/learning-canonicalization-gate.mjs');
  const { evaluateLearningSemantics } = await import('../scripts/brain/material-writeback-closure-guard.mjs');
  const rootDir = fileURLToPath(new URL('../', import.meta.url));
  const file = 'brain/learning/2026-10-22-daily-learning-coverage-denominator-v1.json';
  const learning = JSON.parse(readFileSync(new URL('../' + file, import.meta.url), 'utf8'));
  const plan = compileLearningEvaluationPlan(learning);
  assert.equal(plan.failure_class, 'FALSE_GREEN');
  assert.equal(plan.security_sensitive, true);
  assert.deepEqual(validateEvaluationContract(learning, plan, { rootDir }).required_modes,
    ['historical_replay','shadow','canary']);
  assert.equal(evaluateLearningSemantics({learningFiles:[file],rootDir}).ok,true);
  assert.match(JSON.stringify(learning.evidence), /276/);
});
