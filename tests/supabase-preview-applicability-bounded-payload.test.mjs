import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow=await readFile('.github/workflows/supabase-preview-applicability.yml','utf8');

test('Supabase preview applicability transports large check-run payloads through a file',()=>{
  assert.match(workflow,/payload_file="\$\(mktemp\)"/);
  assert.match(workflow,/-o "\$payload_file"/);
  assert.match(workflow,/PAYLOAD_FILE="\$payload_file" node --input-type=module/);
  assert.match(workflow,/readFileSync\(process\.env\.PAYLOAD_FILE,'utf8'\)/);
  assert.doesNotMatch(workflow,/PAYLOAD="\$payload"/);
});

test('provider proof remains exact-head and fail closed',()=>{
  assert.match(workflow,/c\?\.name==='Supabase Preview' && c\?\.app\?\.slug==='supabase'/);
  assert.match(workflow,/SUPABASE_PREVIEW_PROVIDER_VERIFIED/);
  assert.match(workflow,/SUPABASE_PREVIEW_PROVIDER_FAILED/);
  assert.match(workflow,/SUPABASE_PREVIEW_PROVIDER_NON_PROOF/);
  assert.match(workflow,/SUPABASE_PREVIEW_PROVIDER_TIMEOUT/);
});
