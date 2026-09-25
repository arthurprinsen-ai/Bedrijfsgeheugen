import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production pricing i18n verifier follows active v18 mobile drawer', () => {
  const source = fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  assert.match(source,/page\.locator\('#v18MobileDrawer'\)/);
  assert.match(source,/page\.locator\('#mobileToggle'\)/);
  assert.match(source,/v18Drawer\.locator\('\[data-bg-language-select\]'\)/);
  assert.match(source,/await getVisibleMobileLanguage\(page\)/);
  assert.match(source,/selectOption\('en'\)/);
  assert.match(source,/selectOption\('nl'\)/);
});
