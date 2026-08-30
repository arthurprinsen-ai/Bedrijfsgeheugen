import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationPath = 'supabase/migrations/20260830_ranking_private_helper.sql';

async function migrationText() {
  try {
    return await readFile(migrationPath, 'utf8');
  } catch {
    return '';
  }
}

test('ranking privilege elevation is moved out of public API schema', async () => {
  const sql = (await migrationText()).toLowerCase();
  assert.notEqual(sql, '', 'ranking hardening migration must exist');
  assert.match(sql, /create\s+schema\s+if\s+not\s+exists\s+private/);
  assert.match(sql, /function\s+private\.mijn_ranking\s*\(\s*\)[\s\S]*security\s+definer/);
  assert.match(sql, /function\s+public\.mijn_ranking\s*\(\s*\)[\s\S]*security\s+invoker/);
  assert.match(sql, /select\s+\*\s+from\s+private\.mijn_ranking\s*\(\s*\)/);
});

test('private helper is not exposed to anon or PUBLIC', async () => {
  const sql = (await migrationText()).toLowerCase();
  assert.match(sql, /revoke\s+all\s+on\s+function\s+private\.mijn_ranking\s*\(\s*\)\s+from\s+public\s*,\s*anon/);
  assert.match(sql, /grant\s+execute\s+on\s+function\s+private\.mijn_ranking\s*\(\s*\)\s+to\s+authenticated\s*,\s*service_role/);
  assert.match(sql, /revoke\s+all\s+on\s+function\s+public\.mijn_ranking\s*\(\s*\)\s+from\s+public\s*,\s*anon/);
});
