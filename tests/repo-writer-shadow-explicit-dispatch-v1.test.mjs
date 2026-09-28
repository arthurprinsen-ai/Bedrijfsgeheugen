import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const writers = [
  '.github/workflows/approved-central-blog.yml',
  '.github/workflows/blog-bijwerken.yml',
  '.github/workflows/daily-blog-publisher.yml',
  '.github/workflows/menu-balk-fix.yml',
  '.github/workflows/paginacontrole.yml',
  '.github/workflows/regelgeving-bijwerken.yml',
  '.github/workflows/regulatory-source-watch.yml',
  '.github/workflows/seo-controle.yml',
  '.github/workflows/weekblog.yml'
];

test('Candidate Shadow is explicit-dispatch only', async () => {
  const workflow = await readFile('.github/workflows/repo-writer-candidate-shadow.yml','utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\n\s*pull_request:/);
});

test('every canonical repository writer explicitly dispatches Candidate Shadow', async () => {
  for (const path of writers) {
    const workflow = await readFile(path,'utf8');
    const explicit = /repo-writer-candidate-shadow\.yml/.test(workflow) || /dispatch-writer-shadow\.mjs/.test(workflow);
    assert.equal(explicit,true,path);
  }
});

test('explicit shadow helper resolves immutable PR identity before dispatch', async () => {
  const source = await readFile('scripts/ci/dispatch-writer-shadow.mjs','utf8');
  assert.match(source, /\.base\.sha/);
  assert.match(source, /\.head\.sha/);
  assert.match(source, /\.head\.ref/);
  assert.match(source, /WRITER_PR_HEAD_REF_DRIFT/);
  assert.match(source, /repo-writer-candidate-shadow\.yml/);
  assert.match(source, /pr_number=/);
  assert.match(source, /base_sha=/);
  assert.match(source, /head_sha=/);
  assert.match(source, /candidate_branch=/);
});

test('writer shadow helper accepts only writer candidate branches', async () => {
  const source = await readFile('scripts/ci/dispatch-writer-shadow.mjs','utf8');
  assert.match(source, /INVALID_WRITER_BRANCH/);
  assert.match(source, /\^writer\\\//);
});
