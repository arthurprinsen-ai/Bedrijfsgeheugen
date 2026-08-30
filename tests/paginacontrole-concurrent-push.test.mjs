import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile('.github/workflows/paginacontrole.yml', 'utf8');

test('paginacontrole preserves concurrent main work by producing one governed candidate', () => {
  assert.doesNotMatch(workflow, /git pull --rebase origin main/);
  assert.doesNotMatch(workflow, /git push origin HEAD:main/);
  assert.doesNotMatch(workflow, /git reset --hard origin\/main/);

  const sourceStart = workflow.indexOf('- name: Bekende SEO-bronfouten automatisch herstellen');
  const sourceEnd = workflow.indexOf('- name: Playwright installeren', sourceStart);
  assert.ok(sourceStart >= 0 && sourceEnd > sourceStart, 'source-repair step must exist');
  assert.match(workflow.slice(sourceStart, sourceEnd), /BRAIN v2 candidate/);

  const statusStart = workflow.indexOf('- name: seo-status.json verwerken als hij is veranderd');
  const handoffStart = workflow.indexOf('- name: Candidate branch en PR publiceren', statusStart);
  assert.ok(statusStart >= 0 && handoffStart > statusStart, 'seo-status candidate step must exist');
  const statusCandidate = workflow.slice(statusStart, handoffStart);
  assert.match(statusCandidate, /cp \/tmp\/seo-status\.json seo-status\.json/);
  assert.match(statusCandidate, /git diff --quiet -- seo-status\.json/);
  assert.doesNotMatch(statusCandidate, /git push/);

  const handoff = workflow.slice(handoffStart);
  assert.match(handoff, /createWriterCandidate/);
  assert.match(handoff, /git push origin "HEAD:\$CANDIDATE_BRANCH"/);
  assert.match(handoff, /gh pr create/);
  assert.doesNotMatch(handoff, /gh\s+pr\s+merge/);
});
