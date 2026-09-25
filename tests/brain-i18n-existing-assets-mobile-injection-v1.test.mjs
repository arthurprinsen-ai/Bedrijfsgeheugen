import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');

test('existing i18n assets do not suppress mobile language injection', () => {
  assert.match(source,/const hasI18nCss =/);
  assert.match(source,/const hasI18nScript =/);
  assert.match(source,/if \(!hasI18nCss \|\| !hasI18nScript\) \{/);
  assert.match(source,/html = injectMobileLanguage\(html\);/);
});
