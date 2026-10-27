import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('terminal closure requires exact-candidate Brain evidence with executable dispatch triggers', async()=>{
  const closure=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  const brain=await readFile('.github/workflows/unified-brain-delivery.yml','utf8');
  assert.doesNotMatch(brain,/^\s*pull_request:/m);
  assert.match(closure,/require_workflow "unified-brain-delivery\.yml" "BRAIN"/);
  assert.ok(closure.includes('runs?branch=main&event=workflow_dispatch&per_page=100'));
  assert.ok(closure.includes('BRAIN delivery PR #${PR_NUMBER} ${HEAD_SHA}'));
  assert.ok(closure.includes('.display_title==$title'));
  assert.ok(closure.includes('/compare/${run_source_sha}...main'));
  assert.match(closure,/TERMINAL_BRAIN_WORKFLOW_SOURCE_NOT_PROTECTED_MAIN/);
  assert.doesNotMatch(closure,/require_brain_evidence|TERMINAL_BRAIN_(FOUNDATION|DESCENDANT)_PROVEN/);
  assert.match(closure,/TERMINAL_CRITICAL_GATE_NOT_TERMINAL/);
});
