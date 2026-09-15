import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const fnUrl = new URL('../supabase/functions/bg-analytics-sync-composio/index.ts', import.meta.url);
const fn = fs.existsSync(fnUrl) ? fs.readFileSync(fnUrl, 'utf8') : '';

const has = (pattern, message) => assert.match(fn, pattern, message);

test('GA4 canonical collector keeps direct Google as primary and adds evidence-bound fallback', () => {
  has(/google-analytics-data-api/i, 'direct Google Analytics Data API must remain primary');
  has(/ga4-auth-failover-v1/i, 'failover contract marker is required');
  has(/WINDSOR_API/i, 'Windsor fallback configuration must be explicit');
  has(/windsor-googleanalytics4/i, 'successful fallback must identify Windsor GA4 as source');
});

test('fallback only opens for auth and permission failures', () => {
  has(/401\|403\|TOKEN\|PERMISSION/i, 'auth/permission failure classifier is required');
  has(/failureClass\s*===\s*['"]AUTH['"]/i, 'fallback must be restricted to AUTH failures');
  has(/DIRECT_NON_AUTH_FAILURE/i, 'non-auth failures must remain fail-closed');
});

test('both routes failing remains red and never fabricates analytics', () => {
  has(/WINDSOR_FALLBACK_UNAVAILABLE/i, 'missing fallback credential must be explicit');
  has(/ANALYTICS_SYNC_FAILED/i, 'terminal failure must remain red');
  assert.doesNotMatch(fn, /synthetic|fake[_ -]?data|test[_ -]?data/i, 'collector must not synthesize GA4 observations');
});

test('fallback reuses canonical GA4 lineage and writes route evidence', () => {
  has(/bg_ga4_csv_batches/i, 'must reuse canonical GA4 batch store');
  has(/bg_ga4_sync/i, 'must reuse canonical GA4 sync store');
  has(/powerhouse_runtime_events/i, 'must write Powerhouse runtime evidence');
  has(/source_route/i, 'route used for the run must be persisted');
  has(/primary_failure/i, 'primary failure must be retained as learning evidence');
});
