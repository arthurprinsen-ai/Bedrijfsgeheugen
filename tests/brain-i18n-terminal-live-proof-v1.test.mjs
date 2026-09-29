import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('terminal i18n release uses the current cache-busting asset version and same-route authority', () => {
  const injector = readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  const runtime = readFileSync('assets/js/i18n.js','utf8');
  assert.match(injector, /cms-i18n-20260929-4/);
  assert.match(injector, /mobileLanguageFor\(file\)/);
  assert.match(runtime, /btn\.setAttribute\('href', localizedHref\(target\)\)/);
});
