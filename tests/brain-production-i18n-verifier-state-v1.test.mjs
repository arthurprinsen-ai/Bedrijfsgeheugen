import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const verifierPath='tools/site-shell/verify-pricing-i18n-production.mjs';

test('production locale verifier proves route state without navigation-event coupling', async () => {
  const src=await readFile(verifierPath,'utf8');
  assert.doesNotMatch(src,/page\.waitForURL\(/);
  assert.match(src,/page\.waitForFunction\(/);
  assert.match(src,/location\.pathname/);
  assert.match(src,/document\.documentElement\.lang/);
  assert.match(src,/expectedPathname/);
  assert.match(src,/expectedLocale/);
});

test('production locale verifier retains translated-content and round-trip assertions', async () => {
  const src=await readFile(verifierPath,'utf8');
  assert.match(src,/English route has no visible Powerhouse SaaS text/);
  assert.match(src,/English route still shows Dutch pricing hero copy/);
  assert.match(src,/deprecated \/nl\/\* route/);
  assert.match(src,/switchPublicLocale\(page, 'en'/);
  assert.match(src,/switchPublicLocale\(page, 'nl'/);
});
