import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {classifyWebsiteRelease} from '../tools/site-shell/website-release-risk.mjs';

test('recovery supervisor is bounded and cannot fan out from main pushes',()=>{
  const workflow=readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.doesNotMatch(workflow,/\n\s*push:\s*\n\s*branches:\s*\[main\]/);
  assert.match(workflow,/cron:\s*'\*\/15 \* \* \* \*'/);
  assert.match(workflow,/ACTIVE_RUN_CIRCUIT_BREAKER:\s*'20'/);
  assert.match(workflow,/RECOVERY_PR_BUDGET:\s*'1'/);
  assert.match(workflow,/ACTIONS_QUEUE_CIRCUIT_OPEN/);
  assert.match(workflow,/STALE_QUEUE_MIN_AGE_SECONDS:\s*'21600'/);
  assert.match(workflow,/STALE_QUEUE_CANCEL_BUDGET:\s*'20'/);
  assert.match(workflow,/STALE_IN_PROGRESS_MIN_AGE_SECONDS:\s*'1800'/);
  assert.match(workflow,/STALE_ACTIONS_RUN_CANCELLED/);
  assert.match(workflow,/cancel_stale_runs queued/);
  assert.match(workflow,/cancel_stale_runs in_progress/);
  assert.match(workflow,/current_main_sha/);
  assert.match(workflow,/pr_head_sha/);
  assert.match(workflow,/current_branch_sha/);
  assert.match(workflow,/actions\/runs\/\$run_id\/cancel/);
});


test('queue-recovery control-plane changes never launch full website browser verification', async()=>{
  const riskConfig=JSON.parse(await readFile('site/website-release-risk.json','utf8'));
  const acceptedBaseline=JSON.parse(await readFile('site/accepted-baseline.json','utf8'));
  const result=classifyWebsiteRelease({
    changedPaths:[
      '.github/workflows/powerhouse-delivery-recovery-supervisor.yml',
      'tests/delivery-powerhouse-supervisor.test.mjs',
      'tests/brain-actions-queue-storm-guard-v1.test.mjs',
      'docs/changes/2026-09-24-actions-queue-storm-guard-v1.md',
      'brain/learning/actions-queue-storm-guard-20260924-v1.json'
    ],
    riskConfig,
    acceptedBaseline
  });
  assert.equal(result.lane,'control-plane');
  assert.equal(result.requires_preview,false);
  assert.deepEqual(result.affected_routes,[]);
});
