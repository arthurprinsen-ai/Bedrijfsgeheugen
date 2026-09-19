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

test('LinkedIn revenue cockpit only admits relevant revenue runtime and migration changes', async () => {
  const yml = await readFile('.github/workflows/linkedin-revenue-cockpit-tests.yml','utf8');
  assert.match(yml,/supabase\/functions\/powerhouse-runtime\/\*\*/);
  assert.match(yml,/supabase\/migrations\/\*linkedin\*\.sql/);
  assert.match(yml,/supabase\/migrations\/\*revenue\*\.sql/);
  assert.doesNotMatch(yml,/supabase\/migrations\/\*\*\//);
  const concurrency = yml.slice(yml.indexOf('concurrency:'), yml.indexOf('\npermissions:'));
  assert.doesNotMatch(concurrency,/github\.event_name/);
  assert.match(concurrency,/cancel-in-progress: true/);
});

test('Revenue Learning keeps migration integrity coverage without duplicate path fan-out', async () => {
  const yml = await readFile('.github/workflows/revenue-learning.yml','utf8');
  const admission = yml.slice(0, yml.indexOf('concurrency:'));
  const count = needle => admission.split(needle).length - 1;
  assert.equal(count("supabase/migrations/**"), 2, 'one pull_request path plus one main-push path');
  assert.equal(count("supabase/migration-history.lock.json"), 2, 'one pull_request path plus one main-push path');
  assert.equal(count("tests/supabase-migration-history-integrity.test.mjs"), 2, 'one pull_request path plus one main-push path');
  const concurrency = yml.slice(yml.indexOf('concurrency:'), yml.indexOf('\npermissions:'));
  assert.doesNotMatch(concurrency,/github\.event_name/);
  assert.match(concurrency,/cancel-in-progress: true/);
  assert.match(yml,/timeout-minutes: 10/);
});
