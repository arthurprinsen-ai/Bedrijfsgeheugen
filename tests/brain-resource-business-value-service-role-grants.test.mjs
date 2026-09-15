import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL('../supabase/migrations/20260915222500_resource_business_value_views_service_role_select_only.sql', import.meta.url);

async function migration() {
  return readFile(migrationUrl, 'utf8').catch(() => '');
}

test('resource business value views revoke inherited service_role privileges before restoring select only', async () => {
  const sql = (await migration()).toLowerCase();
  for (const view of [
    'powerhouse_action_business_value_v1',
    'powerhouse_portal_resource_summary_v2',
    'powerhouse_commercial_next_best_action_v4',
  ]) {
    assert.match(sql, new RegExp(`revoke\\s+all\\s+on\\s+public\\.${view}\\s+from\\s+service_role`));
    assert.match(sql, new RegExp(`grant\\s+select\\s+on\\s+public\\.${view}\\s+to\\s+service_role`));
  }
});
