import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assessQueuePressure } from '../tools/delivery/predictive-controller.mjs';

test('recovery supervisor is scheduled/manual only and applies repository backpressure', async () => {
  const yml = await readFile('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.doesNotMatch(yml,/\n\s*push:\s*\n\s*branches:\s*\[main\]/);
  assert.match(yml,/workflow_dispatch:/);
  assert.match(yml,/cron:\s*'\*\/15 \* \* \* \*'/);
  assert.match(yml,/ACTIVE_RUN_CIRCUIT_BREAKER:\s*'20'/);
  assert.match(yml,/RECOVERY_PR_BUDGET:\s*'1'/);
  assert.match(yml,/ACTIONS_QUEUE_CIRCUIT_OPEN/);
  assert.match(yml,/concurrency:\n\s+group: powerhouse-delivery-recovery-supervisor\n\s+cancel-in-progress: true/);
});

test('Required and BRAIN share PR single-flight identity across native and recovery triggers', async () => {
  for (const path of ['.github/workflows/required-test.yml','.github/workflows/unified-brain-delivery.yml']) {
    const yml = await readFile(path,'utf8');
    const concurrency = yml.slice(yml.indexOf('concurrency:'), yml.indexOf('\njobs:'));
    assert.match(concurrency,/inputs\.pr_number \|\| github\.event\.pull_request\.number/);
    assert.doesNotMatch(concurrency,/github\.event_name/);
    assert.match(concurrency,/cancel-in-progress: true/);
  }
});

test('skill projection supersedes stale same-PR/ref work', async () => {
  const yml = await readFile('.github/workflows/powerhouse-skill-projection.yml','utf8');
  assert.match(yml,/group: powerhouse-skill-projection-\$\{\{ github\.event\.pull_request\.number \|\| github\.ref_name \}\}/);
  assert.match(yml,/cancel-in-progress: true/);
});

test('Required executes this CI admission regression', async () => {
  const yml = await readFile('.github/workflows/required-test.yml','utf8');
  assert.match(yml,/tests\/brain-ci-admission-single-flight\.test\.mjs/);
});

test('queue pressure forecast blocks fan-out before mutation', () => {
  const projected=assessQueuePressure({queued:11,inProgress:7,projectedNewRuns:3});
  assert.equal(projected.state,'PROJECTED_OVERLOAD');
  assert.equal(projected.allowOptionalDispatch,false);
  assert.equal(projected.shouldBatchWrites,true);

  const open=assessQueuePressure({queued:20,inProgress:1});
  assert.equal(open.state,'CIRCUIT_OPEN');
  assert.match(open.action,/NO_NEW_RECOVERY_OR_OPTIONAL_WORK/);

  const tooWide=assessQueuePressure({queued:2,inProgress:2,projectedNewRuns:7});
  assert.equal(tooWide.state,'PROJECTED_OVERLOAD');

  const pressured=assessQueuePressure({queued:10,inProgress:2,projectedNewRuns:1});
  assert.equal(pressured.state,'PRESSURE_HIGH');
  assert.equal(pressured.allowOptionalDispatch,false);

  const healthy=assessQueuePressure({queued:1,inProgress:2,projectedNewRuns:2});
  assert.equal(healthy.state,'HEALTHY');
  assert.equal(healthy.allowOptionalDispatch,true);
});

test('main push verification workflows are true single-flight and never key on run_id', async () => {
  const brand=await readFile('.github/workflows/canonical-brand-shell-live-readback.yml','utf8');
  assert.match(brand,/concurrency:\n\s+group: canonical-brand-shell-live-readback-/);
  assert.match(brand,/cancel-in-progress: true/);
  const release=await readFile('.github/workflows/production-release-readback.yml','utf8');
  assert.match(release,/group: production-release-readback\n\s+cancel-in-progress: true/);
  for (const path of ['.github/workflows/powerhouse-codeql.yml','.github/workflows/codeql.yml']) {
    const yml=await readFile(path,'utf8');
    const concurrency=yml.slice(yml.indexOf('concurrency:'),yml.indexOf('\njobs:'));
    assert.doesNotMatch(concurrency,/github\.run_id/);
    assert.match(concurrency,/github\.ref_name/);
    assert.match(concurrency,/cancel-in-progress: true/);
  }
});
test('recovery supervisor reaps terminal-PR and superseded-main stale queued or running work', async () => {
  const yml=await readFile('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.match(yml,/STALE_IN_PROGRESS_MIN_AGE_SECONDS:\s*'1800'/);
  assert.match(yml,/for stale_status in queued in_progress/);
  assert.match(yml,/terminal-pr/);
  assert.match(yml,/superseded-main-verification/);
  assert.match(yml,/STALE_ACTION_RUN_CANCELLED/);
  assert.match(yml,/pull_requests\[\]\?\.number/);
  assert.match(yml,/current_main_sha/);
});
