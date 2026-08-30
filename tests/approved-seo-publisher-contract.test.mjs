import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const workflowPath = '.github/workflows/approved-central-blog.yml';
const rendererV2Path = 'scripts/publish_approved_blog_v2.py';
const rendererBasePath = 'scripts/publish_approved_blog.py';

function read(path) {
  assert.ok(existsSync(path), `${path} must exist`);
  return readFileSync(path, 'utf8');
}

test('approved central publisher is isolated from generative and legacy publishing', () => {
  const workflow = read(workflowPath);
  const rendererV2 = read(rendererV2Path);
  const rendererBase = read(rendererBasePath);
  const combined = `${workflow}\n${rendererV2}\n${rendererBase}`.toLowerCase();

  for (const forbidden of [
    'anthropics/claude-code-action',
    'api.anthropic.com',
    'api.openai.com',
    'generatecontent',
    'actions/workflows/weekblog.yml/dispatches',
  ]) {
    assert.equal(combined.includes(forbidden), false, `forbidden generative/legacy marker: ${forbidden}`);
  }

  for (const required of [
    'approved central article',
    'approved blogtekst',
    'approved source hash',
    'publish command id',
    'quality gate',
    'autopublish toegestaan',
    'candidate-pr',
    'repo-schrijven',
  ]) {
    assert.equal(combined.includes(required), true, `missing approved-content contract marker: ${required}`);
  }
});

test('forced slug is unique and command identity is revalidated', () => {
  const renderer = read(rendererV2Path);
  assert.match(renderer, /page_size['"]?\s*:\s*2/i);
  assert.match(renderer, /if force and len\(rows\) != 1/);
  assert.match(renderer, /seo-publish\|/);
  assert.match(renderer, /Publish Command ID mismatch/);
  assert.match(renderer, /Source Mode/);
});

test('approved snapshot must be sealed and immutable before rendering', () => {
  const renderer = read(rendererV2Path);
  assert.match(renderer, /Approved Source Hash/);
  assert.match(renderer, /PENDING_SEAL/);
  assert.match(renderer, /Approved Source Hash mismatch/);
  assert.match(renderer, /Approved snapshot is incompleet/);
});

test('existing slug is verification-only and cannot create a second commit', () => {
  const renderer = read(rendererV2Path);
  assert.match(renderer, /target\.exists\(\)/);
  assert.match(renderer, /verificatie vereist in plaats van tweede commit/);
});
