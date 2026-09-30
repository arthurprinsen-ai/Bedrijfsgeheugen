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


test('public language-option clicks own navigation before mobile menu capture handlers', () => {
  const source = fs.readFileSync(runtime,'utf8');
  const apply = fs.readFileSync(path.resolve('tools/site-shell/apply-i18n.mjs'),'utf8');
  assert.match(source,/window\.addEventListener\('click',[\s\S]*\[data-bg-language-option\][\s\S]*event\.preventDefault\(\)[\s\S]*event\.stopImmediatePropagation\(\)[\s\S]*window\.location\.assign\(href\)[\s\S]*, true\);/);
  assert.match(apply,/cms-i18n-20260930-2/);
});
