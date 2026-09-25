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
  const lane = await workflow('lane-website.yml');
  assert.match(lane, /Run exact Netlify production build command/);
  assert.match(lane, /Verify all public pages are visibly rendered/);
  assert.match(lane, /Verify broad high-risk browser contracts/);
});

test('remaining specialist PR workflows keep bounded path admission', async () => {
  for (const name of ['canonical-brand-shell-test.yml','chat-learning-preflight-pr.yml']) {
    const block = pullRequestBlock(await workflow(name));
    assert.ok(block, `${name} must retain a PR trigger`);
    assert.match(block, /\n\s+paths:\s*\n/, `${name} must filter pull_request paths`);
  }
});

test('component foundation no longer treats every config file as component work', async () => {
  const source = await workflow('component-foundation-tdd.yml');
  const block = pullRequestBlock(source);
  assert.doesNotMatch(block, /- ['"]config\/\*\*['"]/, 'config/** causes unrelated policy changes to fan out into component CI');
  assert.match(block, /config\/component-ownership\.json/);
  assert.match(block, /config\/change-classes\.json/);
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
