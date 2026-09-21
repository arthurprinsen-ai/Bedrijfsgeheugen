import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('global NL/EN runtime and build injector are wired',()=>{
  const netlify=fs.readFileSync('netlify.toml','utf8');
  const runtime=fs.readFileSync('assets/js/i18n.js','utf8');
  const injector=fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  const fn=fs.readFileSync('netlify/functions/i18n-translate.mjs','utf8');
  assert.match(netlify,/apply-i18n\.mjs/);
  assert.match(runtime,/bg_locale/);
  assert.match(runtime,/MutationObserver/);
  assert.match(runtime,/bg_i18n_cache_v1/);
  assert.match(runtime,/batches/);
  assert.match(runtime,/meta\[name="description"\]/);
  assert.match(runtime,/\/api\/i18n-translate/);
  assert.match(runtime,/data-bg-language-switcher/);
  assert.match(runtime,/data-bg-mobile-view/);
  assert.match(runtime,/data-bg-shared-mobile-view/);
  assert.doesNotMatch(fs.readFileSync('assets/i18n.css','utf8'),/position:\s*fixed/);
  assert.match(runtime,/batch\.length >= 30/);
  assert.match(runtime,/mountControl\(\)/);
  assert.match(fs.readFileSync('netlify\/functions\/_brain-ai.mjs','utf8'),/maxTokens:4000/);
  assert.match(injector,/\.html/);
  assert.match(fn,/runTranslation/);
});