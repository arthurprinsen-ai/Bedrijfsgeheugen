import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationPath = 'supabase/migrations/20260915170207_powerhouse_market_truth_economics_execution_guard_v1.sql';

test('observed economics can only be recorded for executed actions', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /powerhouse_record_action_economics_v1/i);
  assert.match(sql, /executed_at/i);
  assert.match(sql, /status/i);
  assert.match(sql, /action must be executed before economics can be recorded/i);
});

test('execution guard remains server-only', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /security\s+definer/i);
  assert.match(sql, /set\s+search_path\s*=\s*public/i);
  assert.match(sql, /revoke\s+execute\s+on\s+function[\s\S]*from\s+public\s*,\s*anon\s*,\s*authenticated/i);
  assert.match(sql, /grant\s+execute\s+on\s+function[\s\S]*to\s+service_role/i);
});
