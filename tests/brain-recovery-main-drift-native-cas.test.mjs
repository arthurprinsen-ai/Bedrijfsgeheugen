import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import './delivery-powerhouse-supervisor.test.mjs';

// Canonical Brain learning evaluator requires a brain-prefixed executable test.
// Reuse the original supervisor regression suite; never replace it with a fake stub.
test('supervisor CAS learning keeps exactly one workflow and one jobs root',()=>{
  const workflow=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.equal((workflow.match(/^name: Powerhouse Delivery Recovery Supervisor$/gm)||[]).length,1);
  assert.equal((workflow.match(/^jobs:$/gm)||[]).length,1);
  assert.match(workflow,/expected_head_sha="\$head"/);
  assert.match(workflow,/MAIN_DRIFT_SYNC_RECONCILED/);
  assert.match(workflow,/MAIN_DRIFT_REFRESH_BUDGET_EXHAUSTED/);
  assert.match(workflow,/MAIN_DRIFT_SYNC_TIMED_OUT/);
  assert.doesNotMatch(workflow,/gh api --method POST "repos\/\$repo\/merges"/);
});
