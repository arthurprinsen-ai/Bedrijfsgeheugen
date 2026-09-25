import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production static i18n stays fail-closed and excludes volatile version stamp', () => {
  const netlify = fs.readFileSync('netlify.toml','utf8');
  const chrome = fs.readFileSync('tools/bouw-v18-chrome-alles.mjs','utf8');
  assert.match(netlify,/STATIC_I18N_REQUIRE_CACHE = "1"/);
  assert.match(netlify,/STATIC_I18N_NETWORK = "0"/);
  assert.match(chrome,/class="bgx-stempel" data-bg-no-translate translate="no"/);
});
