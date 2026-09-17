import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const required = [
  'supabase/migrations/20260916195037_powerhouse_closure_a_f.sql',
  'supabase/migrations/20260916195048_powerhouse_closure_strict_cycle.sql',
  'supabase/migrations/20260916195056_powerhouse_closure_legacy_learning_seed.sql'
];

const forbiddenAliases = [
  'supabase/migrations/20260916220000_powerhouse_closure_a_f.sql',
  'supabase/migrations/20260916220100_powerhouse_closure_strict_cycle.sql',
  'supabase/migrations/20260916220200_powerhouse_closure_legacy_learning_seed.sql'
];

test('closure migrations use exact production identities with no timestamp aliases', () => {
  for (const file of required) assert.equal(existsSync(file), true, `missing production migration identity: ${file}`);
  for (const file of forbiddenAliases) assert.equal(existsSync(file), false, `superseded timestamp alias must be removed: ${file}`);
});
