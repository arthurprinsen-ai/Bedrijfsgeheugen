import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('recovery supervisor never scans the repository on feature-branch push', async () => {
  const yml = await readFile('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.match(yml,/push:\n\s+branches: \[main\]/);
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


test('queue-only recovery never mutates the candidate branch', async () => {
  const yml = await readFile('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  const stale = yml.slice(yml.indexOf('STALE_QUEUE_RECOVERY)'), yml.indexOf('LONG_RUNNING_OBSERVE)'));
  assert.match(stale,/actions\/runs\/\$run_id\/cancel/);
  assert.match(stale,/dispatch_required/);
  assert.match(stale,/dispatch_brain/);
  assert.doesNotMatch(stale,/repos\/\$repo\/merges/);
  assert.doesNotMatch(stale,/git push|update-ref|contents\/|branches\/\$branch/);
  const longRunning = yml.slice(yml.indexOf('LONG_RUNNING_OBSERVE)'), yml.indexOf('MERGE_CONFLICT_RECOVERY)'));
  assert.match(longRunning,/do not cancel without concrete stalled-job evidence/);
  assert.doesNotMatch(longRunning,/repos\/\$repo\/merges|git push|update-ref/);
});

test('same-lineage branch mutation is reserved for proven merge conflicts with terminal writer lease', async () => {
  const yml = await readFile('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  const conflict = yml.slice(yml.indexOf('MERGE_CONFLICT_RECOVERY)'), yml.indexOf('done\n\n      - name: Recover merged obligations'));
  assert.match(conflict,/Writer-Lease-State: TERMINAL_DELIVERY/);
  assert.match(conflict,/Writer-Lease-Owner: powerhouse-terminal-delivery/);
  assert.match(conflict,/repos\/\$repo\/merges/);
});
