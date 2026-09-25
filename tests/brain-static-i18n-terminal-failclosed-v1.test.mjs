import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production static i18n is deterministic and fail-closed', () => {
  const netlify = fs.readFileSync('netlify.toml','utf8');
  const chrome = fs.readFileSync('tools/bouw-v18-chrome-alles.mjs','utf8');
  assert.match(netlify,/STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(netlify,/STATIC_I18N_REQUIRE_CACHE\s*=\s*"1"/);
  assert.match(chrome,/class="bgx-stempel" data-bg-no-translate translate="no"/);
});

test('pricing English canonical translations are present', () => {
  const patch = JSON.parse(fs.readFileSync('config/bg-static-i18n-en.d/2026-09-25-pricing-h1.json','utf8'));
  assert.equal(patch['Prijzen voor'],'Pricing for');
  assert.equal(patch['digitalisering'],'digitalization');
  assert.equal(patch['in het mkb'],'in SMEs');
});
