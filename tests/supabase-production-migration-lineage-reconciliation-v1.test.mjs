import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const canonical = [
  '20260915152705_powerhouse_revenue_intelligence_health_truth_v3.sql',
  '20260915153015_powerhouse_commercial_progression_forecast_bridge_v1.sql',
  '20260915153617_powerhouse_forecast_lineage_sequencing_v1.sql',
  '20260915154107_powerhouse_outcome_readback_health_semantics_v1.sql',
];

const supersededAliases = [
  '20260915172800_powerhouse_revenue_intelligence_health_truth_v3.sql',
  '20260915173100_powerhouse_commercial_progression_forecast_bridge_v1.sql',
  '20260915153500_powerhouse_forecast_lineage_sequencing_v1.sql',
  '20260915154000_powerhouse_outcome_readback_health_semantics_v1.sql',
];

const migrationsDir = new URL('../supabase/migrations/', import.meta.url);
const exists = (name) => fs.existsSync(new URL(name, migrationsDir));

test('GitHub migration lineage uses exact production versions for reconciled Revenue Intelligence migrations', () => {
  for (const name of canonical) {
    assert.equal(exists(name), true, `canonical production migration must exist: ${name}`);
  }
});

test('superseded timestamp aliases are absent so production DDL cannot be replayed under a second version', () => {
  for (const name of supersededAliases) {
    assert.equal(exists(name), false, `superseded migration alias must be absent: ${name}`);
  }
});
