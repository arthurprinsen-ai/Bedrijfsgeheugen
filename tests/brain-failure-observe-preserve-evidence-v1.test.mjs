import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync('supabase/migrations/20261022172200_brain_failure_observe_preserve_evidence_v1.sql','utf8');
const sqlReplay = readFileSync('tests/sql/brain-failure-observe-preserve-evidence-v1.sql','utf8');

test('existing Brain function is guarded, not replaced by a second incident store', () => {
  assert.match(migration, /to_regprocedure\('public\.brain_observe_failure\(text,text,text,jsonb\)'\)/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.brain_observe_failure/);
  assert.match(migration, /RETURNS public\.brain_failure_registry/);
  assert.doesNotMatch(migration, /\bDROP TABLE\b|\bTRUNCATE\b|\bDELETE FROM\b/i);
  assert.doesNotMatch(migration, /cron\.schedule|CREATE\s+(?:TABLE|TRIGGER|EXTENSION)|ALTER\s+ROLE/i);
});

test('registry evidence is immutable after a later observation, raw events retained', () => {
  assert.match(migration, /INSERT INTO public\.brain_failure_occurrences/);
  assert.match(migration, /evidence = coalesce\(evidence, p_evidence\)/);
  assert.doesNotMatch(migration, /evidence\s*=\s*coalesce\(p_evidence\s*,\s*evidence\)/);
  assert.match(sqlReplay, /VERIFIED_PRIOR_ANALYSIS_MUST_SURVIVE_NEXT_OBSERVATION/);
});

test('known alternate cron IDs resolve to a single actual provider event', () => {
  assert.match(migration, /\^cron-\(\[0-9\]\+\):\(\[0-9\]\+\)\$/);
  assert.match(migration, /\^supabase:cron:job\(\[0-9\]\+\):run:\(\[0-9\]\+\)\$/);
  assert.match(migration, /v_alias_old := 'cron-'/);
  assert.match(migration, /v_alias_new := 'supabase:cron:job'/);
  assert.match(migration, /pg_catalog\.pg_advisory_xact_lock/);
  assert.match(sqlReplay, /SAME_CRON_RUN_ALIASES_MUST_COUNT_ONCE/);
  assert.match(sqlReplay, /PROJECT_SCOPED_THEN_LEGACY_RUN_MUST_COUNT_ONCE/);
  assert.match(migration, /FAILURE_CRON_PROJECT_SCOPE_AMBIGUOUS/);
});

test('distinct job runids still register separately and identity conflicts fail closed', () => {
  assert.match(migration, /FAILURE_OCCURRENCE_IDENTITY_CONFLICT/);
  assert.match(migration, /FAILURE_EVENT_ID_PAYLOAD_CONFLICT/);
  assert.match(migration, /FAILURE_SEMANTIC_PROVIDER_STATUS_CONFLICT/);
  assert.match(sqlReplay, /DIFFERENT_CRON_RUNS_MUST_COUNT_SEPARATELY/);
  assert.match(sqlReplay, /DIFFERENT_PAYLOAD_SAME_ID_MUST_FAIL_CLOSED/);
});

test('SECURITY DEFINER RPC remains pinned and service-role-only', () => {
  assert.match(migration, /SECURITY DEFINER\s+SET search_path = ''/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.brain_observe_failure\(text,text,text,jsonb\)\s+FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.brain_observe_failure\(text,text,text,jsonb\)\s+TO service_role/);
  assert.match(migration, /BRAIN_FAILURE_OBSERVE_POSTWRITE_SECURITY_DRIFT/);
  assert.match(sqlReplay, /REPLAY_SECURITY_BOUNDARY_MUST_REMAIN/);
});

test('SQL test is bounded, failure-signaling and fully rolled back', () => {
  assert.match(sqlReplay, /^BEGIN;/m);
  assert.match(sqlReplay, /SET LOCAL statement_timeout='25s'/);
  assert.match(sqlReplay, /ROLLBACK;/);
  assert.doesNotMatch(sqlReplay, /\bCOMMIT\b/);
  assert.match(sqlReplay, /RAISE EXCEPTION/);
  assert.match(migration, /^BEGIN;/m);
  assert.match(migration, /^COMMIT;/m);
});
