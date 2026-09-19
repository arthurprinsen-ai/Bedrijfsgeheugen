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

