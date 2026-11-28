import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {classifyWebsiteRelease} from '../tools/site-shell/website-release-risk.mjs';

test('recovery supervisor is bounded and cannot fan out from main pushes',()=>{
  const workflow=readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.doesNotMatch(workflow,/\n\s*push:\s*\n\s*branches:\s*\[main\]/);
  assert.match(workflow,/cron:\s*'2-57\/5 \* \* \* \*'/);
  assert.match(workflow,/ACTIVE_RUN_CIRCUIT_BREAKER:\s*'12'/);
  assert.match(workflow,/RECOVERY_PR_BUDGET:\s*'5'/); assert.ok(workflow.includes("adaptive-recovery-capacity.mjs init \"$capacity_state\"")); assert.ok(workflow.includes("adaptive-recovery-capacity.mjs reserve \"$capacity_state\"")); assert.ok(workflow.includes("reserve_recovery_capacity || return 1")); assert.ok(workflow.includes("[ \"$reserved_actions\" -ge \"$cycle_budget\" ]"));
  assert.match(workflow,/ACTIONS_QUEUE_CIRCUIT_OPEN/);
  assert.match(workflow,/STALE_QUEUE_MIN_AGE_SECONDS:\s*'60'/);
  assert.match(workflow,/STALE_QUEUE_CANCEL_BUDGET:\s*'100'/);
  assert.match(workflow,/STALE_IN_PROGRESS_MIN_AGE_SECONDS:\s*'300'/);
  assert.match(workflow,/STALE_ACTIONS_RUN_CANCELLED/);
  assert.match(workflow,/cancel_stale_runs queued/);
  assert.match(workflow,/cancel_stale_runs in_progress/);
  assert.match(workflow,/current_main_sha/);
  assert.match(workflow,/pr_head_sha/);
  assert.match(workflow,/current_branch_sha/);
  assert.match(workflow,/actions\/runs\/\$run_id\/cancel/);
  assert.match(workflow,/PROVIDER_CANCELLATION_UNPROVEN/);
  assert.doesNotMatch(workflow,/classified:PROVIDER_CONTROL_PLANE_ZOMBIE/);
  assert.match(workflow,/effective_active_runs/);
  assert.match(workflow,/ACTIONS_ACTIVE_RUNS_RAW/);
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


test('effective Actions pressure uses a fully paginated status census',()=>{
  const workflow=readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  const capacity=readFileSync('tools/delivery/adaptive-recovery-capacity.mjs','utf8');
  assert.ok(capacity.includes("queued:'queued',inProgress:'in_progress',pending:'pending',waiting:'waiting',requested:'requested'"));
  assert.match(capacity,/RECOVERY_QUEUE_INCOMPLETE/);
  assert.match(capacity,/RECOVERY_QUEUE_CROSS_STATUS_DUPLICATE/);
  assert.match(capacity,/RECOVERY_QUEUE_CHANGED/);
  assert.ok(workflow.includes('adaptive-recovery-capacity.mjs init "$capacity_state"'));
  assert.doesNotMatch(workflow,/effective_active_runs=\$\(\(active_runs - obsolete_uncancellable\)\)/);
});
