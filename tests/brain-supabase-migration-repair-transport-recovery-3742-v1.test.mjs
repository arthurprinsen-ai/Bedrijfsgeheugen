import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/supabase-supported-migration-repair-3742.yml', import.meta.url), 'utf8');

test('historical replay keeps provider transport recovery bounded and mutation single-shot', () => {
  assert.match(workflow, /migration_list_with_retry\(\)/);
  assert.match(workflow, /for attempt in 1 2 3 4/);
  assert.match(workflow, /Supabase migration-list transport unavailable after 4 bounded attempts/);
  assert.match(workflow, /migration_list_with_retry \.\.\/repair-evidence\/before\.txt/);
  assert.match(workflow, /migration_list_with_retry \.\.\/repair-evidence\/after\.txt/);
  const repairMatches = workflow.match(/supabase migration repair[^\n]*--status applied --db-url "\$SUPABASE_DB_URL"/g) || [];
  assert.equal(repairMatches.length, 1);
  assert.match(workflow, /--status applied --db-url "\$SUPABASE_DB_URL"/);
  assert.doesNotMatch(workflow, /insert\s+into\s+supabase_migrations/i);
  assert.doesNotMatch(workflow, /update\s+supabase_migrations/i);
  assert.doesNotMatch(workflow, /delete\s+from\s+supabase_migrations/i);
});
