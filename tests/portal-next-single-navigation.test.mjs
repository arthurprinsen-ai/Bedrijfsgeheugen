import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const nav=fs.readFileSync('portal-next/portal-navigation-complete.js','utf8');
const app=fs.readFileSync('portal-next/portal-next.js','utf8');
const business=fs.readFileSync('portal-next/portal-business-os-navigation.js','utf8');
const css=fs.readFileSync('portal-next/portal-next.css','utf8');

test('portal exposes exactly one desktop navigation authority',()=>{
  assert.match(nav,/function mountDesktopPrimaryNav\(\).*buildGroupedNav\(nav\)/s);
  assert.doesNotMatch(nav,/mountDesktopDrawer\(\);/);
  assert.doesNotMatch(app,/bindAi\(\);mountPortalLibrary\(\);/);
  assert.match(business,/querySelectorAll\('\.sidebar \.nav,#portalMobileNav'\)/);
});

test('the canonical desktop tree contains all registered portal pages and stays scrollable',()=>{
  assert.match(nav,/Object\.entries\(PORTAL_SECTIONS\)/);
  assert.match(nav,/data-portal-page=/);
  assert.match(css,/\.sidebar \.nav\{[^}]*overflow-y:auto/s);
});

test('mobile is only a responsive rendering of the same grouped tree',()=>{
  assert.match(nav,/buildGroupedNav\(drawer\.querySelector\('#portalMobileNav'\)\)/);
  assert.match(nav,/buildGroupedNav\(nav\)/);
});
