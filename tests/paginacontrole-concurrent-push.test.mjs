import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile('.github/workflows/paginacontrole.yml', 'utf8');

// Supersedes legacy direct-main race fingerprints with one candidate identity.
test('paginacontrole preserves concurrent main work by never mutating main from its worktree', () => {
  assert.doesNotMatch(workflow, /git pull --rebase origin main/);
  assert.doesNotMatch(workflow, /git push origin HEAD:main/);

  const sourceStart = workflow.indexOf('- name: Bekende SEO-bronfouten automatisch herstellen');
  const sourceEnd = workflow.indexOf('- name: Playwright installeren', sourceStart);
  assert.ok(sourceStart >= 0 && sourceEnd > sourceStart, 'source-repair step must exist');
  const sourceRepair = workflow.slice(sourceStart, sourceEnd);
  assert.match(sourceRepair, /git commit -m "Herstel SEO-bronfouten uit paginacontrole"/);
  assert.match(sourceRepair, /blijft lokaal in de candidate/);

  const stepStart = workflow.indexOf('- name: seo-status.json verwerken als hij is veranderd');
  const stepEnd = workflow.indexOf('- name: Candidate branch en PR publiceren', stepStart);
  assert.ok(stepStart >= 0 && stepEnd > stepStart, 'seo-status candidate step must exist');
  const statusCandidate = workflow.slice(stepStart, stepEnd);
  assert.match(statusCandidate, /cp \/tmp\/seo-status\.json seo-status\.json/);
  assert.match(statusCandidate, /git diff --quiet -- seo-status\.json/);
  assert.doesNotMatch(statusCandidate, /git fetch origin main|git reset --hard origin\/main|git push origin HEAD:main/);

  const candidate = workflow.slice(stepEnd);
  assert.match(candidate, /createWriterCandidate/);
  assert.match(candidate, /gh pr create/);
});
