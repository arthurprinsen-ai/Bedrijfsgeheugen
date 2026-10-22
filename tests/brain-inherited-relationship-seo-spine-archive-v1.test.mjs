import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Historical contract verification only. Never make archived migrations executable.
const sources = [
  {
    "test": "tests/supabase-powerhouse-linkedin-sales-machine-v1.test.mjs",
    "filename": "20260928114500_powerhouse_linkedin_sales_machine_v1.sql",
    "sha": "4b56a5333818c81b7e074341182460d3dc45a992"
  },
  {
    "test": "tests/supabase-powerhouse-linkedin-sales-machine-v1.test.mjs",
    "filename": "20260928115000_powerhouse_linkedin_sales_machine_cycle_v1.sql",
    "sha": "5507619ad8dd309010e12e02eda8c3e1c00a024f"
  },
  {
    "test": "tests/supabase-powerhouse-relationship-external-intelligence-v1.test.mjs",
    "filename": "20260928173100_powerhouse_relationship_external_intelligence_v1.sql",
    "sha": "ce3e9d346de8274d8356a6ee841c67ad3229e5e0"
  },
  {
    "test": "tests/supabase-powerhouse-seo-opportunity-resolver-v1.test.mjs",
    "filename": "20260924072500_powerhouse_seo_opportunity_resolver_v1.sql",
    "sha": "6a9ba57a8a97edf16fee5c21f243ac6729962d40"
  },
  {
    "test": "tests/supabase-powerhouse-unified-data-intelligence-spine-v1.test.mjs",
    "filename": "20260918095000_powerhouse_unified_data_intelligence_spine_v1.sql",
    "sha": "b8f754c43c6d872232148a2dee07e3c11c32b8aa"
  },
  {
    "test": "tests/supabase-powerhouse-unified-data-intelligence-spine-v1.test.mjs",
    "filename": "20260918102000_powerhouse_data_spine_heartbeat_truth_v1.sql",
    "sha": "7d292f0c897f14b8b5bedb06ed786b8f0055a222"
  },
  {
    "test": "tests/supabase-sales-action-signal-cycle-materializer-v1.test.mjs",
    "filename": "20260918104500_sales_action_signal_cycle_materializer_v1.sql",
    "sha": "024fa031562eb1f374da17f00bed9735c13bb2ff"
  }
];
for (const { test: testPath, filename } of sources) {
  test('archived SQL oracle remains non-executable and referenced: ' + filename, () => {
    const oldPath = 'supabase/migrations/' + filename;
    const archivePath = 'supabase/migration-history/repository-only/' + filename;
    assert.equal(fs.existsSync(oldPath), false, 'Do not restore historical SQL as an executable migration');
    const sql = fs.readFileSync(archivePath, 'utf8');
    assert.ok(sql.trim().length > 0, 'Original historical SQL must exist');
    const source = fs.readFileSync(testPath, 'utf8');
    assert.ok(source.includes(archivePath), 'Test must read canonical immutable archive');
    assert.ok(!source.includes(oldPath), 'Obsolete executable SQL read must be absent');
  });
}
