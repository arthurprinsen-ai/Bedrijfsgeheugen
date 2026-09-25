import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('canonical shell preserves central i18n runtime on public pages', () => {
  const source = fs.readFileSync('tools/site-shell/apply-shell.mjs','utf8');
  assert.match(source,/TOEGESTANE_SCRIPTS/);
  assert.match(source,/['"]\/assets\/js\/i18n\.js['"]/);
  assert.match(source,/TOEGESTANE_SCRIPTS\.some/);
});

test('production browser proof requires the preserved runtime to mount into v18 mobile drawer', () => {
  const runtime = fs.readFileSync('assets/js/i18n.js','utf8');
  const verifier = fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  assert.match(runtime,/getElementById\('v18MobileDrawer'\)/);
  assert.match(verifier,/#v18MobileDrawer/);
  assert.match(verifier,/\[data-bg-language-select\]/);
});
