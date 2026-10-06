import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');

test('writer shadow is dispatch-only so ordinary PRs never allocate a skipped shadow run', () => {
  const shadow = read('.github/workflows/repo-writer-candidate-shadow.yml');
  assert.doesNotMatch(shadow, /^\s{2}pull_request:/m);
  assert.match(shadow, /^\s{2}workflow_dispatch:/m);
  assert.match(shadow, /startsWith\(inputs\.candidate_branch, 'writer\/'\)/);
});

test('all canonical repository writers explicitly dispatch immutable shadow verification', () => {
  const writers = [
    '.github/workflows/menu-balk-fix.yml',
    '.github/workflows/regelgeving-bijwerken.yml',
    '.github/workflows/seo-controle.yml',
    '.github/workflows/paginacontrole.yml',
    '.github/workflows/approved-central-blog.yml',
    '.github/workflows/blog-bijwerken.yml',
    '.github/workflows/weekblog.yml',
  ];
  for (const path of writers) {
    const yaml = read(path);
    assert.match(yaml, /repo-writer-candidate-shadow\.yml/, path);
    assert.match(yaml, /-f pr_number=/, path);
    assert.match(yaml, /-f base_sha=/, path);
    assert.match(yaml, /-f head_sha=/, path);
    assert.match(yaml, /-f candidate_branch=/, path);
    assert.match(yaml, /actions:\s*write/, path);
  }
});
