import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationPath = 'supabase/migrations/20261005160410_resource_intelligence_tenant_isolation_recovery_v1.sql';

test('resource intelligence tenant isolation recovery adds database tenant authority and bounded generation', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /powerhouse_compliance_evidence_v1[\s\S]*tenant_id/i);
  assert.match(sql, /powerhouse_optimization_candidate_v1[\s\S]*tenant_id/i);
  assert.match(sql, /create index[\s\S]*tenant_id/i);
  assert.match(sql, /tenant_ids\[1\]/i);
  assert.match(sql, /cardinality\(tenant_ids\)\s*=\s*1/i);
});

test('resource intelligence regressions bind to canonical production migration authorities', async () => {
  const resource = await readFile('tests/powerhouse-resource-intelligence-contract.test.mjs', 'utf8');
  const tenant = await readFile('tests/powerhouse-resource-intelligence-portal-telemetry.test.mjs', 'utf8');
  const cockpit = await readFile('tests/supabase-powerhouse-content-edge-surface-contract.test.mjs', 'utf8');

  assert.match(resource, /20260917094812_powerhouse_resource_intelligence_v1\.sql/);
  assert.match(tenant, /20261005160410_resource_intelligence_tenant_isolation_recovery_v1\.sql/);
  assert.match(cockpit, /20260916172554_content_operations_cockpit_projection_repair_v1\.sql/);

  assert.doesNotMatch(resource, /20260917093000_powerhouse_resource_intelligence_v1\.sql/);
  assert.doesNotMatch(cockpit, /20260916163500_content_operations_cockpit_projection_repair_v1\.sql/);
});
