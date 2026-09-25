import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production static i18n can fall back to runtime translation',()=>{
  const config=fs.readFileSync('netlify.toml','utf8');
  const runtime=fs.readFileSync('assets/js/i18n.js','utf8');
  assert.match(config,/STATIC_I18N_NETWORK = "0"/);
  assert.match(config,/STATIC_I18N_REQUIRE_CACHE = "1"/);
  assert.match(runtime,/\/api\/i18n-translate/);
  assert.match(runtime,/localizedHref/);
});
