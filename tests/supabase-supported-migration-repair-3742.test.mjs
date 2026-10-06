import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/supabase-supported-migration-repair-3742.yml', import.meta.url), 'utf8');

test('repair control plane is trusted-main-only and pinned', () => {
  assert.match(workflow, /push:\n    branches: \[main\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.match(workflow, /refs\/heads\/main/);
  assert.match(workflow, /version: 2\.119\.0/);
  assert.match(workflow, /environment: production/);
});

test('repair is allowlisted to exactly the four proven replay baselines', () => {
  for (const version of ['20260920101150','20260920102450','20260925080500','20261005133951']) {
    assert.match(workflow, new RegExp(version));
  }
  assert.match(workflow, /EFFECT_VERIFIED_REPAIR_REQUIRED/);
  assert.match(workflow, /MISSING_PRODUCTION_EFFECT_EVIDENCE/);
  assert.match(workflow, /UNEXPECTED_PRE_REPAIR_DRIFT/);
});

test('provider repair updates tracking only and proves post-repair parity', () => {
  assert.match(workflow, /supabase migration repair[\s\S]*--status applied/);
  assert.match(workflow, /supabase migration list --linked/);
  assert.doesNotMatch(workflow, /insert\s+into\s+supabase_migrations/i);
  assert.doesNotMatch(workflow, /update\s+supabase_migrations/i);
  assert.doesNotMatch(workflow, /delete\s+from\s+supabase_migrations/i);
  assert.match(workflow, /POST_REPAIR_PARITY_FAILED/);
});

test('recovery branch advancement is exact-head leased and remains pre-terminal', () => {
  assert.match(workflow, /--force-with-lease="refs\/heads\/\$TARGET_BRANCH:\$EXPECTED_HEAD"/);
  assert.match(workflow, /REPAIRED_APPLIED_VERIFIED/);
  assert.match(workflow, /does not itself prove fresh replay, exact-HEAD gates, protected merge, or post-merge production readback/);
});


test('normalizes Supabase CLI migration-list backticks and blank cells before parity comparison', () => {
  assert.match(workflow, /replace\(\/\^\\`\|\\`\$\/g,''\)/);
  assert.match(workflow, /UNEXPECTED_PRE_REPAIR_DRIFT/);
  assert.match(workflow, /POST_REPAIR_PARITY_FAILED/);
});
