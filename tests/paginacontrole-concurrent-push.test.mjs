import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile('.github/workflows/paginacontrole.yml', 'utf8');

// Regression fingerprints:
// - paginacontrole|git-push|non-fast-forward-concurrent-main-update
// - paginacontrole|git-rebase|dirty-generated-seo-report

test('paginacontrole rebases main before every automated git push', () => {
  const pushes = [...workflow.matchAll(/^\s*git push\s*$/gm)];
  assert.equal(pushes.length, 2, 'expected exactly two automated git push paths');

  for (const push of pushes) {
    const beforePush = workflow.slice(Math.max(0, push.index - 220), push.index);
    assert.match(
      beforePush,
      /git pull --rebase origin main\s*$/m,
      'every automated push must first rebase onto current main to avoid non-fast-forward failures',
    );
  }
});

test('seo-status writeback cleans generated tracked report before rebasing', () => {
  const stepStart = workflow.indexOf('- name: seo-status.json terugzetten als hij is veranderd');
  const stepEnd = workflow.indexOf('- name: Rapporten samenvoegen', stepStart);
  assert.ok(stepStart >= 0 && stepEnd > stepStart, 'seo-status writeback step must exist');

  const step = workflow.slice(stepStart, stepEnd);
  assert.match(
    step,
    /git restore --worktree seo-rapport\.md\s*[\r\n]+\s*git pull --rebase origin main/,
    'generated tracked seo-rapport.md must be restored before git pull --rebase so the worktree is clean',
  );
});
