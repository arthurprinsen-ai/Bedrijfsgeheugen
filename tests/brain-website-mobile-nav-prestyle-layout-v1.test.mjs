import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../assets/js/menu.js', import.meta.url), 'utf8');

function functionBody(name) {
  const from = source.indexOf('  function ' + name + '() {');
  assert.notEqual(from, -1, name + ' function must exist');
  const to = source.indexOf('\n  }\n', from);
  assert.notEqual(to, -1, name + ' function must end');
  return source.slice(from, to + 4);
}

test('new dynamic mobile menu cannot enter flow before asynchronous stylesheet', () => {
  const creation = source.indexOf("  var nav = document.createElement('div');");
  const hidden = source.indexOf("  nav.setAttribute('hidden', '');", creation);
  const ariaHidden = source.indexOf("  nav.setAttribute('aria-hidden', 'true');", creation);
  const insertion = source.indexOf('  document.body.appendChild(nav);', creation);
  assert.ok(creation >= 0 && hidden > creation && ariaHidden > hidden && insertion > ariaHidden);
  assert.match(source, /css\.href = '\/assets\/shared-mobile-drilldown\.css\?v=1'/);
  assert.match(source, /document\.head\.appendChild\(css\)/);
  assert.doesNotMatch(source.slice(creation, insertion), /nav\.removeAttribute\('hidden'\)/);
});

test('menu open and close transitions maintain native hidden and accessibility state', () => {
  const close = functionBody('sluit');
  const open = functionBody('open');
  assert.match(close, /nav\.setAttribute\('hidden', ''\)/);
  assert.match(close, /nav\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(close, /knop\.setAttribute\('aria-expanded', 'false'\)/);
  assert.match(open, /nav\.removeAttribute\('hidden'\)/);
  assert.match(open, /nav\.setAttribute\('aria-hidden', 'false'\)/);
  assert.match(open, /knop\.setAttribute\('aria-expanded', 'true'\)/);
  assert.ok(close.indexOf("nav.setAttribute('hidden', '')") < close.indexOf("nav.setAttribute('aria-hidden', 'true')"));
  assert.ok(open.indexOf("nav.removeAttribute('hidden')") < open.indexOf("nav.setAttribute('aria-hidden', 'false')"));
});

test('tap, Escape, resize and existing canonical navigation remain usable', () => {
  assert.match(source, /knop\.addEventListener\('click'/);
  assert.match(source, /nav\.addEventListener\('click'/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /innerWidth > 1100/);
  assert.match(source, /if \(link\) sluit\(\)/);
  assert.match(source, /a\.setAttribute\('href', '\/product'\)/);
  assert.match(source, /bron\.setAttribute\('hidden', ''\)/);
  assert.match(source, /toon\('root'\)/);
});

test('negative canary: aria-hidden alone never counts as a no-layout contract', () => {
  const creation = source.indexOf("  var nav = document.createElement('div');");
  const insertion = source.indexOf('  document.body.appendChild(nav);', creation);
  const beforeAppend = source.slice(creation, insertion);
  assert.ok(beforeAppend.includes("nav.setAttribute('hidden', '');"));
  assert.ok(beforeAppend.includes("nav.setAttribute('aria-hidden', 'true');"));
  assert.ok(!beforeAppend.includes("nav.removeAttribute('hidden')"));
  // Do not weaken/skip the canonical browser's phone CLS <= 0.100 oracle.
  // This source patch must still pass exact-head Required and CodeQL.
});
