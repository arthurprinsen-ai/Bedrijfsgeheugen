import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const verifierPath='tools/site-shell/verify-pricing-i18n-production.mjs';

test('production locale verifier proves route and html lang state after a committed client navigation', async () => {
  // Navigation lifecycle is owned by brain-i18n-production-navigation-readback-v2 (waitUntil:'commit',
  // not the load event); this test only pins that route AND rendered locale are both asserted.
  const src=await readFile(verifierPath,'utf8');
  assert.match(src,/waitUntil:'commit'/);
  assert.match(src,/new URL\(url\)\.pathname/);
  assert.match(src,/getAttribute\('lang'\)\) !== locale/);
  assert.match(src,/expectedPath/);
});

test('production locale verifier retains translated-content and round-trip assertions', async () => {
  const src=await readFile(verifierPath,'utf8');
  assert.match(src,/English route has no visible Powerhouse SaaS text/);
  assert.match(src,/English route still shows Dutch pricing hero copy/);
  assert.match(src,/deprecated \/nl\/\* route/);
  assert.match(src,/switchPublicLocale\(page, 'en'/);
  assert.match(src,/switchPublicLocale\(page, 'nl'/);
});

test('production locale verifier handles the public cookie overlay before language interaction', async () => {
  const src=await readFile(verifierPath,'utf8');
  assert.match(src,/async function dismissCookieOverlay/);
  assert.match(src,/#bgCookie/);
  assert.match(src,/#bgCookieDeny/);
  assert.match(src,/await dismissCookieOverlay\(page\)/);
  assert.match(src,/state:'hidden'/);
});
