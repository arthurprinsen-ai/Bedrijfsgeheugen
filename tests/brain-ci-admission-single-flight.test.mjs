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

test('Required is the only PR admission orchestrator and keeps PR-scoped single-flight identity', async () => {
  const required = await readFile('.github/workflows/required-test.yml','utf8');
  const concurrency = required.slice(required.indexOf('concurrency:'), required.indexOf('\njobs:'));
  assert.match(required,/^  pull_request:/m);
  assert.match(required,/^  merge_group:/m);
  assert.match(concurrency,/inputs\.pr_number \|\| github\.event\.pull_request\.number/);
  assert.doesNotMatch(concurrency,/github\.event_name/);
  assert.match(concurrency,/cancel-in-progress: true/);

  const brain = await readFile('.github/workflows/unified-brain-delivery.yml','utf8');
  assert.doesNotMatch(brain,/^  pull_request:/m);
});

test('PR admission ratchet is exactly Required plus Powerhouse CodeQL', async () => {
  const baseline = JSON.parse(await readFile('config/pr-trigger-baseline.json','utf8'));
  assert.deepEqual([...baseline.admissionPullRequestWorkflows].sort(), ['codeql.yml','required-test.yml']);
  assert.equal(baseline.admissionPullRequestWorkflowCount, 2);
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


test('consolidated CodeQL owns PR security and path-scoped main pushes', async () => {
  const yml = await readFile('.github/workflows/codeql.yml','utf8');
  assert.match(yml,/pull_request:\n\s+branches:\s*\[main\]/);
  const push = yml.slice(yml.indexOf('  push:'), yml.indexOf('  schedule:'));
  assert.match(push,/branches:\s*\[main\]/);
  assert.match(push,/paths:/);
  assert.match(push,/\*\*\/\*\.py/);
  assert.match(push,/\*\*\/\*\.mjs/);
  assert.match(push,/\.github\/workflows\/codeql\.yml/);
});
