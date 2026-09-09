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

test('preserved product contracts are source-scoped, not workflow-migration-scoped', async () => {
  const preserved = await text('tools/ci/single-flight-preserved-contracts.mjs');
  const migratedStandaloneWorkflows = [
    '.github/workflows/bg184-stateful-blocker-dedupe-tests.yml',
    '.github/workflows/brain-foundation-verify.yml',
    '.github/workflows/business-os-experience.yml',
    '.github/workflows/business-os-foundation.yml',
    '.github/workflows/business-os-intelligence.yml',
    '.github/workflows/business-os-migration.yml',
    '.github/workflows/business-os-trust.yml',
    '.github/workflows/config-wacht.yml',
    '.github/workflows/fresh-device-autonomy-canary.yml',
    '.github/workflows/hero-media-production-verify.yml',
    '.github/workflows/homepage-hero-video-verify.yml',
    '.github/workflows/main-write-integrity-regression.yml',
    '.github/workflows/portal-native-regression-tests.yml',
    '.github/workflows/portal-v2-tests.yml',
    '.github/workflows/prijzen-hero-seo-regression.yml',
    '.github/workflows/seo-growth-intelligence.yml',
    '.github/workflows/seo-order-engine.yml',
    '.github/workflows/universal-closed-loop-learning.yml',
    '.github/workflows/universal-event-retention-contract.yml',
    '.github/workflows/verify-approved-central-blog.yml',
    '.github/workflows/blog-technical-seo-gate.yml'
  ];

  for (const workflow of migratedStandaloneWorkflows) {
    assert.equal(preserved.includes(`'${workflow}'`), false, `${workflow} must not trigger a preserved product suite by itself`);
  }

  assert.match(preserved, /touched\('platform\/','portal-next\/'\)/);
  assert.match(preserved, /touched\('config\/brain-delivery-system\.json'/);
});
