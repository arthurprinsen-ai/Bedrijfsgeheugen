import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/paginacontrole.yml', import.meta.url), 'utf8');

test('page-control keeps PR verification isolated while main-writing runs share the repository writer lock', () => {
  assert.match(
    workflow,
    /group:\s*\$\{\{\s*github\.event_name\s*==\s*'pull_request'[\s\S]*format\('paginacontrole-\{0\}'[\s\S]*\|\|\s*'repo-schrijven'\s*\}\}/,
  );
  assert.match(workflow, /cancel-in-progress:\s*\$\{\{\s*github\.event_name\s*==\s*'pull_request'\s*\}\}/);
});

test('self-healing publications preserve concurrent main work with path-appropriate synchronization', () => {
  const rebases = workflow.match(/git pull --rebase origin main/g) ?? [];
  assert.equal(rebases.length, 1, 'only the source-repair worktree should require a rebase');

  const stepStart = workflow.indexOf('- name: seo-status.json publiceren als hij is veranderd');
  const stepEnd = workflow.indexOf('- name: Rapporten samenvoegen', stepStart);
  assert.ok(stepStart >= 0 && stepEnd > stepStart, 'seo-status publication step must exist');

  const statusPublication = workflow.slice(stepStart, stepEnd);
  assert.match(statusPublication, /git fetch origin main/);
  assert.match(statusPublication, /git reset --hard origin\/main/);
  assert.match(statusPublication, /git push origin HEAD:main/);
  assert.doesNotMatch(statusPublication, /git pull --rebase origin main/);
});
