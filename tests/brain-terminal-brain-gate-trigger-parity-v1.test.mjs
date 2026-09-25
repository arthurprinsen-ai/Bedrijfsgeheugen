import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('terminal closure Brain gate matches executable workflow triggers', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  const unified=await readFile('.github/workflows/unified-brain-delivery.yml','utf8');
  assert.match(unified,/workflow_dispatch:/);
  assert.doesNotMatch(unified,/pull_request:/);
  assert.match(workflow,/require_brain_evidence/);
  assert.match(workflow,/unified-brain-delivery\.yml\/runs\?head_sha=\$\{HEAD_SHA\}&per_page=50/);
  assert.doesNotMatch(workflow,/unified-brain-delivery\.yml\/runs\?head_sha=\$\{HEAD_SHA\}&event=pull_request/);
  assert.match(workflow,/brain-foundation-verify\.yml\/runs\?head_sha=\$\{MERGE_SHA\}&event=push/);
  assert.match(workflow,/TERMINAL_BRAIN_FOUNDATION_PROVEN/);
  assert.match(workflow,/TERMINAL_BRAIN_EVIDENCE_NOT_TERMINAL/);
});
