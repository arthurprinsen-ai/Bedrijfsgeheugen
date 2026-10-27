import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const requiredPath='.github/workflows/required-test.yml';

test('Supabase applicability is derived inside canonical Required on every pull request to main', async () => {
  const workflow=await readFile(requiredPath,'utf8');
  assert.match(workflow,/pull_request:/);
  assert.match(workflow,/supabase_preview_required: \$\{\{ steps\.scope\.outputs\.supabase_preview_required \}\}/);
  assert.match(workflow,/const supabasePreviewRequired=databaseRelevantSupabase \|\| supabaseConfigDatabaseRelevant;/);
});

test('non-Supabase changes do not require Supabase and skip both Supabase jobs', async () => {
  const workflow=await readFile(requiredPath,'utf8');
  assert.match(workflow,/path\.startsWith\('supabase\/'\)/);
  assert.match(workflow,/supabase_source_contract:[\s\S]*?if: needs\.preflight\.outputs\.supabase_preview_required == 'true'/);
  assert.match(workflow,/supabase_preview:[\s\S]*?if: needs\.preflight\.outputs\.supabase_preview_required == 'true'/);
});

test('Edge Function-only and config-only Supabase changes are not database relevant', async () => {
  const workflow=await readFile(requiredPath,'utf8');
  assert.match(workflow,/!path\.startsWith\('supabase\/functions\/'\)/);
  assert.match(workflow,/path !== 'supabase\/config\.toml'/);
  assert.match(workflow,/supabaseConfigDatabaseRelevant/);
});

test('non-function Supabase changes require the provider-owned check on exact candidate head', async () => {
  const workflow=await readFile(requiredPath,'utf8');
  const diagnosis=await readFile('tools/ci/supabase-preview-diagnosis.mjs','utf8');
  assert.match(workflow,/Verify provider-owned Supabase Preview on exact candidate head/);
  assert.match(workflow,/HEAD_SHA: \$\{\{ needs\.preflight\.outputs\.change_head_sha \}\}/);
  assert.match(diagnosis,/check\?\.name === 'Supabase Preview' && check\?\.app\?\.slug === 'supabase'/);
  assert.match(workflow,/SUPABASE_PREVIEW_PROVIDER_VERIFIED/);
});

test('skipped, neutral and failed provider outcomes fail closed', async () => {
  const workflow=await readFile(requiredPath,'utf8');
  assert.match(workflow,/failure:\*\|cancelled:\*\|timed_out:\*\|action_required:\*\|stale:\*\|startup_failure:\*\|neutral:\*/);
  assert.match(workflow,/SUPABASE_PREVIEW_PROVIDER_NON_SUCCESS/);
  assert.match(workflow,/SUPABASE_PREVIEW_PROVIDER_TIMEOUT/);
});

test('latest provider check wins and success must be stable before verification', async () => {
  const workflow=await readFile(requiredPath,'utf8');
  const diagnosis=await readFile('tools/ci/supabase-preview-diagnosis.mjs','utf8');
  assert.match(diagnosis,/Number\(b\.id \|\| 0\) - Number\(a\.id \|\| 0\)/);
  assert.match(workflow,/stable_provider_success_id/);
  assert.match(workflow,/success:\*/);
  assert.match(workflow,/if \[ "\$stable_provider_success_id" = "\$provider_id" \]/);
});

