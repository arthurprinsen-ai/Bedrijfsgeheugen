import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('pricing production i18n proof waits for the visible shared mobile language control', () => {
  const source = fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  assert.match(source,/viewport:\{ width:390, height:844 \}/);
  assert.match(source,/page\.locator\('#bgkopKnop'\)/);
  assert.match(source,/\[data-bg-language-select\]:visible/);
  assert.match(source,/getVisibleMobileLanguage\(page\)/);
  assert.match(source,/waitFor\(\{ state:'visible', timeout:5_000 \}\)/);
  assert.doesNotMatch(source,/await sharedLanguage\.count\(\) \? sharedLanguage : legacyLanguage/);
  assert.match(source,/selectOption\('en'\)/);
  assert.match(source,/selectOption\('nl'\)/);
  assert.match(source,/visible mobile language select is missing after opening mobile navigation/);
  assert.doesNotMatch(source,/button\[data-bg-language-current\]'\)\.first\(\);\n\s*await current\.click/);
});
