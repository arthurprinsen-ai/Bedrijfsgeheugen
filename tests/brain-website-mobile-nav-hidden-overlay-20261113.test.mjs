import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const menu = readFileSync('assets/js/menu.js','utf8');
const sitewide = readFileSync('assets/sitewide-mobile-ui-20261111.js','utf8');
const css = readFileSync('assets/sitewide-mobile-ui-20261111.css','utf8');
const visibility = readFileSync('tools/site-shell/standalone-visibility-check.mjs','utf8');
const first = (source,text)=>source.indexOf(text);
function bodyOf(name){
  const start=first(menu,'  function '+name+'() {');
  assert.ok(start>=0,'Missing original '+name+' function');
  const end=menu.indexOf('\n  }\n',start);
  assert.ok(end>start);
  return menu.slice(start,end+4);
}
test('shared mobile navigation starts natively hidden before asynchronous CSS and body insertion',()=>{
  const created=first(menu,"  var nav = document.createElement('div');");
  const hidden=menu.indexOf("nav.setAttribute('hidden', '')",created);
  const aria=menu.indexOf("nav.setAttribute('aria-hidden', 'true')",created);
  const inserted=menu.indexOf('document.body.appendChild(nav)',created);
  assert.ok(created>=0 && hidden>created && hidden<aria && aria<inserted);
  assert.ok(menu.includes("css.href = '/assets/shared-mobile-drilldown.css?v=1'"));
  assert.ok(!menu.slice(created,inserted).includes("nav.removeAttribute('hidden')"));
});
test('original click, close, Escape, resize and sitewide close keep one native hidden contract',()=>{
  const open=bodyOf('open'),close=bodyOf('sluit');
  assert.match(open,/nav\.removeAttribute\('hidden'\)/);
  assert.match(open,/nav\.setAttribute\('aria-hidden', 'false'\)/);
  assert.match(close,/nav\.setAttribute\('hidden', ''\)/);
  assert.match(close,/nav\.setAttribute\('aria-hidden', 'true'\)/);
  assert.ok(close.indexOf("setAttribute('hidden'")<close.indexOf("setAttribute('aria-hidden'"));
  assert.match(sitewide,/nav\.id==='bgSharedMobileNav'\) nav\.setAttribute\('hidden',''\)/);
  assert.match(menu,/event\.key === 'Escape'/);
  assert.match(menu,/innerWidth > 1100/);
  assert.match(menu,/knop\.addEventListener\('click'/);
});
test('canonical preloaded mobile CSS leaves an aria-hidden shared menu non-occluding',()=>{
  assert.ok(css.includes('body > #bgSharedMobileNav[aria-hidden="true"]'));
  assert.ok(css.includes('body > #bgSharedMobileNav[aria-hidden="false"]:not([hidden])'));
  assert.match(css,/body > #bgSharedMobileNav\[aria-hidden="true"\]\{[^}]*visibility:hidden!important;opacity:0!important;pointer-events:none!important/s);
  assert.match(css,/body > #bgSharedMobileNav\[aria-hidden="false"\]:not\(\[hidden\]\)\{[^}]*visibility:visible!important;opacity:1!important;pointer-events:auto!important/s);
});
test('original 279-route real browser occlusion and CLS gates are not waived',()=>{
  assert.match(visibility,/name} is visually occluded by/);
  assert.match(visibility,/h1: inspect\('main h1'\)/);
  assert.match(visibility,/if \(state\.cls > 0\.1\)/);
  assert.match(visibility,/\{ name: 'phone', width: 390, height: 844 \}/);
});
