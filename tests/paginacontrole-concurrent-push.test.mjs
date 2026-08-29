import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile('.github/workflows/paginacontrole.yml', 'utf8');

// Regression fingerprints:
// - paginacontrole|git-push|non-fast-forward-concurrent-main-update
// - paginacontrole|git-rebase|dirty-generated-seo-report
// - paginacontrole|seo-status|stale-worktree-rebase

test('paginacontrole preserves concurrent main work for both automated publication paths', () => {
  const sourceStart = workflow.indexOf('- name: Bekende SEO-bronfouten automatisch herstellen');
  const sourceEnd = workflow.indexOf('- name: Playwright installeren', sourceStart);
  assert.ok(sourceStart >= 0 && sourceEnd > sourceStart, 'source-repair step must exist');
  const sourceRepair = workflow.slice(sourceStart, sourceEnd);
  assert.match(sourceRepair, /git pull --rebase origin main/);
  assert.match(sourceRepair, /git push(?: origin HEAD:main)?/);

  const stepStart = workflow.indexOf('- name: seo-status.json verwerken als hij is veranderd');
  const stepEnd = workflow.indexOf('- name: Candidate branch en PR publiceren', stepStart);
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
