import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/paginacontrole.yml', import.meta.url), 'utf8');

test('page-control concurrency is isolated per PR/ref so main cannot cancel an unrelated PR verification', () => {
  assert.match(workflow, /group:\s*paginacontrole-\$\{\{\s*github\.event\.pull_request\.number\s*\|\|\s*github\.ref\s*\}\}/);
  assert.match(workflow, /cancel-in-progress:\s*true/);
  assert.doesNotMatch(workflow, /group:\s*paginacontrole\s*\n/);
});

test('self-healing pushes preserve concurrent main work by rebasing before push', () => {
  const rebases = workflow.match(/git pull --rebase origin main/g) ?? [];
  assert.equal(rebases.length, 2);
});

test('daily SEO checks do not push when only the volatile bijgewerkt date changed', () => {
  assert.match(workflow, /git diff --ignore-matching-lines=.*bijgewerkt.*--quiet -- seo-status\.json/);
  assert.match(workflow, /git restore seo-status\.json/);
});
