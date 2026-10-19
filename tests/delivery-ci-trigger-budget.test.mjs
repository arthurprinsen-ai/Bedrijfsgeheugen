import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../.github/workflows/', import.meta.url);
async function workflow(name) { return readFile(new URL(name, root), 'utf8'); }

function pullRequestBlock(source) {
  const start = source.indexOf('  pull_request:');
  if (start < 0) return '';
  const tail = source.slice(start + 2);
  const nextEvent = tail.search(/^  (?:push|workflow_dispatch|schedule|workflow_call):/m);
  return nextEvent >= 0 ? tail.slice(0, nextEvent) : tail;
}

test('heavy website verification is owned by the canonical website lane, not duplicate PR entrypoints', async () => {
  for (const name of [
    'canonical-brand-shell-full-build.yml',
    'canonical-brand-shell-live-readback.yml',
    'v18-production-promotion.yml',
  ]) {
    const source = await workflow(name);
    assert.doesNotMatch(source, /^\s*pull_request\s*:/m, `${name} must not auto-fan-out on pull requests`);
  }
  const [required, lane] = await Promise.all([
    workflow('required-test.yml'),
    workflow('lane-website.yml'),
  ]);
  assert.match(required, /Run exact Netlify production build command once/);
  assert.doesNotMatch(lane, /^  netlify[-_]build[-_]parity:/m);
  assert.match(lane, /Verify all public pages are visibly rendered/);
  assert.match(lane, /Verify broad high-risk browser contracts/);
});

test('retired specialist workflows stay off direct PR admission and are preserved by Required', async () => {
  for (const name of ['canonical-brand-shell-test.yml','chat-learning-preflight-pr.yml','component-foundation-tdd.yml']) {
    assert.equal(pullRequestBlock(await workflow(name)), '', `${name} must not fan out directly on pull requests`);
  }
  const required = await workflow('required-test.yml');
  assert.match(required, /node tools\/site-shell\/test-shell-components\.mjs/);
  assert.match(required, /tests\/brain-chat-learning-fast-development-v2\.test\.mjs/);
  assert.match(required, /tests\/component-foundation-tdd|tests\/component-boundaries\.test\.mjs/);
});


test('production snapshot reconciles governance changes without forcing deployment', async () => {
  const snapshot = await workflow('production-source-snapshot.yml');
  const readback = await workflow('production-release-readback.yml');
  assert.match(snapshot, /push:\\s*\\n\\s*branches: \\[main\\]/);
  assert.doesNotMatch(snapshot.split('permissions:')[0], /^\\s*paths-ignore:/m);
  assert.match(snapshot, /deriveNetlifyDeploymentApplicability/);
  assert.match(snapshot, /steps\\.scope\\.outputs\\.deployment_required == 'true'/);
  assert.match(readback, /deriveNetlifyDeploymentApplicability/);
});

test('portal production readback only auto-runs for deployable portal runtime changes', async () => {
  const source = await workflow('portal-v2-production-dom-readback.yml');
  const triggerBlock = source.split(/\nconcurrency:/, 1)[0];
  assert.match(triggerBlock, /- 'portal-v2\/\*\*'/);
  assert.doesNotMatch(triggerBlock, /tests\/integration\/portal-v2-/);
  assert.doesNotMatch(triggerBlock, /\.github\/workflows\/portal-v2-production-dom-readback\.yml/);
  assert.match(triggerBlock, /workflow_dispatch:/);
});
