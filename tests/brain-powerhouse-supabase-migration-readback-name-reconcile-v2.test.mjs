import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(
  new URL('../supabase/migrations/20260925124500_powerhouse_supabase_migration_readback_name_reconcile_v2.sql', import.meta.url),
  'utf8'
);

test('migration readback accepts only exact identity or one unique same-name production migration', () => {
  assert.match(migration,/EXACT_VERSION_AND_NAME/);
  assert.match(migration,/UNIQUE_NAME_RECONCILED/);
  assert.match(migration,/AMBIGUOUS_NAME/);
  assert.match(migration,/same_name_count=1/);
  assert.match(migration,/sm\.name=e\.name/);
  assert.match(migration,/sm\.version=e\.expected_version|sm\.version=expected_version/);
  assert.match(migration,/powerhouse-supabase-migration-readback-v2/);
  assert.match(migration,/revoke execute .* from public, anon, authenticated/i);
  assert.match(migration,/grant execute .* to service_role/i);
});

test('migration readback preserves both canonical expected identity and actual applied identity', () => {
  assert.match(migration,/'expected_version',expected_version/);
  assert.match(migration,/'applied_version',applied_version/);
  assert.match(migration,/'match_mode',match_mode/);
});
