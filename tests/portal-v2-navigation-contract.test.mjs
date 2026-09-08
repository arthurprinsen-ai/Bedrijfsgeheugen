import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PORTAL_NAV_ITEMS, DESKTOP_NAV_ITEMS } from '../portal-v2/navigation-model.js';

const app = fs.readFileSync('portal-v2/app.js','utf8');

test('all five mobile nav items are real routed controls', () => {
  assert.deepEqual(PORTAL_NAV_ITEMS.map(item=>item.id), ['overview','portal','data-ai','tasks','more']);
  assert.match(app, /dataset\.mobileNav/);
  assert.match(app, /bindPortalNavigation/);
});

test('desktop navigation uses the same explicit routing model rather than decorative buttons', () => {
  assert.equal(DESKTOP_NAV_ITEMS.length, 10);
  assert.ok(DESKTOP_NAV_ITEMS.every(item=>item.target), 'every desktop item needs an explicit target');
  assert.match(app, /dataset\.navTarget/);
  assert.match(app, /DESKTOP_NAV_ITEMS/);
});

test('mobile navigation keeps 44px touch target baseline', () => {
  const css = [
    fs.readFileSync('portal-v2/app.css','utf8'),
    fs.readFileSync('portal-v2/navigation.css','utf8')
  ].join('\n');
  assert.match(css, /\.mobilebar[\s\S]*?button[\s\S]*?min-height:\s*44px/);
});
