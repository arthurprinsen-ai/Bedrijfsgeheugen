import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config=readFileSync(new URL('../supabase/config.toml',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../.github/workflows/supabase-edge-production-authority.yml',import.meta.url),'utf8');

test('independent social reviewer remains declared for protected-main provider readback',()=>{
  assert.match(config,/\[functions\.bg-pre-publish-review\][\s\S]*?entrypoint = "\.\/functions\/bg-pre-publish-review\/index\.ts"/);
  assert.match(config,/\[functions\.powerhouse-social-publisher\][\s\S]*?entrypoint = "\.\/functions\/powerhouse-social-publisher\/index\.ts"/);
});

test('401 invalid credential is terminal rather than retried as eventual deployment',()=>{
  assert.match(workflow,/supabase functions download "\$fn" --project-ref "\$PROJECT_REF" --use-api/);
  assert.match(workflow,/if grep -Eiq 'Error status 401\|Invalid access token'/);
  assert.match(workflow,/SUPABASE_ACCESS_TOKEN_INVALID_REAUTH_REQUIRED/);
  assert.match(workflow,/exit 78/);
  assert.match(workflow,/SUPABASE_EDGE_PROVIDER_SOURCE_PARITY_TIMEOUT/);
});

test('GitHub deployment authority stays attestation-only',()=>{
  assert.match(workflow,/github_actions_role=ATTESTATION_ONLY/);
  assert.match(workflow,/provider_deployer=SUPABASE_GITHUB_INTEGRATION/);
  assert.doesNotMatch(workflow,/supabase functions deploy/);
});
