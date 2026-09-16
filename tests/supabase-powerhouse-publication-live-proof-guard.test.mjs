import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const migration = 'supabase/migrations/20260915091805_powerhouse_publication_live_proof_guard.sql';

test('daily completion requires canonical publication obligations to be terminal/live-proven', () => {
  assert.equal(existsSync(migration), true, 'publication live-proof guard migration must exist');
  const sql = readFileSync(migration, 'utf8');
  assert.match(sql, /powerhouse_publication_proof_health/i);
  assert.match(sql, /content_publication_obligations/i);
  assert.match(sql, /LIVE_PROVEN/);
  assert.match(sql, /publication_proof/i);
  assert.match(sql, /execution_complete_with_publication_proof/i);
  assert.match(sql, /and coalesce\(\(pub->>'healthy'\)::boolean,false\)/i);
});
