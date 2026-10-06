import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/supabase-supported-migration-repair-3742.yml','utf8');
const bridge = await readFile('supabase/functions/supabase-migration-repair-bridge/index.ts','utf8');
const config = await readFile('supabase/config.toml','utf8');
const applicability = await readFile('.github/workflows/supabase-preview-applicability.yml','utf8');

test('trusted repair uses only canonical Supavisor session-mode IPv4 transport', () => {
  assert.match(workflow, /supavisor-session-ipv4/);
  assert.match(workflow, /aws-0-eu-central-1\.pooler\.supabase\.com/);
  assert.match(workflow, /DIRECT_IPV6_ROUTE_FORBIDDEN/);
  assert.match(workflow, /SESSION_POOLER_PORT_REQUIRED/);
  assert.match(workflow, /SESSION_POOLER_USERNAME_REQUIRED/);
  assert.match(workflow, /SSLMODE_REQUIRE_REQUIRED/);
  assert.match(workflow, /getent ahostsv4/);
});

test('OIDC bridge rewrites the direct credential source to the IPv4 session pooler', () => {
  assert.match(bridge, /db\." \+ projectRef \+ "\.supabase\.co"/);
  assert.match(bridge, /sessionPoolerHost = "aws-0-eu-central-1\.pooler\.supabase\.com"/);
  assert.match(bridge, /url\.port = "5432"/);
  assert.match(bridge, /url\.username = "postgres\." \+ projectRef/);
  assert.match(bridge, /sslmode", "require"/);
  assert.match(bridge, /transport: "supavisor-session-ipv4"/);
  assert.match(config, /\[functions\.supabase-migration-repair-bridge\]/);
});

test('function-only config metadata does not falsely require a database preview', () => {
  assert.match(applicability, /grep -v '\^supabase\/config\.toml\$'/);
  assert.match(applicability, /import tomllib/);
  assert.match(applicability, /normalized\.pop\('functions', None\)/);
  assert.match(applicability, /function_config_only/);
});


test('merged repair remains immutable while the IPv4 transport is re-proven', () => {
  assert.match(workflow, /mode="readback_only"/);
  assert.match(workflow, /Trusted-Repair-State: REPAIRED_APPLIED_VERIFIED/);
  assert.match(workflow, /MERGED_REPAIR_REMOTE_READBACK_MISSING/);
  assert.match(workflow, /if: steps\.candidate\.outputs\.mode == 'repair'/);
  assert.match(workflow, /if: steps\.candidate\.outputs\.mode == 'readback_only'/);
});
