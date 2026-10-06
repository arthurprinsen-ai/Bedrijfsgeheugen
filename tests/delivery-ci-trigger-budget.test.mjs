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


test('governance-only prevention registry does not trigger production deploy/readback workflows', async () => {
  for (const workflow of [
    '.github/workflows/production-source-snapshot.yml',
    '.github/workflows/production-release-readback.yml',
  ]) {
    const text = await readFile(workflow, 'utf8');
    const triggerBlock = text.split(/\npermissions:/, 1)[0];
    assert.match(triggerBlock, /paths-ignore:/);
    assert.match(triggerBlock, /config\/delivery-prevention-rules\.json/);
  }
});


test('production workflows ignore control-plane-only paths', async () => {
  for (const workflow of [
    '.github/workflows/production-source-snapshot.yml',
    '.github/workflows/production-release-readback.yml',
  ]) {
    const source = await readFile(workflow, 'utf8');
    const triggerBlock = source.split(/\npermissions:/, 1)[0];
    for (const expected of [
      "AGENTS.md",
      "brain/policies/**",
      "tools/delivery/**",
      "tools/site-shell/verify-targeted-website-routes.mjs",
    ]) {
      assert.ok(triggerBlock.includes(expected), `${workflow} must ignore ${expected}`);
    }
  }
});
