import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath = 'supabase/migrations/20260915183000_powerhouse_portal_tenant_identity_v1.sql';

test('portal customer data uses canonical organisation identity and explicit demo state', () => {
  assert.ok(fs.existsSync(migrationPath), `${migrationPath} must exist`);
  const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

  for (const table of ['scan_inzendingen', 'offerte_inzendingen', 'portaal_stand']) {
    assert.match(sql, new RegExp(`alter table public\\.${table}[\\s\\S]*organisatie_id`));
  }
  assert.match(sql, /references\s+public\.organisaties\s*\(\s*id\s*\)/);
  assert.match(sql, /scan_inzendingen[\s\S]*is_demo/);
  assert.match(sql, /offerte_inzendingen[\s\S]*is_demo/);
  assert.match(sql, /update\s+public\.scan_inzendingen[\s\S]*organisaties/);
  assert.match(sql, /update\s+public\.offerte_inzendingen[\s\S]*organisaties/);
  assert.match(sql, /update\s+public\.portaal_stand[\s\S]*leden/);
  assert.match(sql, /klant_slug\s*=\s*'demo'/);
  assert.match(sql, /is_demo\s*=\s*true/);
});

test('portal writes fail closed on tenant membership and demo data cannot become commercial evidence', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

  assert.doesNotMatch(sql, /with\s+check\s*\(\s*true\s*\)/);
  assert.match(sql, /auth\.uid\s*\(\s*\)/);
  assert.match(sql, /public\.leden/);
  assert.match(sql, /organisatie_id/);
  assert.match(sql, /drop policy[\s\S]*scan_inzendingen/);
  assert.match(sql, /drop policy[\s\S]*offerte_inzendingen/);

  assert.match(sql, /refresh_scan_benchmarks/);
  assert.match(sql, /refresh_offerte_benchmarks/);
  assert.match(sql, /is_demo\s*=\s*false/);
  assert.match(sql, /organisatie_id\s+is\s+not\s+null/);
  assert.match(sql, /trg_scan_uitkomst/);
  assert.match(sql, /trg_offerte_uitkomst/);
  assert.match(sql, /if\s+new\.is_demo/);
});

test('tenant identity repair writes canonical Powerhouse learning without parallel infrastructure', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

  assert.match(sql, /portal-tenant-identity-normalization-v1/);
  assert.match(sql, /powerhouse_sales_learnings/);
  assert.match(sql, /powerhouse_runtime_events/);
  assert.doesNotMatch(sql, /cron\.schedule/);
  assert.doesNotMatch(sql, /make\.com/);
});
