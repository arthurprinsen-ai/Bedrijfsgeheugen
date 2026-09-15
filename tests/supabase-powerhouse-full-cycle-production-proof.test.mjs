import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationUrl = new URL('../supabase/migrations/20260915122500_powerhouse_full_cycle_production_proof_v1.sql', import.meta.url);
const migration = fs.existsSync(migrationUrl) ? fs.readFileSync(migrationUrl, 'utf8') : '';

const has = (pattern, message) => assert.match(migration, pattern, message);

test('full-cycle production proof migration exists', () => {
  assert.ok(fs.existsSync(migrationUrl), 'missing full-cycle production proof migration');
});

test('proof reuses canonical Powerhouse state instead of creating a parallel store', () => {
  has(/powerhouse_source_freshness_v1/i, 'must reuse source freshness');
  has(/powerhouse_daily_execution_guard/i, 'must reuse daily execution guard');
  has(/powerhouse_runtime_events/i, 'must write canonical runtime evidence');
  has(/powerhouse_daily_runs/i, 'must append evidence to canonical daily run');
  assert.doesNotMatch(migration, /create\s+table/i, 'must not create a parallel table');
});

test('proof enforces canonical Buffer, Composio-GA4 and Gmail evidence', () => {
  has(/bg_buffer_sync/i, 'Buffer sync readback is required');
  has(/social_metric_snapshots/i, 'Buffer social metrics readback is required');
  has(/bg_ga4_sync/i, 'canonical GA4 sync is required');
  has(/bg_ga4_csv_batches/i, 'GA4 stored batch evidence is required');
  has(/gmail-outbound-replies/i, 'Gmail provider attestation is required');
  assert.doesNotMatch(migration, /windsor/i, 'Windsor must not enter the canonical proof');
  assert.doesNotMatch(migration, /\bmake\b/i, 'Make must not enter the canonical proof');
});

test('proof is fail-closed and persists one deterministic verdict', () => {
  has(/full_cycle_production_proof/i, 'must expose full-cycle proof');
  has(/required_sources_healthy/i, 'required source health must block green');
  has(/buffer_healthy/i, 'Buffer health must block green');
  has(/ga4_healthy/i, 'GA4 health must block green');
  has(/gmail_healthy/i, 'Gmail health must block green');
  has(/execution_healthy/i, 'daily execution must block green');
  has(/predictive_healthy/i, 'predictive health must block green');
  has(/overdue_calibrations/i, 'overdue forecast calibration must be explicit');
  has(/event_type[^\n]*full_cycle_production_proof/i, 'must write proof runtime event');
  has(/full-cycle-proof:/i, 'must use deterministic runtime dedupe');
  has(/bg_gezondheid/i, 'must write canonical health readback');
});

test('terminal publication reconciliation is evidence-bound and never fabricates delivery', () => {
  has(/powerhouse_reconcile_terminal_publication_state/i, 'must add terminal publication reconciliation');
  has(/content_publication_obligations/i, 'must rely on canonical publication obligation');
  has(/SKIPPED/i, 'only explicit terminal skipped evidence may reconcile an undelivered publish decision');
  has(/delivery_ref\s+is\s+null/i, 'must not rewrite delivered decisions');
  has(/decision\s*=\s*'hold'/i, 'terminal skipped publication becomes a hold, not a fake publish');
});

test('proof is scheduled after the existing execution guard and security is service-role only', () => {
  has(/powerhouse-full-cycle-proof-hourly-v1/i, 'must create named cron');
  has(/57 \* \* \* \*/i, 'must run hourly after the minute-47 execution guard');
  has(/revoke execute on function public\.powerhouse_full_cycle_production_proof\(date\) from public, anon, authenticated/i, 'proof execute must be revoked from user roles');
  has(/grant execute on function public\.powerhouse_full_cycle_production_proof\(date\) to service_role/i, 'proof execute must be service-role only');
  has(/revoke execute on function public\.powerhouse_reconcile_terminal_publication_state\(date\) from public, anon, authenticated/i, 'reconciliation execute must be revoked from user roles');
});