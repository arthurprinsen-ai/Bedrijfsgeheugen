import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('production i18n verifier supports route-driven language links', () => {
  const verifier = readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  assert.match(verifier, /getVisibleMobileLanguageControl\(page, locale\)/);
  assert.match(verifier, /data-bg-language-option/);
  assert.match(verifier, /kind:'link'/);
  assert.match(verifier, /kind:'select'/);
  assert.match(verifier, /control\.locator\.click\(\)/);
  assert.match(verifier, /control\.locator\.selectOption\(locale\)/);
});
