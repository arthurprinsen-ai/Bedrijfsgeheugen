import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('pricing production i18n proof waits for the visible shared mobile language control', () => {
  const source = fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  assert.match(source,/viewport:\{ width:390, height:844 \}/);
  assert.match(source,/page\.locator\('#bgkopKnop'\)/);
  assert.match(source,/#bgSharedMobileNav/);
  assert.match(source,/\[data-bg-language-select\]/);
  assert.match(source,/waitFor\(\{ state:'visible', timeout:5_000 \}\)/);
  assert.match(source,/selector\.selectOption\(locale\)/);
  assert.match(source,/switchPublicLocale\(page, 'en', '\/en\/prijzen'\)/);
  assert.match(source,/switchPublicLocale\(page, 'nl', '\/prijzen'\)/);
  assert.match(source,/visible mobile language select is missing after opening mobile navigation/);
  assert.doesNotMatch(source,/button\[data-bg-language-current\]'\)\.first\(\);\n\s*await current\.click/);
});
