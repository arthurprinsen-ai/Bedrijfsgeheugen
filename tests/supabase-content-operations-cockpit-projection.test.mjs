import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const migration = 'supabase/migrations/20260916163500_content_operations_cockpit_projection_repair_v1.sql';

test('content operations cockpit keeps one-row projection and decision lineage', () => {
  assert.equal(existsSync(migration), true, 'forward corrective migration must exist on current source authority');
  const sql = readFileSync(migration, 'utf8');
  assert.match(sql, /with\s+experiment_one\s+as/i, 'cockpit must dedupe social_experiments before joining obligations');
  assert.match(sql, /distinct\s+on\s*\(tenant_id,\s*experiment_id,\s*calendar_date\)/i);
  assert.match(sql, /left\s+join\s+public\.powerhouse_channel_decisions\s+d/i, 'cockpit must project canonical decision lineage');
  for (const field of ['d.decision', 'd.state as decision_state', 'd.delivery_ref', 'd.delivery_evidence', 'd.learning_evidence']) {
    assert.ok(sql.includes(field), `missing cockpit projection: ${field}`);
  }
  assert.match(sql, /security_invoker\s*=\s*true/i);
  assert.match(sql, /revoke\s+all\s+on\s+table\s+public\.content_operations_cockpit\s+from\s+public,\s*anon,\s*authenticated/i);
  assert.match(sql, /grant\s+select\s+on\s+table\s+public\.content_operations_cockpit\s+to\s+service_role/i);
});
