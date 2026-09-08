import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('portal-v2/index.html','utf8');
const app = fs.readFileSync('portal-v2/app.js','utf8');

test('all five mobile nav items are real routed controls', () => {
  for (const id of ['overview','portal','data-ai','tasks','more']) {
    assert.match(html, new RegExp(`data-mobile-nav="${id}"`), `missing routed mobile control ${id}`);
  }
  assert.match(app, /navigatePortal|mountPortalNavigation|bindPortalNavigation/, 'app must bind shared routed navigation');
});

test('desktop navigation uses explicit targets rather than decorative buttons', () => {
  const matches = [...html.matchAll(/<button[^>]+data-nav-target="([^"]+)"/g)].map(match => match[1]);
  assert.ok(matches.length >= 10, `expected at least 10 routed desktop controls, got ${matches.length}`);
});

test('mobile navigation keeps 44px touch target baseline', () => {
  const css = fs.readFileSync('portal-v2/app.css','utf8');
  assert.match(css, /\.mobilebar[\s\S]*?button[\s\S]*?min-height:\s*44px/);
});
