import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');

test('inherited revenue contract uses immutable archived SQL without a duplicate executable migration', () => {
  const archive = 'supabase/migration-history/repository-only/20260929162000_powerhouse_one_million_revenue_operating_contract_v1.sql';
  const retired = 'supabase/migrations/20260929162000_powerhouse_one_million_revenue_operating_contract_v1.sql';
  const contractTest = read('tests/brain-one-million-revenue-operating-contract-v1.test.mjs');
  const sql = read(archive);
  assert.ok(contractTest.includes(archive));
  assert.ok(!contractTest.includes(retired));
  assert.equal(existsSync(retired), false, 'historical SQL must not be reintroduced as an executable migration');
  assert.match(sql, /jobname='powerhouse-commercial-learning-v1'/);
  assert.match(sql, /cron\.schedule\(\s*'powerhouse-commercial-learning-v1'/);
  assert.match(sql, /powerhouse_trigger_based_mkb_acquisition_cycle_v1\(\)/);
  assert.doesNotMatch(sql, /cron\.schedule\(\s*'powerhouse-one-million/i);
  assert.match(sql, /revoke execute on function public\.powerhouse_revenue_operating_state_v1/);
  assert.match(sql, /grant execute on function public\.powerhouse_revenue_operating_state_v1\(timestamptz\) to service_role/);
});

test('inherited content reconciliation SQL retains terminated function and service-role-only execution', () => {
  const archive = 'supabase/migration-history/repository-only/20260917235907_social_content_integrity_invalidation_guard.sql';
  const retired = 'supabase/migrations/20260917235907_social_content_integrity_invalidation_guard.sql';
  const contractTest = read('tests/brain-social-publish-atomic-claim-dedupe-v1.test.mjs');
  const sql = read(archive);
  assert.ok(contractTest.includes(archive));
  assert.ok(!contractTest.includes(retired));
  assert.equal(existsSync(retired), false, 'historical SQL must not be reintroduced as an executable migration');
  assert.match(sql, /\$function\$;\s*revoke execute on function public\.powerhouse_reconcile_content_outcomes_v1/);
  assert.match(sql, /revoke execute on function public\.powerhouse_reconcile_content_outcomes_v1\(date\) from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.powerhouse_reconcile_content_outcomes_v1\(date\) to service_role/);
});
