import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const fnUrl = new URL('../supabase/functions/bg-analytics-sync-composio/index.ts', import.meta.url);
const migrationUrl = new URL('../supabase/migrations/20260915145500_ga4_auth_failover_v1.sql', import.meta.url);
const policyUrl = new URL('../brain/policies/powerhouse-revenue-flywheel-v1.json', import.meta.url);
const fn = fs.existsSync(fnUrl) ? fs.readFileSync(fnUrl, 'utf8') : '';
const migration = fs.existsSync(migrationUrl) ? fs.readFileSync(migrationUrl, 'utf8') : '';
const policy = fs.existsSync(policyUrl) ? fs.readFileSync(policyUrl, 'utf8') : '';
const policyDoc = policy ? JSON.parse(policy) : {};

const has = (source, pattern, message) => assert.match(source, pattern, message);

test('GA4 canonical collector keeps direct Google as primary and adds evidence-bound fallback', () => {
  has(fn,/google-analytics-data-api/i, 'direct Google Analytics Data API must remain primary');
  has(fn,/ga4-auth-failover-v1/i, 'failover contract marker is required');
  has(fn,/WINDSOR_API/i, 'Windsor fallback configuration must be explicit');
  has(fn,/windsor-googleanalytics4/i, 'successful fallback must identify Windsor GA4 as source');
});

test('fallback only opens for auth and permission failures', () => {
  has(fn,/401\|403\|TOKEN\|PERMISSION/i, 'auth/permission failure classifier is required');
  has(fn,/failureClass\s*!==\s*['"]AUTH['"]/i, 'non-auth failures must be rejected before fallback');
  has(fn,/DIRECT_NON_AUTH_FAILURE/i, 'non-auth failures must remain fail-closed');
});

test('both routes failing remains red and never fabricates analytics', () => {
  has(fn,/WINDSOR_FALLBACK_UNAVAILABLE/i, 'missing fallback credential must be explicit');
  has(fn,/ANALYTICS_SYNC_FAILED/i, 'terminal failure must remain red');
  assert.doesNotMatch(fn, /fake[_ -]?data|test[_ -]?data/i, 'collector must not fabricate GA4 observations');
});

test('fallback reuses canonical GA4 lineage, dedupes, and writes route evidence', () => {
  has(fn,/bg_ga4_csv_batches/i, 'must reuse canonical GA4 batch store');
  has(fn,/bg_ga4_sync/i, 'must reuse canonical GA4 sync store');
  has(fn,/powerhouse_runtime_events/i, 'must write Powerhouse runtime evidence');
  has(fn,/csv_sha256/i, 'batch dedupe must be based on observed content');
  has(fn,/source_route/i, 'route used for the run must be persisted');
  has(fn,/primary_failure/i, 'primary failure must be retained as learning evidence');
  has(fn,/48\*3600\*1000/i, 'verified fallback readback must be freshness bounded to 48 hours');
});

test('scheduler reuses the canonical collector and creates no analytics store', () => {
  assert.ok(fs.existsSync(migrationUrl), 'missing GA4 failover migration');
  has(migration,/bg-analytics-sync-6h-v1/i, 'resilient collector cron is required');
  has(migration,/5 \*\/6 \* \* \*/i, 'collector must run every six hours');
  has(migration,/bg_roep_functie\(''bg-analytics-sync-composio''\)/i, 'cron must call the existing canonical collector');
  assert.doesNotMatch(migration,/create\s+table/i,'must not create a parallel analytics store');
});

test('Powerhouse policy canonizes GA4 auth failover and truth boundary', () => {
  const version = /^v(\d+)\.(\d+)$/.exec(policyDoc.version ?? '');
  assert.ok(version && (Number(version[1]) > 1 || (Number(version[1]) === 1 && Number(version[2]) >= 3)), 'Powerhouse policy must remain at GA4 failover version v1.3 or later');
  has(policy,/"ga4_auth_failover"/i, 'GA4 auth failover capability must be canonical');
  has(policy,/"fallback_trigger":"AUTH only"/i, 'policy must restrict failover trigger');
  has(policy,/"fallback_freshness_hours":48/i, 'policy must bound fallback freshness');
  has(policy,/never keep GA4 green from stale or invented data/i, 'stale or invented analytics must never keep health green');
});
