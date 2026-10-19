import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../klantportaal.html', import.meta.url),'utf8');
const javascript = readFileSync(new URL('../assets/js/portal-charts-v3.js', import.meta.url),'utf8');
const stylesheet = readFileSync(new URL('../assets/css/portal-charts-v3.css', import.meta.url),'utf8');

test('canonical customer portal loads the responsive chart layer', () => {
  for (const id of ['staat','ovCmmiGraf','curveMini']) {
    assert.match(page, new RegExp('id="'+id+'"'));
    assert.match(javascript, new RegExp("'"+id+"'"));
  }
  assert.match(page,/\/assets\/js\/portal-charts-v3\.js/);
  assert.match(page,/\/assets\/css\/portal-charts-v3\.css/);
  assert.match(javascript,/var old=teken;/);
  assert.match(javascript,/queueMicrotask\(paint\)/);
});

test('all chart stages have touch, click, keyboard and hover/focus affordances', () => {
  assert.match(javascript,/addEventListener\('click'/);
  assert.match(javascript,/addEventListener\('pointerover'/);
  assert.match(javascript,/addEventListener\('focusin'/);
  assert.match(javascript,/aria-pressed="false"/);
  assert.match(javascript,/type="button"/);
  assert.match(stylesheet,/touch-action:manipulation/);
  assert.match(stylesheet,/@media\(max-width:490px\)/);
  assert.match(stylesheet,/min-height:50px/);
  assert.match(stylesheet,/:focus-visible/);
});

test('modelled chart values must not masquerade as verified market statistics', () => {
  assert.match(javascript,/geen gemeten marktpercentages/i);
  assert.match(javascript,/geen geverifieerd percentiel/i);
  assert.match(javascript,/geen formele CMMI-audit/i);
  assert.doesNotMatch(javascript,/Math\.random|VERD=\[/);
  assert.match(javascript,/Number\(S\.niveaus\[d\.k\]\)/);
});

test('desktop and mobile charts render as bounded, wrapping cards', () => {
  assert.match(stylesheet,/min-width:0/);
  assert.match(stylesheet,/overflow-wrap:anywhere/);
  assert.match(stylesheet,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(stylesheet,/grid-template-columns:1fr/);
  assert.match(stylesheet,/#p-overzicht \.bgv3-card #staat/);
  assert.match(stylesheet,/#p-overzicht \.bgv3-card #curveMini/);
});