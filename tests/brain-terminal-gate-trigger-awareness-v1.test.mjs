import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('terminal closure uses attainable Brain evidence when no exact-head Unified Brain run exists', async()=>{
  const closure=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  const brain=await readFile('.github/workflows/unified-brain-delivery.yml','utf8');
  assert.doesNotMatch(brain,/^\s*pull_request:/m);
  assert.match(closure,/require_brain_evidence/);
  assert.match(closure,/unified-brain-delivery\.yml\/runs\?head_sha=\$\{HEAD_SHA\}/);
  assert.match(closure,/brain-foundation-verify\.yml\/runs\?head_sha=\$\{MERGE_SHA\}&event=push/);
  assert.match(closure,/TERMINAL_BRAIN_FOUNDATION_PROVEN/);
  assert.match(closure,/TERMINAL_BRAIN_EVIDENCE_NOT_TERMINAL/);
  assert.doesNotMatch(closure,/require_workflow "unified-brain-delivery\.yml" "BRAIN"/);
});
