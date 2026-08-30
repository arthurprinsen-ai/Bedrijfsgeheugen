import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { repairCustomerPortalAuth } from '../tools/customer-portal-auth-race.mjs';

const redirects = readFileSync(new URL('../_redirects', import.meta.url), 'utf8');
const frisseBlik = readFileSync(new URL('../frisse-blik.html', import.meta.url), 'utf8');
const klantportaal = readFileSync(new URL('../klantportaal.html', import.meta.url), 'utf8');

test('demo1 serves the legacy customer portal without changing the public URL', () => {
  assert.match(redirects, /^\/klantportaal\s+klant=demo1\s+\/klantportaal-demo\.html\s+200!$/m);
});

test('old demo alias redirects canonically to demo1', () => {
  assert.match(redirects, /^\/klantportaal\s+klant=demo\s+\/klantportaal\?klant=demo1\s+301!$/m);
});

test('Ijsselmonde serves the legacy full customer portal', () => {
  assert.match(redirects, /^\/klantportaal\s+klant=ijsselmonde\s+\/klantportaal\.html\s+200!$/m);
});

test('demoAI serves the current AI portal without changing the public URL', () => {
  assert.match(redirects, /^\/klantportaal\s+klant=demoAI\s+\/portal\/\s+200!$/m);
});

test('all other customer slugs from scans serve the legacy full portal', () => {
  assert.match(redirects, /^\/klantportaal\s+klant=:klant\s+\/klantportaal\.html\s+200!$/m);
});

test('Frisse Blik bare portal handoff resolves to the legacy demo', () => {
  assert.match(frisseBlik, /\/klantportaal#direct/);
  assert.match(redirects, /^\/klantportaal\s+\/klantportaal-demo\.html\s+200!$/m);
});

test('production transform prevents customer offer routes from opening Netlify Identity and restores persistent Supabase auth first', () => {
  const repaired = repairCustomerPortalAuth(klantportaal);
  assert.match(repaired, /const bl=document\.getElementById\('btnLogin'\);\s*if\(bl\) bl\.addEventListener\('click',function\(\)\{\s*if\(new URLSearchParams\(location\.search\)\.get\('klant'\)\)\{\s*if\(window\.__bgCustomerLogin\) window\.__bgCustomerLogin\(\);\s*return;/m);
  assert.match(repaired, /var AUTH_STORE = 'bg_customer_auth';/);
  assert.match(repaired, /window\.__bgCustomerLogin = function\(\)\{\s*var s=slug\(\);\s*if\(s\) herstelAuth\(s\)\.catch\(function\(\)\{ toonInlog\(s\); \}\);\s*\};/m);
});
