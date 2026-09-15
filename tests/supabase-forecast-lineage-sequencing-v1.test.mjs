import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationUrl = new URL('../supabase/migrations/20260915153500_powerhouse_forecast_lineage_sequencing_v1.sql', import.meta.url);
const migration = fs.existsSync(migrationUrl) ? fs.readFileSync(migrationUrl, 'utf8') : '';

const has = (pattern, message) => assert.match(migration, pattern, message);

test('existing gap closer job repairs commercial forecast lineage before running', () => {
  assert.ok(fs.existsSync(migrationUrl), 'forecast-lineage sequencing migration must exist');
  has(/powerhouse-autonomous-gap-closer-v1/i, 'existing gap closer job must remain the owner');
  has(/powerhouse_ensure_commercial_progression_forecasts_v1/i, 'existing forecast bridge must be reused');
  has(/powerhouse_autonomous_gap_closer_v1/i, 'existing gap closer function must still execute');
});

test('existing 15-minute revenue snapshot repairs lineage before refresh', () => {
  has(/powerhouse-revenue-intelligence-snapshot-15m/i, 'existing snapshot job must remain the owner');
  has(/powerhouse_ensure_commercial_progression_forecasts_v1/i, 'snapshot must repair forecast lineage before refresh');
  has(/powerhouse_refresh_revenue_intelligence_snapshot_v1/i, 'existing snapshot refresh must still execute');
});

test('sequencing fix creates no parallel scheduler or forecast store', () => {
  assert.doesNotMatch(migration, /cron\.schedule\s*\(/i, 'must not create a new cron job');
  assert.doesNotMatch(migration, /create\s+table/i, 'must not create a parallel forecast store');
  has(/forecast-lineage-sequencing-gap-v1/i, 'root-cause learning fingerprint must be canonicalized');
  has(/28/i, 'observed incident sample must be retained as evidence');
});
