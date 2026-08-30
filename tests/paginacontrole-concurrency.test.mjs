import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/paginacontrole.yml', import.meta.url), 'utf8');

test('page-control keeps PR verification isolated while candidate writers share the repository writer lock', () => {
  assert.match(
    workflow,
    /group:\s*\$\{\{\s*github\.event_name\s*==\s*'pull_request'[\s\S]*format\('paginacontrole-\{0\}'[\s\S]*\|\|\s*'repo-schrijven'\s*\}\}/,
  );
  assert.match(workflow, /cancel-in-progress:\s*\$\{\{\s*github\.event_name\s*==\s*'pull_request'\s*\}\}/);
});

test('self-healing publication stays inside one candidate without rebasing or pushing main', () => {
  assert.doesNotMatch(workflow, /git pull --rebase origin main/);
  assert.doesNotMatch(workflow, /git push origin HEAD:main/);

  const sourceStart = workflow.indexOf('- name: Bekende SEO-bronfouten automatisch herstellen');
  const sourceEnd = workflow.indexOf('- name: Playwright installeren', sourceStart);
  assert.ok(sourceStart >= 0 && sourceEnd > sourceStart, 'source-repair step must exist');
  const sourceRepair = workflow.slice(sourceStart, sourceEnd);
  assert.match(sourceRepair, /SEO-bronfix blijft lokaal in de candidate/);

  const stepStart = workflow.indexOf('- name: seo-status.json verwerken als hij is veranderd');
  const stepEnd = workflow.indexOf('- name: Candidate branch en PR publiceren', stepStart);
  assert.ok(stepStart >= 0 && stepEnd > stepStart, 'seo-status candidate step must exist');
  const statusCandidate = workflow.slice(stepStart, stepEnd);
  assert.match(statusCandidate, /cp \/tmp\/seo-status\.json seo-status\.json/);
  assert.match(statusCandidate, /git commit -m "seo-status\.json bijgewerkt door de SEO-controle"/);
  assert.match(statusCandidate, /blijft onderdeel van dezelfde candidate PR/);
  assert.doesNotMatch(statusCandidate, /git reset --hard origin\/main|git push origin HEAD:main/);
});
