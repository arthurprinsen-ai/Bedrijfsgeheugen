import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PORTAL_NAV_ITEMS, DESKTOP_NAV_ITEMS } from '../portal-v2/navigation-model.js';

const app = fs.readFileSync('portal-v2/app.js','utf8');

test('all five mobile nav items are real routed controls', () => {
  assert.deepEqual(PORTAL_NAV_ITEMS.map(item=>item.id), ['overview','project','data-ai','tasks','more']);
  assert.equal(PORTAL_NAV_ITEMS.find(item=>item.id==='project')?.target,'hub:project');
  assert.match(app, /dataset\.mobileNav/);
  assert.match(app, /bindPortalNavigation/);
});

test('desktop navigation uses the same explicit routing model rather than decorative buttons', () => {
  assert.equal(DESKTOP_NAV_ITEMS.length, 10);
  assert.ok(DESKTOP_NAV_ITEMS.every(item=>item.target), 'every desktop item needs an explicit target');
  assert.match(app, /dataset\.navTarget/);
  assert.match(app, /DESKTOP_NAV_ITEMS/);
  assert.match(app, /desktop-project-nav/);
});

test('mobile navigation keeps 44px touch target baseline', () => {
  const css = [
    fs.readFileSync('portal-v2/app.css','utf8'),
    fs.readFileSync('portal-v2/navigation.css','utf8')
  ].join('\n');
  assert.match(css, /\.mobilebar[\s\S]*?button[\s\S]*?min-height:\s*44px/);
});


test('all legacy customer portal entry routes canonicalize to Portal V2 overview', () => {
  const redirects = fs.readFileSync('_redirects','utf8');
  const product = fs.readFileSync('product.html','utf8');
  const homepage = fs.readFileSync('index.html','utf8');
  assert.match(redirects, /\/klantportaal\s+klant=demo\s+\/portaal\/demo\s+301!/);
  assert.match(redirects, /\/klantportaal\s+klant=:klant\s+\/portaal\/:klant\s+301!/);
  assert.match(redirects, /\/klantportaal\s+\/portaal\s+301!/);
  assert.doesNotMatch(redirects, /\/klantportaal\.html\s+200!/);
  assert.match(product, /href="\/portaal\/demo"/);
  assert.doesNotMatch(product, /href="\/klantportaal\?klant=demo"/);
  assert.match(homepage, /location\.replace\('\/portal-v2\/' \+ h\)/);
});


test('portal boot always normalizes to executive overview instead of auto-opening a detail page', () => {
  const router = fs.readFileSync('portal-v2/router.js','utf8');
  assert.match(router, /history\.replaceState\(\{portalTarget:'overzicht'\},'',navigationUrl\('overzicht'\)\)/);
  assert.match(router, /applyTarget\('overzicht'\)/);
  assert.doesNotMatch(router, /applyTarget\(readTargetFromLocation\(\)\);\s*\n\}/);
});
