import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/supabase-supported-migration-repair-3742.yml','utf8');

test('migration repair retries only read-only list calls and resumes safely from zero drift', () => {
  assert.match(workflow, /migration_list_with_retry\(\)/);
  assert.match(workflow, /for attempt in 1 2 3/);
  assert.match(workflow, /supabase migration list --db-url/);
  assert.match(workflow, /drift\.length === 0/);
  assert.match(workflow, /repair_needed=.*repair-needed\.txt/);
  assert.match(workflow, /case "\$repair_needed" in/);
  assert.match(workflow, /false\)[\s\S]*resuming at post-repair readback/);
  assert.match(workflow, /true\)[\s\S]*supabase migration repair/);
  assert.doesNotMatch(workflow, /for attempt[\s\S]{0,500}supabase migration repair/);
});
