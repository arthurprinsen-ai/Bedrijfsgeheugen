import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const pairs = [
  ['tests/brain-autonomous-improvement-currentstate-record-type.test.mjs', '20260916182000_autonomous_improvement_currentstate_record_type_fix_v1.sql'],
  ['tests/brain-company-intelligence-os-v1.test.mjs', '20260928193000_powerhouse_company_intelligence_os_v1.sql'],
  ['tests/brain-terminal-autonomous-reconciler-v1.test.mjs', '20260920095500_terminal_autonomous_reconciler_v1.sql'],
  ['tests/brain-trigger-based-mkb-acquisition-runtime-v1.test.mjs', '20260924131500_trigger_based_mkb_acquisition_runtime_v1.sql'],
  ['tests/supabase-powerhouse-data-intake-contract.test.mjs', '20260915131500_powerhouse_data_intake_health_v1.sql'],
  ['tests/supabase-powerhouse-forecast-calibrator-hourly.test.mjs', '20260915140500_powerhouse_forecast_calibrator_hourly_v1.sql'],
  ['tests/supabase-runtime-health-truth-v1.test.mjs', '20260918094000_runtime_health_truth_v1.sql'],
];

for (const [testPath, filename] of pairs) {
  test('inherited source contract uses verified non-executable SQL archive: ' + filename, () => {
    const source = readFileSync(testPath, 'utf8');
    const archivedPath = 'supabase/migration-history/repository-only/' + filename;
    const executablePath = 'supabase/migrations/' + filename;
    assert.ok(existsSync(archivedPath), 'archived original must exist: ' + archivedPath);
    assert.ok(source.includes(archivedPath), 'test must read the canonical immutable source');
    assert.ok(!source.includes(executablePath), 'test must not point to deleted executable migration');
    assert.ok(!existsSync(executablePath), 'historical SQL must not be restored as an executable duplicate');
  });
}
