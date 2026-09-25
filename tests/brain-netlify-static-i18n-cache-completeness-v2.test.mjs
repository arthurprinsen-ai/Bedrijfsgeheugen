import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production static English cache recovery remains exact-source and fail-closed', () => {
  const learning=JSON.parse(fs.readFileSync('brain/learning/netlify-static-i18n-cache-completeness-20260925-v2.json','utf8'));
  const netlify=fs.readFileSync('netlify.toml','utf8');
  const cache=JSON.parse(fs.readFileSync('config/bg-static-i18n-en.json','utf8'));
  const chrome=fs.readFileSync('tools/bouw-v18-chrome-alles.mjs','utf8');

  assert.equal(learning.failure_class,'STATIC_I18N_CACHE_SOURCE_DRIFT');
  assert.match(netlify,/STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.ok(Object.keys(cache).length > 1900,'immutable English cache must contain the recovered corpus');
  assert.match(JSON.stringify(learning.prevention),/commit_ref == protected main SHA/);
  assert.match(JSON.stringify(learning.prevention),/not a production deploy dependency/i);
  assert.match(chrome,/bgx-stempel[^>]*data-bg-no-translate[^>]*translate="no"/,'volatile build stamp must never enter static translation corpus');
});
