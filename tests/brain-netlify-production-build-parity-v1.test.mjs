import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/lane-website.yml','utf8');
const entry=fs.readFileSync('tools/ci/netlify-build-entry.mjs','utf8');
const toml=fs.readFileSync('netlify.toml','utf8');

test('website lane runs the exact Netlify production build entry before merge',()=>{
  // The lane no longer re-implements the chain: it executes the same entrypoint Netlify runs.
  assert.match(workflow,/node tools\/ci\/netlify-build-entry\.mjs/);
  assert.match(toml,/command = "node tools\/ci\/netlify-build-entry\.mjs"/);
  assert.match(workflow,/STATIC_I18N_NETWORK: '0'/);
  assert.match(workflow,/STATIC_I18N_REQUIRE_CACHE: '1'/);
});

test('the shared build entry contains the complete production build chain in order',()=>{
  const order=[
    'pricing-build-integrity.mjs\',\'capture',
    'prijzen-uit-de-homepage.mjs',
    'pricing-build-integrity.mjs\',\'restore',
    'apply-i18n.mjs',
    'build-localized-routes.mjs',
    'genereer-sitemap.mjs',
    'bouw-release-evidence.mjs',
  ].map(marker=>{
    const index=entry.indexOf(marker);
    assert.notEqual(index,-1,`build entry missing ${marker}`);
    return index;
  });
  assert.deepEqual([...order].sort((a,b)=>a-b),order,'build chain order changed');
});
