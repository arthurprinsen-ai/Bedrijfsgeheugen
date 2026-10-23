import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const auditPath = 'scripts/brain/resource-intelligence-audit.mjs';
const migrationPath = 'supabase/migrations/20260917094812_powerhouse_resource_intelligence_v1.sql';

test('existing CI audit reads applied canonical migration and returns a real positive receipt', () => {
  assert.ok(fs.existsSync(migrationPath));
  const audit = fs.readFileSync(auditPath, 'utf8');
  assert.match(audit, /20260917094812_powerhouse_resource_intelligence_v1\.sql/);
  assert.doesNotMatch(audit, /20260917093000_powerhouse_resource_intelligence_v1\.sql/);
  const run = spawnSync(process.execPath, [auditPath, '--check'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const receipt = JSON.parse(run.stdout.trim());
  assert.equal(receipt.status, 'RESOURCE_INTELLIGENCE_READY');
  assert.equal(receipt.unknown_data_policy, 'null_not_zero');
  assert.equal(receipt.production_authority, 'BG169');
});

test('canonical resource evidence remains NULL-not-zero, provenance-aware and restricted', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  for (const metric of ['energy_kwh', 'water_liters', 'co2e_kg']) {
    assert.match(sql, new RegExp('sum\\(' + metric + '\\)\\s+filter\\s*\\(where ' + metric + ' is not null\\)', 'i'));
    assert.doesNotMatch(sql, new RegExp('coalesce\\s*\\(\\s*' + metric + '\\s*,\\s*0', 'i'));
  }
  assert.match(sql, /provenance_complete/);
  assert.match(sql, /methodology is not null/);
  assert.match(sql, /security_invoker\s*=\s*true/);
  assert.match(sql, /force row level security/);
  assert.match(sql, /powerhouse_optimization_candidate_v1/);
  assert.match(sql, /powerhouse_compliance_evidence_v1/);
});
