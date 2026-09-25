import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('i18n runtime mounts the mobile language control into the active v18 drawer', () => {
  const source = fs.readFileSync('assets/js/i18n.js','utf8');
  assert.match(source,/document\.getElementById\('v18MobileDrawer'\)/);
  assert.match(source,/document\.getElementById\('bgkopMob'\)/);
  assert.match(source,/languageControl\('mobile'\)/);
  assert.match(source,/mobileHost\.insertBefore\(control, auth \|\| cta \|\| null\)/);
});

test('production verifier targets the same active v18 drawer', () => {
  const verifier = fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  assert.match(verifier,/page\.locator\('#v18MobileDrawer'\)/);
  assert.match(verifier,/v18Drawer\.locator\('\[data-bg-language-select\]'\)/);
});
