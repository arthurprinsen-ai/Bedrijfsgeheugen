import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('apply-i18n injects mobile language control independently from i18n assets', () => {
  const source = fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  assert.doesNotMatch(source,/data-bg-i18n-asset\/\.test\(html\)\) return/);
  assert.match(source,/const hasI18nCss =/);
  assert.match(source,/const hasI18nScript =/);
  assert.match(source,/html = injectMobileLanguage\(html\);/);
});

test('compact mobile host keeps selector injection idempotent', () => {
  const source = fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  assert.match(source,/if \(\/data-bg-language-switcher="mobile"\/\.test\(html\)\) return html/);
  assert.match(source,/html\.replace\(cta, MOBILE_LANGUAGE \+ '\$&'\)/);
});
