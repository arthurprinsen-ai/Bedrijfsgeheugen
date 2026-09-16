import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration = await readFile(
  new URL('../supabase/migrations/20260916182000_autonomous_improvement_currentstate_record_type_fix_v1.sql', import.meta.url),
  'utf8',
);

test('autonomous improvement current_state uses canonical CurrentState record type', () => {
  assert.match(migration, /'CurrentState','current_state'/);
  assert.match(migration, /'improvement','current_state'/);
  assert.match(migration, /refusing unsafe rewrite/);
  assert.doesNotMatch(migration, /drop constraint|alter table\s+public\.brain_records/i);
});
