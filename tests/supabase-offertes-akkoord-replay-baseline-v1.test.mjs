import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath = new URL('../supabase/migrations/20260916090824_powerhouse_structure_hygiene_v1.sql', import.meta.url);

test('offertes agreement fields exist before hygiene index depends on akkoord_door', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  const addAt = sql.search(/add column if not exists akkoord_door uuid/i);
  const indexAt = sql.search(/create index if not exists offertes_akkoord_door_fk_idx/i);
  assert.ok(addAt >= 0, 'fresh replay must add akkoord_door before its index is created');
  assert.ok(indexAt > addAt, 'agreement baseline must precede offertes_akkoord_door_fk_idx');
  assert.match(sql, /add column if not exists akkoord_naam text/i);
  assert.match(sql, /add column if not exists akkoord_functie text/i);
  assert.match(sql, /foreign key \(akkoord_door\) references auth\.users\(id\) on delete set null/i);
});
