import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('apply-i18n injects runtime script independently from existing CSS', () => {
  const source = fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  assert.match(source,/const hasI18nCss =/);
  assert.match(source,/const hasI18nScript =/);
  assert.match(source,/!hasI18nCss \? LINK/);
  assert.match(source,/!hasI18nScript \? SCRIPT/);
  assert.doesNotMatch(source,/\|\| \/data-bg-i18n-asset\/\.test\(html\)\) return/);
  assert.match(source,/html = injectMobileLanguage\(html\)/);
});

test('canonical pricing source contains both i18n assets after build contract repair', () => {
  const html = fs.readFileSync('prijzen.html','utf8');
  assert.match(html,/assets\/i18n\.css/);
  assert.match(html,/assets\/js\/i18n\.js/);
});
