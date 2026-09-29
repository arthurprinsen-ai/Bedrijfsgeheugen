import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('raw public language controls bind to equivalent locale route', () => {
  const injector = readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  const runtime = readFileSync('assets/js/i18n.js','utf8');
  assert.match(injector, /function routeFromFile\(file\)/);
  assert.match(injector, /function rewriteLanguageLinks\(html, file\)/);
  assert.match(injector, /html = rewriteLanguageLinks\(html, file\)/);
  assert.match(injector, /en: route === '\/' \? '\/en\/' : '\/en' \+ route/);
  assert.match(runtime, /btn\.setAttribute\('href', localizedHref\(target\)\)/);
  assert.match(runtime, /btn\.setAttribute\('hreflang', target\)/);
});
