import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const nav=fs.readFileSync('portal-next/portal-navigation-complete.js','utf8');
const loader=fs.readFileSync('portal-next/portal-flow-state.js','utf8');
const app=fs.readFileSync('portal-next/portal-next.js','utf8');
const html=fs.readFileSync('portal-next/index.html','utf8');
const css=fs.readFileSync('portal-next/portal-next.css','utf8');

test('portal has exactly one canonical desktop navigation authority',()=>{
  assert.match(nav,/function mountDesktopPrimaryNav\(\).*buildGroupedNav\(nav\)/s);
  assert.match(nav,/Object\.entries\(PORTAL_SECTIONS\)/);
  assert.doesNotMatch(nav,/mountDesktopDrawer\(\);/);
  assert.doesNotMatch(loader,/portal-business-os-navigation\.js/);
  assert.doesNotMatch(app,/bindAi\(\);mountPortalLibrary\(\);/);
  assert.doesNotMatch(html,/class="mobile-nav"/);
});

test('mobile is a responsive rendering of the same canonical tree',()=>{
  assert.match(nav,/buildGroupedNav\(drawer\.querySelector\('#portalMobileNav'\)\)/);
  assert.match(nav,/buildGroupedNav\(nav\)/);
  assert.match(css,/\.sidebar \.nav\{[^}]*overflow-y:auto/s);
});
