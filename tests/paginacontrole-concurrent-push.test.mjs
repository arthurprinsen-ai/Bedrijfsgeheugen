import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile('.github/workflows/paginacontrole.yml', 'utf8');

// Regression fingerprints:
// - paginacontrole|git-push|non-fast-forward-concurrent-main-update
// - paginacontrole|git-rebase|dirty-generated-seo-report
// - paginacontrole|seo-status|stale-worktree-rebase

test('paginacontrole preserves concurrent main work for both automated publication paths', () => {
  const rebasedPushes = [...workflow.matchAll(/^\s*git push\s*$/gm)];
  assert.equal(rebasedPushes.length, 1, 'the source-repair path remains the single worktree rebase push');

  const beforeSourcePush = workflow.slice(Math.max(0, rebasedPushes[0].index - 220), rebasedPushes[0].index);
  assert.match(
    beforeSourcePush,
    /git pull --rebase origin main\s*$/m,
    'source repair must rebase onto current main before its normal push',
  );

  const stepStart = workflow.indexOf('- name: seo-status.json publiceren als hij is veranderd');
  const stepEnd = workflow.indexOf('- name: Rapporten samenvoegen', stepStart);
  assert.ok(stepStart >= 0 && stepEnd > stepStart, 'seo-status publication step must exist');

  const statusPublication = workflow.slice(stepStart, stepEnd);
  assert.match(statusPublication, /git fetch origin main/);
  assert.match(statusPublication, /git reset --hard origin\/main/);
  assert.match(statusPublication, /cp \/tmp\/seo-status\.json seo-status\.json/);
  assert.match(statusPublication, /git diff --quiet -- seo-status\.json/);
  assert.match(statusPublication, /git push origin HEAD:main/);
  assert.doesNotMatch(
    statusPublication,
    /git pull --rebase origin main/,
    'derived status publication must not rebase the stale full workflow worktree',
  );
});
