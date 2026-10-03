import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PORTAL_NAV_ITEMS, DESKTOP_NAV_GROUPS } from '../portal-v2/navigation-model.js';
import { allPageIds } from '../portal-v2/page-registry.js';

const app = fs.readFileSync('portal-v2/app.js','utf8');
const html = fs.readFileSync('portal-v2/index.html','utf8');
const router = fs.readFileSync('portal-v2/router.js','utf8');

test('desktop and compact layouts use one complete canonical navigation tree', () => {
  const registered=new Set(allPageIds());
  const canonical=new Set(DESKTOP_NAV_GROUPS.flatMap(group=>group.pages.map(page=>page.target)).filter(target=>!target.startsWith('hub:')));
  for(const id of registered) assert.ok(canonical.has(id), id);
  assert.ok(DESKTOP_NAV_GROUPS.some(group=>group.pages.some(page=>page.target==='hub:project')));
  assert.ok(PORTAL_NAV_ITEMS.length>=registered.size);
  assert.match(app,/portal-single-navigation/);
  assert.doesNotMatch(app,/dataset\.mobileNav/);
  assert.doesNotMatch(html,/class="mobilebar"/);
  assert.doesNotMatch(router,/data-mobile-nav/);
});

test('canonical sidebar routes each page directly instead of activating a second group menu', () => {
  assert.match(app,/dataset\.navTarget=page\.target/);
  assert.match(app,/dataset\.navPage=page\.id/);
  assert.match(router,/button\.dataset\.navTarget===target/);
});

test('responsive hamburger is only the compact rendering of the same full tree', () => {
  const css = fs.readFileSync('portal-v2/navigation.css','utf8');
  assert.match(html, /id="portalFullMenuToggle"/);
  assert.match(css,/\.portal-hamburger\{display:none\}/);
  assert.match(css,/@media\(max-width:1180px\)\{\.portal-hamburger\{display:inline-flex\}\}/);
  assert.match(css,/\.mobilebar\{display:none!important\}/);
});

test('customer portal routes canonicalize to Portal V2 except the preserved IJsselmonde legacy portal', () => {
  const redirects = fs.readFileSync('_redirects','utf8');
  const product = fs.readFileSync('product.html','utf8');
  const homepage = fs.readFileSync('index.html','utf8');
  assert.match(redirects, /\/klantportaal\s+klant=demo\s+\/portaal\/demo\s+301!/);
  assert.match(redirects, /\/klantportaal\s+klant=:klant\s+\/portaal\/:klant\s+301!/);
  assert.match(redirects, /\/klantportaal\s+\/portaal\s+301!/);
  assert.match(redirects, /\/klantportaal\s+klant=ijsselmonde\s+\/portal-v2\/legacy\/ijsselmonde\/klantportaal\.html\s+200!/);
  assert.doesNotMatch(redirects, /^\/klantportaal\.html\s+.*\s+200!$/m);
  assert.match(product, /href="\/portaal-demo"/);
  assert.doesNotMatch(product, /href="\/klantportaal\?klant=demo"/);
  assert.match(homepage, /location\.replace\('\/portal-v2\/' \+ h\)/);
});

test('portal boot preserves explicit page and hub deep links while overview remains the default', () => {
  assert.match(router, /return params\.get\('page'\) \|\| 'overzicht'/);
  assert.match(router, /const initialTarget=readTargetFromLocation\(\)/);
  assert.match(router, /history\.replaceState\(\{portalTarget:initialTarget\},'',navigationUrl\(initialTarget\)\)/);
  assert.match(router, /applyTarget\(initialTarget\)/);
  assert.doesNotMatch(router, /history\.replaceState\(\{portalTarget:'overzicht'\}/);
});
