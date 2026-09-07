import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('legacy bridge uses the physical legacy portal path to prevent recursive V2 routing', () => {
  const registry = read('portal-v2/page-registry.js');
  assert.match(registry, /base='https:\/\/www\.bedrijfsgeheugen\.nl\/klantportaal\.html'/);
});

test('production V2 handoff keeps Netlify Identity in front of the cockpit', () => {
  const html = read('klantportaal-v2.html');
  assert.match(html, /identity\.netlify\.com\/v1\/netlify-identity-widget\.js/);
  assert.match(html, /id="portalGate"/);
  assert.match(html, /id="portalFrame"/);
  assert.match(html, /netlifyIdentity\.on\('login'/);
  assert.match(html, /portal-v2\/index\.html/);
});

test('V2 review route is a first-class pretty URL', () => {
  const redirects = read('_redirects');
  assert.match(redirects, /^\/klantportaal-v2\s+\/klantportaal-v2\.html\s+200!/m);
});
