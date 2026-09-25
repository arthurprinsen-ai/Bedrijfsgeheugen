import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('apply-i18n independently ensures CSS, runtime JS and mobile control', () => {
  const source = fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  assert.match(source,/const hasI18nCss =/);
  assert.match(source,/const hasI18nScript =/);
  assert.match(source,/!hasI18nCss \? LINK/);
  assert.match(source,/!hasI18nScript \? SCRIPT/);
  assert.match(source,/html = injectMobileLanguage\(html\);/);
  assert.doesNotMatch(source,/if \(!\/<html\\b\/i\.test\(html\) \|\| \/data-bg-i18n-asset\/\.test\(html\)\) return;/);
});
