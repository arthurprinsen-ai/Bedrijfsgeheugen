import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/supabase-production-baseline-capture.yml', import.meta.url), 'utf8');

test('trusted Supabase baseline capture remains default-branch only and read-only against production', () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /push:\n\s+branches: \[main\]/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.match(workflow, /supabase db dump --linked/);
  assert.match(workflow, /supabase migration list --linked/);
  assert.doesNotMatch(workflow, /pg_catalog/i);
  assert.doesNotMatch(workflow, /information_schema/i);
  assert.match(workflow, /production_write:false/);
  assert.match(workflow, /hand_built_catalog_dump:false/);
  assert.match(workflow, /--force-with-lease="refs\/heads\/\$TARGET_BRANCH:\$EXPECTED_HEAD"/);
});
