import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('autonomous improvement stops proposing below the proven safe floor', async () => {
  const sql = await readFile('supabase/migrations/20260920095700_autonomous_improvement_floor_terminal_v1.sql','utf8');
  assert.match(sql, /promoted_window.*<= 12/s);
  assert.match(sql, /NO_OP_ALREADY_AT_SAFE_FLOOR/);
  assert.match(sql, /brain_transition_obligation/);
  assert.match(sql, /'FULFILLED'/);
  assert.match(sql, /revoke execute on function public\.powerhouse_autonomous_improvement_cron_v1\(\) from public, anon, authenticated/i);
  assert.doesNotMatch(sql, /replay_window_hours[^\n]*6/);
});
