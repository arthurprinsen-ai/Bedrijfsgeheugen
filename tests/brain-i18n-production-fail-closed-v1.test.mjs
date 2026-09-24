import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
const netlify=fs.readFileSync('netlify.toml','utf8');

test('production localized build fails closed when translation provider fails',()=>{
  assert.match(netlify,/STATIC_I18N_NETWORK\s*=\s*"1"/);
  assert.match(source,/STATIC_I18N_PRODUCTION_TRANSLATION_FAILED/);
  assert.match(source,/STATIC_I18N_PRODUCTION_TRANSLATION_REQUIRED/);
  assert.match(source,/if \(networkAllowed\) \{\s*throw new Error/);
});

test('deploy previews may remain offline without pretending to be translated',()=>{
  assert.match(netlify,/\[context\.deploy-preview\.environment\][\s\S]*STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(source,/data-bg-static-translated/);
});
