import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration = new URL('../supabase/migrations/20260916215000_powerhouse_canonical_truth_closure_v1.sql', import.meta.url);

async function sql() {
  return readFile(migration, 'utf8');
}

test('closure read model reuses canonical obligations and blockers', async () => {
  const text = await sql();
  assert.match(text, /brain_obligations/i);
  assert.match(text, /brain_blockers/i);
  assert.match(text, /powerhouse_material_claims_v1/i);
});

test('closure read model is invoker-safe and not client-executable', async () => {
  const text = await sql();
  assert.match(text, /security_invoker\s*=\s*true/i);
  assert.match(text, /revoke\s+all\s+on\s+public\.powerhouse_material_claims_v1\s+from\s+anon/i);
  assert.match(text, /revoke\s+all\s+on\s+public\.powerhouse_material_claims_v1\s+from\s+authenticated/i);
  assert.match(text, /grant\s+select\s+on\s+public\.powerhouse_material_claims_v1\s+to\s+service_role/i);
});

test('unclassified open state fails closed as evidence missing', async () => {
  const text = await sql();
  assert.match(text, /EVIDENCE_MISSING/);
  assert.match(text, /CURRENT_EXTERNAL_BOUNDARY/);
  assert.match(text, /CURRENT_DEFECT/);
});

test('migration never reintroduces Make as an execution dependency', async () => {
  const text = await sql();
  assert.doesNotMatch(text, /BG168|BG166|hook\.eu|make\.com/i);
});