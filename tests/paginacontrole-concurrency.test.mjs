import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/paginacontrole.yml', import.meta.url), 'utf8');

test('page-control concurrency is isolated per PR/ref so main cannot cancel an unrelated PR verification', () => {
  assert.match(workflow, /group:\s*paginacontrole-\$\{\{\s*github\.event\.pull_request\.number\s*\|\|\s*github\.ref\s*\}\}/);
  assert.match(workflow, /cancel-in-progress:\s*true/);
  assert.doesNotMatch(workflow, /group:\s*paginacontrole\s*\n/);
});

test('self-healing publications preserve concurrent main work with path-appropriate synchronization', () => {
  const rebases = workflow.match(/git pull --rebase origin main/g) ?? [];
  assert.equal(rebases.length, 1, 'only the source-repair worktree should require a rebase');

  const statusStep = workflow.slice(workflow.indexOf('- name: seo-status.json publiceren als hij is veranderd'));
  const statusPublication = statusStep.slice(0, statusStep.indexOf('- name: Rapporten samenvoegen'));
  assert.match(statusPublication, /git fetch origin main/);
  assert.match(statusPublication, /git reset --hard origin\/main/);
  assert.match(statusPublication, /git push origin HEAD:main/);
  assert.doesNotMatch(statusPublication, /git pull --rebase origin main/);
});
