import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('terminal closure is trigger-aware for workflows that cannot emit pull_request runs', async()=>{
  const closure=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  const brain=await readFile('.github/workflows/unified-brain-delivery.yml','utf8');
  assert.doesNotMatch(brain,/^\s*pull_request:/m);
  assert.match(closure,/require_pr_triggered_workflow/);
  assert.match(closure,/TERMINAL_CRITICAL_GATE_NOT_APPLICABLE/);
  assert.match(closure,/reason=no_pull_request_trigger/);
  assert.match(closure,/require_pr_triggered_workflow "unified-brain-delivery\.yml" "BRAIN"/);
  assert.doesNotMatch(closure,/require_workflow "unified-brain-delivery\.yml" "BRAIN"/);
});
