import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow=await readFile('.github/workflows/supabase-edge-production-authority.yml','utf8');

test('Supabase production authority has one complete replay-safe pipeline',()=>{
  assert.equal((workflow.match(/- name: Resolve exact function set/g)||[]).length,1);
  assert.equal((workflow.match(/- name: Capture immutable protected-main source identity/g)||[]).length,1);
  assert.equal((workflow.match(/- name: Observe Supabase GitHub deployment check/g)||[]).length,1);
  assert.equal((workflow.match(/for attempt in \$\(seq 1 24\)/g)||[]).length,1);
  assert.match(workflow,/grep -E '\^\[a-z0-9\]\[a-z0-9-\]\*\$' \| sort -u > \/tmp\/functions\.txt/);
  assert.match(workflow,/Terminal-Replay-PR/);
  assert.match(workflow,/SUPABASE_REPLAY_RUNTIME_SUPERSEDED/);
  assert.match(workflow,/TARGET_PR_NUMBER: \$\{\{ steps\.scope\.outputs\.target_pr \}\}/);
  assert.doesNotMatch(workflow,/SUPABASE_PRODUCTION_DEPLOYMENT_ANCHOR_NOT_FOUND/);
});

test('GitHub Supabase check is observability and provider source parity remains canonical authority',()=>{
  assert.match(workflow,/Observe Supabase GitHub deployment check/);
  assert.match(workflow,/blocking:false/);
  assert.match(workflow,/authority:'provider-source-parity'/);
  assert.match(workflow,/SUPABASE_EDGE_PROVIDER_SOURCE_PARITY_CONVERGED/);
  assert.match(workflow,/SUPABASE_EDGE_PROVIDER_SOURCE_PARITY_TIMEOUT/);
});
