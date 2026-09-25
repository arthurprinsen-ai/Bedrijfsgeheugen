import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const critical = [
  '.github/workflows/required-test.yml',
  '.github/workflows/production-source-snapshot.yml',
  '.github/workflows/production-release-readback.yml',
  '.github/workflows/lane-backend.yml',
  '.github/workflows/lane-portal.yml',
  '.github/workflows/lane-automation.yml',
  '.github/workflows/lane-website.yml',
];

test('Notion is never a synchronous merge, deploy, or production-readback dependency', async () => {
  for (const path of critical) {
    const text = await readFile(path,'utf8');
    assert.doesNotMatch(text,/notion/i, `${path} must stay independent from Notion availability`);
  }
});

test('Netlify production build does not call Notion', async () => {
  const netlify = await readFile('netlify.toml','utf8');
  const build = netlify.match(/\[build\]\s*([\s\S]*?)(?=\n\[|$)/)?.[1] || '';
  assert.doesNotMatch(build,/notion/i);
});

test('Notion remains an explicit projection endpoint instead of delivery authority', async () => {
  const fn = await readFile('netlify/functions/company-decision-notion-sync.mjs','utf8');
  assert.match(fn,/path:\s*'\/api\/company-decision-notion-sync'/);
  assert.match(fn,/syncCompanyDecisionsToNotion/);
  assert.doesNotMatch(fn,/production-release|merge_group|required-test/i);
});
