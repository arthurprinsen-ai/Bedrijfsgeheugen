import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('production i18n proof follows visible mobile language controls', async () => {
  const source = await readFile('tools/site-shell/verify-pricing-i18n-production.mjs', 'utf8');
  assert.match(source, /viewport:\{ width:390, height:844 \}/);
  assert.match(source, /#bgkopKnop/);
  assert.match(source, /data-bg-language-select/);
  assert.match(source, /selectOption\(target\)/);
  assert.match(source, /selectMobileLanguage\(page, 'en', \/\^\\\/en\\\/prijzen/);
  assert.match(source, /selectMobileLanguage\(page, 'nl', \/\^\\\/prijzen/);
  assert.doesNotMatch(source, /const current = page\.locator\('button\[data-bg-language-current\]'/);
  assert.match(source, /English route did not render html lang=en/);
  assert.match(source, /Dutch route did not render html lang=nl/);
});
