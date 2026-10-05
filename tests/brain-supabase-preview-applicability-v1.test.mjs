import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowPath='.github/workflows/supabase-preview-applicability.yml';

test('applicability gate always runs on pull requests to main', async () => {
  const workflow=await readFile(workflowPath,'utf8');
  assert.match(workflow,/pull_request:/);
  assert.match(workflow,/branches: \[main\]/);
  assert.doesNotMatch(workflow,/pull_request:\s*[\s\S]{0,100}paths:/);
});

test('non-Supabase changes terminalize explicitly as not applicable success', async () => {
  const workflow=await readFile(workflowPath,'utf8');
  assert.match(workflow,/SUPABASE_PREVIEW_NOT_APPLICABLE/);
  assert.match(workflow,/grep -q '\^supabase\/'/);
});

test('Supabase changes require the provider-owned check on exact PR head', async () => {
  const workflow=await readFile(workflowPath,'utf8');
  assert.match(workflow,/github\.event\.pull_request\.head\.sha/);
  assert.match(workflow,/c\?\.name==='Supabase Preview'/);
  assert.match(workflow,/c\?\.app\?\.slug==='supabase'/);
  assert.match(workflow,/SUPABASE_PREVIEW_PROVIDER_VERIFIED/);
});

test('skipped or neutral provider outcomes fail closed', async () => {
  const workflow=await readFile(workflowPath,'utf8');
  assert.match(workflow,/skipped\|neutral/);
  assert.match(workflow,/SUPABASE_PREVIEW_PROVIDER_NON_PROOF/);
});
