import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync('supabase/migrations/20261022173500_brain_failure_observe_semantic_guard_v1.sql','utf8');
const rollback = readFileSync('supabase/tests/brain_failure_observe_semantic_recovery_v1.sql','utf8');
const learn = JSON.parse(readFileSync('brain/learning/2026-10-22-brain-failure-evidence-semantic-recovery-v1.json','utf8'));

test('fail-closed baseline detection, no destructive migration, existing canonical registry',()=>{
  assert.match(migration,/BRAIN_FAILURE_OBSERVE_SOURCE_DRIFT/);
  assert.match(migration,/public\.brain_failure_registry/);
  assert.match(migration,/public\.brain_failure_occurrences/);
  assert.doesNotMatch(migration,/\b(?:DROP\s+TABLE|DELETE\s+FROM|TRUNCATE)\b/i);
  assert.match(migration,/CREATE INDEX IF NOT EXISTS brain_failure_occurrences_semantic_event_v1_idx/);
});
test('new observations cannot overwrite promoted evidence and raw evidence stays append-only',()=>{
  assert.match(migration,/evidence=coalesce\(evidence,p_evidence\)/);
  assert.doesNotMatch(migration,/SET\s+occurrence_count=occurrence_count\+1[^;]*evidence=coalesce\(p_evidence,evidence\)/is);
  assert.match(migration,/INSERT INTO public\.brain_failure_occurrences/);
});
test('multi-agent aliases use one advisory-locked semantic event identity; conflicts refuse writes',()=>{
  assert.match(migration,/pg_advisory_xact_lock\(hashtextextended/);
  assert.match(migration,/cron-\[0-9\]/);
  assert.match(migration,/supabase:cron:job/);
  assert.match(migration,/FAILURE_SEMANTIC_EVENT_CONFLICT/);
  assert.match(migration,/FAILURE_SEMANTIC_EVENT_LEGACY_CONFLICT/);
});
test('preserve private executor ACL; no browser EXECUTE',()=>{
  assert.match(migration,/SECURITY DEFINER SET search_path = ''/);
  assert.match(migration,/REVOKE ALL ON FUNCTION public\.brain_observe_failure/);
  assert.match(migration,/GRANT EXECUTE ON FUNCTION public\.brain_observe_failure[\s\S]*TO service_role/);
});
test('transaction-only SQL smoke asserts promotion preservation, alias idempotence and conflict',()=>{
  assert.match(rollback,/BEGIN;/);
  assert.match(rollback,/ROLLBACK;/);
  assert.match(rollback,/brain_promote_failure/);
  assert.match(rollback,/EVIDENCE_PRESERVATION_OR_DEDUP_FAILED/);
  assert.match(rollback,/CONFLICT_NOT_REJECTED/);
  assert.match(rollback,/RAW_OCCURRENCE_WRONG_COUNT/);
});
test('canonical learning routes same owner, no claims of live recovery',()=>{
  assert.equal(learn.fingerprint,'brain|incident-observe|evidence-overwrite-and-crosswriter-runid-dup|20261022-v1');
  assert.equal(learn.compiler.failure_class,'BRAIN_INCIDENT_DURABILITY');
  assert.equal(learn.status,'CANDIDATE');
  assert.ok(learn.evaluation.historical_replay.includes('tests/brain-incident-observe-semantic-recovery-v1.test.mjs'));
});
test('SQL behavioral canaries cover project isolation, both legacy arrival orders and missing proof',()=>{
  assert.match(rollback,/CROSS_PROJECT_EVENT_COLLISION/);
  assert.match(rollback,/SCOPED_ALIAS_DEDUPE_FAILED/);
  assert.match(rollback,/LEGACY_FIRST_SCOPE_NOT_REJECTED/);
  assert.match(rollback,/PROJECT_FIRST_SCOPE_NOT_REJECTED/);
  assert.match(rollback,/MISSING_MARKER_NOT_REJECTED/);
  assert.match(rollback,/r\.occurrence_count IS DISTINCT FROM 2/);
  assert.match(rollback,/\(r\.evidence->>'verified_marker'\) IS DISTINCT FROM 'must_survive'/);
  assert.doesNotMatch(rollback,/verified_marker'\s*<>/);
});

