import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const runtime = path.resolve('assets/js/i18n.js');

test('public i18n runtime preserves the chosen locale on every internal navigation link', () => {
  const source = fs.readFileSync(runtime,'utf8');
  assert.match(source,/function localizedInternalHref\(href, target\)/);
  assert.match(source,/url\.origin !== location\.origin/);
  assert.match(source,/NON_PAGE_PREFIXES/);
  assert.match(source,/\[data-bg-language-option\],\[data-bg-locale-fixed\]/);
  assert.match(source,/syncInternalLinks\(document\)/);
  assert.match(source,/roots\.forEach\(root => syncInternalLinks\(root\)\)/);
  assert.match(source,/normalizeLocale\(target\) === 'en'/);
  assert.match(source,/'\/en' \+ \(stripped === '\/' \? '\/' : stripped\)/);
});

test('portal and technical endpoints stay outside public locale rewriting', () => {
  const source = fs.readFileSync(runtime,'utf8');
  assert.match(source,/stripped\.startsWith\('\/portal'\)/);
  assert.match(source,/stripped\.startsWith\('\/klantportaal'\)/);
  assert.match(source,/'\/api\/'/);
  assert.match(source,/'\/assets\/'/);
});
