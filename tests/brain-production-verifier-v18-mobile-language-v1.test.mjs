import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production pricing i18n verifier follows active v18 mobile drawer and switches locales', () => {
  const source = fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  assert.match(source,/page\.locator\('#v18MobileDrawer'\)/);
  assert.match(source,/page\.locator\('#mobileToggle'\)/);
  assert.match(source,/v18Drawer\.locator\('\[data-bg-language-select\]'\)/);
  assert.match(source,/await getVisibleMobileLanguage\(page\)/);
  assert.match(source,/selector\.selectOption\(locale\)/);
  assert.match(source,/switchPublicLocale\(page, 'en'/);
  assert.match(source,/switchPublicLocale\(page, 'nl'/);
});
