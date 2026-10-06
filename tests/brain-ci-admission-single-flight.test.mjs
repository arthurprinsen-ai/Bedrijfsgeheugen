import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assessQueuePressure } from '../tools/delivery/predictive-controller.mjs';

test('recovery supervisor is scheduled/manual only and applies repository backpressure', async () => {
  const yml = await readFile('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.doesNotMatch(yml,/\n\s*push:\s*\n\s*branches:\s*\[main\]/);
  assert.match(yml,/workflow_dispatch:/);
  assert.match(yml,/cron:\s*'\*\/5 \* \* \* \*'/);
  assert.match(yml,/ACTIVE_RUN_CIRCUIT_BREAKER:\s*'12'/);
  assert.match(yml,/RECOVERY_PR_BUDGET:\s*'1'/);
  assert.match(yml,/ACTIONS_QUEUE_CIRCUIT_OPEN/);
  assert.match(yml,/concurrency:\n\s+group: powerhouse-delivery-recovery-supervisor\n\s+cancel-in-progress: true/);
});

test('Required fast ingress has no workflow lock while recovery remains single-flight', async () => {
  const required = await readFile('.github/workflows/required-test.yml','utf8');
  const recovery = await readFile('.github/workflows/unified-brain-delivery.yml','utf8');
  assert.doesNotMatch(required,/^concurrency:/m);
  const concurrency = recovery.slice(recovery.indexOf('concurrency:'), recovery.indexOf('\njobs:'));
  assert.match(concurrency,/cancel-in-progress: true/);
});

test('skill projection no longer consumes a runner on every PR HEAD', async () => {
  const yml = await readFile('.github/workflows/powerhouse-skill-projection.yml','utf8');
  assert.doesNotMatch(yml,/^  pull_request:/m);
});

test('Required executes this CI admission regression', async () => {
  const yml = await readFile('.github/workflows/required-test.yml','utf8');
  assert.match(yml,/tests\/brain-ci-admission-single-flight\.test\.mjs/);
});

test('queue pressure forecast blocks fan-out before mutation', () => {
  const projected=assessQueuePressure({queued:11,inProgress:7,projectedNewRuns:3});
  assert.equal(projected.state,'CIRCUIT_OPEN');
  assert.equal(projected.allowOptionalDispatch,false);
  assert.equal(projected.shouldBatchWrites,true);

  const open=assessQueuePressure({queued:20,inProgress:1});
  assert.equal(open.state,'CIRCUIT_OPEN');
  assert.match(open.action,/NO_NEW_RECOVERY_OR_OPTIONAL_WORK/);

  const tooWide=assessQueuePressure({queued:2,inProgress:2,projectedNewRuns:7});
  assert.equal(tooWide.state,'PROJECTED_OVERLOAD');

  const pressured=assessQueuePressure({queued:10,inProgress:2,projectedNewRuns:1});
  assert.equal(pressured.state,'CIRCUIT_OPEN');
  assert.equal(pressured.allowOptionalDispatch,false);

  const healthy=assessQueuePressure({queued:1,inProgress:2,projectedNewRuns:2});
  assert.equal(healthy.state,'HEALTHY');
  assert.equal(healthy.allowOptionalDispatch,true);
});


test('generic CodeQL main pushes are path-scoped to Python', async () => {
  const yml = await readFile('.github/workflows/codeql.yml','utf8');
  const push = yml.slice(yml.indexOf('  push:'), yml.indexOf('  schedule:'));
  assert.match(push,/branches:\s*\[main\]/);
  assert.match(push,/paths:/);
  assert.match(push,/\*\*\/\*\.py/);
  assert.match(push,/\.github\/workflows\/codeql\.yml/);
});
