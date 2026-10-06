import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/supabase-supported-migration-repair-3742.yml', import.meta.url), 'utf8');
const bridge = await readFile(new URL('../supabase/functions/supabase-migration-repair-bridge/index.ts', import.meta.url), 'utf8');
const config = await readFile(new URL('../supabase/config.toml', import.meta.url), 'utf8');

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


test('trusted repair is structurally pinned to Supavisor session-mode IPv4', () => {
  assert.match(workflow, /transport.*supavisor-session-ipv4/);
  assert.match(workflow, /aws-0-eu-central-1\.pooler\.supabase\.com/);
  assert.match(workflow, /SESSION_POOLER_PORT_REQUIRED/);
  assert.match(workflow, /SESSION_POOLER_USERNAME_REQUIRED/);
  assert.match(workflow, /DIRECT_IPV6_ROUTE_FORBIDDEN/);
  assert.match(workflow, /getent ahostsv4/);

  assert.match(bridge, /const sessionPoolerHost = "aws-0-eu-central-1\.pooler\.supabase\.com"/);
  assert.match(bridge, /url\.port = "5432"/);
  assert.match(bridge, /url\.username = "postgres\." \+ projectRef/);
  assert.match(bridge, /sslmode", "require"/);
  assert.match(bridge, /transport: "supavisor-session-ipv4"/);
  assert.match(config, /\[functions\.supabase-migration-repair-bridge\]/);
  assert.match(config, /verify_jwt = false/);
});
