import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production pricing i18n verifier follows canonical route-driven mobile language controls', () => {
  const source = fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  assert.match(source,/getVisibleMobileLanguageControl\(page, locale\)/);
  assert.match(source,/data-bg-language-option/);
  assert.match(source,/kind:'link'/);
  assert.match(source,/control\.locator\.click\(\)/);
  assert.match(source,/kind:'select'/);
  assert.match(source,/control\.locator\.selectOption\(locale\)/);
  assert.match(source,/switchPublicLocale\(page, 'en'/);
  assert.match(source,/switchPublicLocale\(page, 'nl'/);
});
