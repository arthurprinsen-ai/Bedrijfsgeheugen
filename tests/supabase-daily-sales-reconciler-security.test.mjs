import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath = new URL('../supabase/migrations/20260916195000_daily_sales_reconciler_security.sql', import.meta.url);

test('daily sales reconciler SECURITY DEFINER RPC is service-role only', () => {
  assert.equal(fs.existsSync(migrationPath), true, 'security migration must exist');
  const migration = fs.readFileSync(migrationPath, 'utf8');

  assert.match(
    migration,
    /revoke\s+all\s+on\s+function\s+public\.powerhouse_reconcile_daily_sales_action_set_v1\(date\)\s+from\s+public\s*,\s*anon\s*,\s*authenticated/i,
  );
  assert.match(
    migration,
    /grant\s+execute\s+on\s+function\s+public\.powerhouse_reconcile_daily_sales_action_set_v1\(date\)\s+to\s+service_role/i,
  );
});
