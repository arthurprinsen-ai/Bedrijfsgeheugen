import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/supabase-preview-applicability.yml','utf8');

test('Supabase Preview applicability transports large check-run payloads through a file, not env/argv', () => {
  assert.match(workflow,/payload_file="\$RUNNER_TEMP\/supabase-preview-check-runs\.json"/);
  assert.match(workflow,/curl[\s\S]*-o "\$payload_file"/);
  assert.match(workflow,/readFileSync\(process\.argv\[2\],'utf8'\)/);
  assert.doesNotMatch(workflow,/PAYLOAD="\$payload"/);
  assert.doesNotMatch(workflow,/process\.env\.PAYLOAD/);
});

test('Supabase provider proof remains exact and fail-closed', () => {
  assert.match(workflow,/c\?\.name==='Supabase Preview'/);
  assert.match(workflow,/c\?\.app\?\.slug==='supabase'/);
  assert.match(workflow,/success\)[\s\S]*SUPABASE_PREVIEW_PROVIDER_VERIFIED/);
  assert.match(workflow,/failure\|cancelled\|timed_out\|action_required\|stale\|startup_failure/);
  assert.match(workflow,/skipped\|neutral/);
  assert.match(workflow,/SUPABASE_PREVIEW_PROVIDER_TIMEOUT/);
});
