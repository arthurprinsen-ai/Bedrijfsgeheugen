import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('recovery supervisor is bounded and cannot fan out from main pushes',()=>{
  const workflow=readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.doesNotMatch(workflow,/\n\s*push:\s*\n\s*branches:\s*\[main\]/);
  assert.match(workflow,/cron:\s*'\*\/15 \* \* \* \*'/);
  assert.match(workflow,/ACTIVE_RUN_CIRCUIT_BREAKER:\s*'20'/);
  assert.match(workflow,/RECOVERY_PR_BUDGET:\s*'1'/);
  assert.match(workflow,/ACTIONS_QUEUE_CIRCUIT_OPEN/);
});
