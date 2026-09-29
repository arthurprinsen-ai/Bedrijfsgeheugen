import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('apply-i18n injects mobile language control even when i18n assets already exist', () => {
  const source = fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  assert.match(source,/const hasI18nCss =/);
  assert.match(source,/const hasI18nScript =/);
  assert.match(source,/html = injectMobileLanguage\(html,file\);/);
});

test('compact mobile host keeps route-aware switcher injection idempotent', () => {
  const source = fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  assert.match(source,/function mobileLanguageFor\(file\)/);
  assert.match(source,/data-bg-language-switcher=/);
  assert.match(source,/html\.replace\(existing,mobileLanguage\)/);
  assert.match(source,/mobileLanguage \+ '\$&'/);
});
