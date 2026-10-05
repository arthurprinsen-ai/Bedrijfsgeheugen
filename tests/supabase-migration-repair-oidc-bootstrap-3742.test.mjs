import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/supabase-supported-migration-repair-3742.yml', import.meta.url), 'utf8');

test('trusted repair bootstrap uses exact-main GitHub OIDC transport', () => {
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /refs\/heads\/main/);
  assert.match(workflow, /version: 2\.119\.0/);
  assert.match(workflow, /bedrijfsgeheugen-supabase-migration-repair-bridge/);
  assert.match(workflow, /supabase-migration-repair-bridge/);
  assert.match(workflow, /expected_sha:process\.env\.GITHUB_SHA/);
  assert.match(workflow, /::add-mask::\$db_url/);
});

test('trusted repair bootstrap has no GitHub Supabase credentials and uses official db-url CLI', () => {
  assert.doesNotMatch(workflow, /secrets\.SUPABASE_ACCESS_TOKEN/);
  assert.doesNotMatch(workflow, /secrets\.(?:PRODUCTION_DB_PASSWORD|SUPABASE_DB_PASSWORD)/);
  assert.doesNotMatch(workflow, /supabase link --project-ref/);
  assert.match(workflow, /supabase migration list --db-url "\$SUPABASE_DB_URL"/);
  assert.match(workflow, /supabase migration repair[\s\S]*--status applied --db-url "\$SUPABASE_DB_URL"/);
  assert.doesNotMatch(workflow, /insert\s+into\s+supabase_migrations/i);
  assert.doesNotMatch(workflow, /update\s+supabase_migrations/i);
  assert.doesNotMatch(workflow, /delete\s+from\s+supabase_migrations/i);
});

test('repair remains exactly allowlisted and fail-closed', () => {
  for (const version of ['20260920101150','20260920102450','20260925080500','20261005133951']) {
    assert.match(workflow, new RegExp(version));
  }
  assert.match(workflow, /EFFECT_VERIFIED_REPAIR_REQUIRED/);
  assert.match(workflow, /MISSING_PRODUCTION_EFFECT_EVIDENCE/);
  assert.match(workflow, /UNEXPECTED_PRE_REPAIR_DRIFT/);
  assert.match(workflow, /POST_REPAIR_PARITY_FAILED/);
  assert.match(workflow, /--force-with-lease="refs\/heads\/\$TARGET_BRANCH:\$EXPECTED_HEAD"/);
});
