import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const hardeningPath = new URL('../supabase/migrations/20260830_brain_delivery_evidence_least_privilege.sql', import.meta.url);

test('BRAIN delivery evidence follow-up migration removes broad service_role mutation privileges', async () => {
  const sql = await readFile(hardeningPath, 'utf8');
  assert.match(sql, /revoke\s+all\s+on\s+table\s+public\.brain_delivery_evidence\s+from\s+service_role/i);
  assert.match(sql, /grant\s+select\s*,\s*insert\s+on\s+table\s+public\.brain_delivery_evidence\s+to\s+service_role/i);
  assert.match(sql, /revoke\s+all\s+on\s+table\s+public\.brain_delivery_evidence\s+from\s+anon\s*,\s*authenticated/i);
  assert.doesNotMatch(sql, /grant[^;]*(update|delete|truncate)[^;]*service_role/i);
});
