import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { repairCustomerPortalAuth } from '../tools/customer-portal-auth-race.mjs';

const redirects = readFileSync(new URL('../_redirects', import.meta.url), 'utf8');
const frisseBlik = readFileSync(new URL('../frisse-blik.html', import.meta.url), 'utf8');
const klantportaal = readFileSync(new URL('../klantportaal.html', import.meta.url), 'utf8');

test('demo aliases converge on the canonical Portal V2 demo route', () => {
  for (const slug of ['demo','demo1','demoAI']) {
    assert.match(redirects, new RegExp('^/klantportaal\\s+klant='+slug+'\\s+/portaal/demo\\s+301!$','m'));
  }
  assert.match(redirects, /^\/portaal\/demo\s+\/portal-v2\/\s+200!$/m);
});

test('Ijsselmonde uses the canonical Portal V2 customer route', () => {
  assert.match(redirects, /^\/portaal\/ijsselmonde\s+\/portal-v2\/\s+200!$/m);
});

test('all other customer slugs from scans use the canonical V2 customer route', () => {
  assert.match(redirects, /^\/klantportaal\s+klant=:klant\s+\/portaal\/:klant\s+301!$/m);
  assert.match(redirects, /^\/portaal\/\*\s+\/portal-v2\/:splat\s+200!$/m);
});

test('Frisse Blik bare portal handoff resolves to the canonical portal entry', () => {
  assert.match(frisseBlik, /\/klantportaal#direct/);
  assert.match(redirects, /^\/klantportaal\s+\/portaal\s+301!$/m);
  assert.match(redirects, /^\/portaal\s+\/portal-v2\/\s+301!$/m);
});

test('production transform prevents customer offer routes from opening Netlify Identity', () => {
  const repaired = repairCustomerPortalAuth(klantportaal);
  assert.match(
    repaired,
    /const bl=document\.getElementById\('btnLogin'\);\s*if\(bl\) bl\.addEventListener\('click',function\(\)\{\s*if\(new URLSearchParams\(location\.search\)\.get\('klant'\)\)\{\s*if\(window\.__bgCustomerLogin\) window\.__bgCustomerLogin\(\);\s*return;/m
  );
  assert.match(repaired, /window\.__bgCustomerLogin = function\(\)\{\s*var s=slug\(\);\s*if\(s\) herstelAuth\(s\)\.catch\(function\(\)\{ toonInlog\(s\); \}\);\s*\};/);
  assert.match(repaired, /AUTH_COOKIE\s*=\s*'bg_customer_auth'/);
});
