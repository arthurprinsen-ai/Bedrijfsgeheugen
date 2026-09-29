import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('pricing production i18n proof uses visible route links and only keeps select as compatibility fallback', () => {
  const source = fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  assert.match(source,/viewport:\{ width:390, height:844 \}/);
  assert.match(source,/page\.locator\('#bgkopKnop'\)/);
  assert.match(source,/#bgSharedMobileNav/);
  assert.match(source,/\[data-bg-language-option=/);
  assert.match(source,/\[data-bg-language-select\]/);
  assert.match(source,/waitFor\(\{ state:'visible', timeout:5_000 \}\)/);
  assert.match(source,/control\.locator\.click\(\)/);
  assert.match(source,/control\.locator\.selectOption\(locale\)/);
  assert.match(source,/visible mobile language control is missing after opening mobile navigation/);
  assert.match(source,/switchPublicLocale\(page, 'en'/);
  assert.match(source,/switchPublicLocale\(page, 'nl'/);
});
