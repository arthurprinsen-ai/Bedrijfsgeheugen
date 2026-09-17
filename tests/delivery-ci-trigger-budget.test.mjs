import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../.github/workflows/', import.meta.url);
const files = [
  'canonical-brand-shell-full-build.yml',
  'canonical-brand-shell-live-readback.yml',
  'canonical-brand-shell-test.yml',
  'v18-production-promotion.yml',
  'chat-learning-preflight-pr.yml',
  'component-foundation-tdd.yml',
];

async function workflow(name) {
  return readFile(new URL(name, root), 'utf8');
}

function pullRequestBlock(source) {
  const start = source.indexOf('  pull_request:');
  assert.ok(start >= 0, 'workflow must have pull_request trigger');
  const tail = source.slice(start + 2);
  const nextEvent = tail.search(/^  (?:push|workflow_dispatch|schedule|workflow_call):/m);
  return nextEvent >= 0 ? tail.slice(0, nextEvent) : tail;
}

test('domain workflows use pull-request path budgets instead of repo-wide fan-out', async () => {
  for (const name of files.slice(0, 5)) {
    const block = pullRequestBlock(await workflow(name));
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
