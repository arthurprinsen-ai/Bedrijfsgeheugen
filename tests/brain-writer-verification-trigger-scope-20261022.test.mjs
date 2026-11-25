import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/repo-writer-operational-verification.yml', 'utf8');
const trigger = workflow.split('\npermissions:\n')[0];

test('writer verification is triggered only by writer proof PR head branches', () => {
  assert.match(trigger, /workflow_run:\s*\n\s+workflows: \['Required test'\]\s*\n\s+types: \[completed\]/);
  for (const branch of ['verify/**', 'verify-cheap/**', 'verify-parity/**']) {
    assert.ok(trigger.includes(`- '${branch}'`), `missing workflow_run branch guard: ${branch}`);
  }
  assert.doesNotMatch(trigger, /\n\s+- '(fix|main|feature)\//);
});

test('writer routing and per-PR concurrency remain intact', () => {
  assert.match(workflow, /cancel-in-progress: true/);
  assert.match(workflow, /dispatch-writer-candidate:/);
  assert.match(workflow, /route-cheap-canary:/);
  assert.match(workflow, /route-parity-rollback:/);
  assert.match(workflow, /github\.event\.workflow_run\.conclusion == 'success'/);
});
