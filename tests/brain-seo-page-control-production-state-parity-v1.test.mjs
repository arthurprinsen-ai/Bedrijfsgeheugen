import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('paginacontrole runs SEO against the same production build as page checks', async () => {
  const workflow=await readFile('.github/workflows/paginacontrole.yml','utf8');
  assert.match(workflow,/name: SEO en interne links controleren op productiebuild/);
  assert.match(workflow,/working-directory: \$\{\{ runner\.temp \}\}\/site/);
  assert.match(workflow,/python \.github\/scripts\/seocontrole\.py/);
  assert.match(workflow,/cp seo-rapport\.md "\$GITHUB_WORKSPACE\/seo-rapport\.md"/);
});


test('SEO checker uses current canonical component identity, not legacy literal shell oracle', async () => {
  const script=await readFile('.github/scripts/seocontrole.py','utf8');
  assert.match(script,/data-bg-component=\\"header\\"/);
  assert.match(script,/data-bg-component=\\"footer\\"/);
  assert.match(script,/v17-header/);
  assert.doesNotMatch(script,/de menubalk wijkt af van \\.github\\/canoniek\\/kop\\.html/);
});
