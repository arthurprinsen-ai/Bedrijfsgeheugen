import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile('.github/workflows/paginacontrole.yml', 'utf8');

test('paginacontrole preserves concurrent main work for both automated publication paths', () => {
  const rebasedPushes = [...workflow.matchAll(/^\s*git push\s*$/gm)];
  assert.equal(rebasedPushes.length, 1, 'the source-repair path remains the single worktree rebase push');

  const beforeSourcePush = workflow.slice(Math.max(0, rebasedPushes[0].index - 180), rebasedPushes[0].index);
  assert.match(
    beforeSourcePush,
    /git pull --rebase origin main\s*$/m,
    'source repair must rebase onto current main before its normal push',
  );

  const statusStep = workflow.slice(workflow.indexOf('- name: seo-status.json publiceren als hij is veranderd'));
  assert.match(statusStep, /git fetch origin main/);
  assert.match(statusStep, /git reset --hard origin\/main/);
  assert.match(statusStep, /cp \/tmp\/seo-status\.json seo-status\.json/);
  assert.match(statusStep, /git diff --quiet -- seo-status\.json/);
  assert.match(statusStep, /git push origin HEAD:main/);
  assert.doesNotMatch(
    statusStep.slice(0, statusStep.indexOf('- name: Rapporten samenvoegen')),
    /git pull --rebase origin main/,
    'derived status publication must not rebase the stale full workflow worktree',
  );
});
