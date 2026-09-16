import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL('../supabase/migrations/20260915193307_powerhouse_resource_business_value_v1.sql', import.meta.url);

async function migration() {
  return readFile(migrationUrl, 'utf8');
}

test('resource business value migration creates versioned security-invoker projections from existing authorities', async () => {
  const sql = (await migration()).toLowerCase();
  for (const view of [
    'powerhouse_action_business_value_v1',
    'powerhouse_portal_resource_summary_v2',
    'powerhouse_commercial_next_best_action_v4',
  ]) {
    assert.match(sql, new RegExp(`create\\s+or\\s+replace\\s+view\\s+public\\.${view}`));
  }
  assert.match(sql, /security_invoker\s*=\s*true/);
  assert.match(sql, /brain_budget_usage/);
  assert.match(sql, /powerhouse_resource_impact_v1/);
  assert.match(sql, /powerhouse_action_economics/);
  assert.match(sql, /powerhouse_sales_actions/);
  assert.match(sql, /powerhouse_sales_outcomes/);
  assert.match(sql, /powerhouse_commercial_next_best_action_v3/);
});

test('unknown impact and cost stay unknown while economics evidence is neutral when absent', async () => {
  const sql = (await migration()).toLowerCase();
  assert.match(sql, /sum\(.*energy_kwh.*\)\s+filter\s*\(where.*energy_kwh.*is not null/s);
  assert.match(sql, /sum\(.*co2e_kg.*\)\s+filter\s*\(where.*co2e_kg.*is not null/s);
  assert.match(sql, /sum\(.*water_liters.*\)\s+filter\s*\(where.*water_liters.*is not null/s);
  assert.match(sql, /case\s+when\s+.*economics_observations.*>\s*0.*then/s);
  assert.match(sql, /else\s+null\s+end\s+as\s+observed_cost_eur/s);
  assert.match(sql, /else\s+null\s+end\s+as\s+cost_efficiency_evidence/s);
});

test('new projections do not widen public database access', async () => {
  const sql = (await migration()).toLowerCase();
  assert.match(sql, /revoke\s+all\s+on\s+public\.powerhouse_action_business_value_v1\s+from\s+public,\s*anon,\s*authenticated/);
  assert.match(sql, /revoke\s+all\s+on\s+public\.powerhouse_portal_resource_summary_v2\s+from\s+public,\s*anon,\s*authenticated/);
  assert.match(sql, /revoke\s+all\s+on\s+public\.powerhouse_commercial_next_best_action_v4\s+from\s+public,\s*anon,\s*authenticated/);
});
