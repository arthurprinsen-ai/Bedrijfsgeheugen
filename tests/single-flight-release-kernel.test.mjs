import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(new URL('..', import.meta.url).pathname);

async function text(relativePath) {
  return readFile(path.join(repoRoot, relativePath), 'utf8');
}

function hasPullRequestTrigger(workflowText) {
  if (/^on:\s*\[[^\]]*\bpull_request\b[^\]]*\]\s*$/m.test(workflowText)) return true;
  if (/^on:\s*pull_request\s*$/m.test(workflowText)) return true;
  const block = workflowText.match(/^on:\s*\n((?:^[ \t]+.*(?:\n|$))*)/m)?.[1] ?? '';
  return /^\s+pull_request\s*:/m.test(block);
}

function hasJobs(workflowText) {
  return /^jobs:\s*$/m.test(workflowText);
}

test('single-flight release policy is explicit and exact', async () => {
  const config = JSON.parse(await text('config/single-flight-release-kernel.json'));
  assert.equal(config.version, 'single-flight-v1');
  assert.equal(config.protectedContext, 'test');
  assert.equal(config.maxPullRequestRunnerWorkflows, 1);
  assert.equal(config.requiredWorkflow, '.github/workflows/required-test.yml');
  assert.equal(config.staleHeadPolicy, 'cancel-in-progress');
  assert.equal(config.promotionIdentity, 'exact-tested-head');
});

test('Required test is one stale-head-cancelling branch-protected flight', async () => {
  const requiredWorkflow = await text('.github/workflows/required-test.yml');
  assert.match(requiredWorkflow, /concurrency:/);
  assert.match(requiredWorkflow, /required-test-pr-/);
  assert.match(requiredWorkflow, /cancel-in-progress:\s*true/);
  assert.match(requiredWorkflow, /jobs:\s*\n\s*test:/);
  assert.doesNotMatch(requiredWorkflow, /\n\s+(preflight|backend|portal|automation|website):\s*\n/);
  const topLevelJobs = [...requiredWorkflow.matchAll(/^  ([A-Za-z0-9_-]+):\s*$/gm)].map(match => match[1]);
  const jobsMarker = requiredWorkflow.indexOf('\njobs:\n');
  const jobNames = jobsMarker >= 0
    ? [...requiredWorkflow.slice(jobsMarker).matchAll(/^  ([A-Za-z0-9_-]+):\s*$/gm)].map(match => match[1])
    : [];
  assert.deepEqual(jobNames.filter(name => !['name', 'runs-on', 'timeout-minutes', 'permissions', 'steps'].includes(name)), ['test']);
  assert.ok(topLevelJobs.includes('test'));
});

test('only Required test consumes runners automatically for pull requests', async () => {
  const workflowsDir = path.join(repoRoot, '.github/workflows');
  const names = (await readdir(workflowsDir)).filter(name => /\.ya?ml$/i.test(name));
  const offenders = [];
  for (const name of names) {
    const workflowText = await readFile(path.join(workflowsDir, name), 'utf8');
    if (hasPullRequestTrigger(workflowText) && hasJobs(workflowText)) offenders.push(`.github/workflows/${name}`);
  }
  offenders.sort();
  assert.deepEqual(offenders, ['.github/workflows/required-test.yml']);
});
