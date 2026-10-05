import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cfg = JSON.parse(fs.readFileSync(new URL('../config/supabase-migration-parity-obligation.json', import.meta.url), 'utf8'));

test('migration-history parity obligation is fail-closed', () => {
  assert.equal(cfg.contract, 'supabase-migration-history-parity-v1');
  assert.equal(cfg.issue, 3742);
  assert.equal(cfg.project_ref, 'adhjwmvyoixzjtmiroln');
  assert.equal(cfg.authority, 'supabase_migrations.schema_migrations');
  assert.equal(cfg.invariant.exact_version_parity, true);
  assert.equal(cfg.invariant.exact_name_parity, true);
  assert.equal(cfg.invariant.unique_versions, true);
  assert.equal(cfg.invariant.non_empty_sql, true);
  assert.equal(cfg.invariant.fresh_replay_required, true);
  assert.equal(cfg.invariant.placeholders_forbidden, true);
  assert.equal(cfg.closure.state, 'OPEN');
  assert.ok(cfg.closure.terminal_green_requires.includes('post-merge production readback'));
});
