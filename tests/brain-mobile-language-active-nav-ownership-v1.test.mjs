import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('mobile language control follows the active shared navigation', () => {
  const menu = fs.readFileSync('assets/js/menu.js','utf8');
  const i18n = fs.readFileSync('assets/js/i18n.js','utf8');
  const apply = fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');

  assert.match(menu, /existingLanguage = bron\.querySelector\('\[data-bg-language-switcher="mobile"\]'\)/);
  assert.match(menu, /rootView\.insertBefore\(existingLanguage, rootCta \|\| null\)/);
  assert.match(menu, /bg:shared-mobile-nav-ready/);
  assert.match(i18n, /addEventListener\('bg:shared-mobile-nav-ready', mountControl\)/);
  assert.match(apply, /if \(!\/data-bg-i18n-asset\/\.test\(html\)\)/);
  assert.match(apply, /html = injectMobileLanguage\(html\)/);
});
