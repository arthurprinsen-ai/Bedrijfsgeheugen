import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('route-aware i18n authority is syntactically valid and runtime-normalized', () => {
  const injector = readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  const runtime = readFileSync('assets/js/i18n.js','utf8');
  assert.match(injector, /mobileLanguageFor\(file\)/);
  assert.match(injector, /html\.replace\(cta, mobileLanguage \+ '\$&'\)/);
  assert.doesNotMatch(injector, /MOBILE_LANGUAGE \+ '\$&'/);
  assert.match(runtime, /btn\.setAttribute\('href', localizedHref\(target\)\)/);
  assert.match(runtime, /btn\.setAttribute\('hreflang', target\)/);
});
