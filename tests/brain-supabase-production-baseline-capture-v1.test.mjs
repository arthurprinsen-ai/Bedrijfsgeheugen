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
  assert.match(workflow, /supabase migration repair --linked --status applied/);
  assert.match(workflow, /EFFECT_VERIFIED_REPAIR_REQUIRED/);
  assert.match(workflow, /REPAIRED_APPLIED_VERIFIED/);
  assert.doesNotMatch(workflow, /pg_catalog/i);
  assert.doesNotMatch(workflow, /information_schema/i);
    assert.match(workflow, /hand_built_catalog_dump:false/);
  assert.match(workflow, /supabase migration repair/);
  assert.match(workflow, /20260920101150/);
  assert.match(workflow, /20260920102450/);
  assert.match(workflow, /20260925080500/);
  assert.match(workflow, /20261005133951/);
  assert.match(workflow, /PRE_REPAIR_PARITY_NOT_EXACT/);
  assert.match(workflow, /CANDIDATE_REPAIR_SET_NOT_EXACT/);
  assert.match(workflow, /supabase db query --linked/);
  assert.match(workflow, /POST_REPAIR_PARITY_DRIFT/);
  assert.match(workflow, /sql_reexecuted:false/);
  assert.match(workflow, /--force-with-lease="refs\/heads\/\$TARGET_BRANCH:\$EXPECTED_HEAD"/);
});


test('baseline capture dynamically selects one highest canonical recovery and pins CLI', () => {
  assert.match(workflow, /supabase-migration-history-canonical-v/);
  assert.match(workflow, /Multiple open canonical recoveries share highest version/);
  assert.match(workflow, /version: 2\.119\.0/);
});
