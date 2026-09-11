import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { repairCustomerPortalAuth } from '../tools/customer-portal-auth-race.mjs';

const redirects = readFileSync(new URL('../_redirects', import.meta.url), 'utf8');
const frisseBlik = readFileSync(new URL('../frisse-blik.html', import.meta.url), 'utf8');
const klantportaal = readFileSync(new URL('../klantportaal.html', import.meta.url), 'utf8');

test('demo1 serves the legacy customer portal without changing the public URL', () => {
  // Sinds 11 september 2026 wijst demo1 naar klantportaal.html in plaats van
  // naar het losse demobestand: het volledige portaal in demostand, alles open.
  // Nog steeds een rewrite, dus de publieke URL blijft gelijk.
  assert.match(redirects, /^\/klantportaal\s+klant=demo1\s+\/klantportaal\.html\s+200!$/m);
});

test('old demo alias redirects canonically to demo1', () => {
  assert.match(redirects, /^\/klantportaal\s+klant=demo\s+\/klantportaal\?klant=demo1\s+301!$/m);
});

test('Ijsselmonde serves the legacy full customer portal', () => {
  assert.match(redirects, /^\/klantportaal\s+klant=ijsselmonde\s+\/klantportaal\.html\s+200!$/m);
});

test('demoAI serves the current AI portal without changing the public URL', () => {
  // Portal V2 is sinds 11 september 2026 het enige klantportaal (#1385, #1388,
  // #1393). Deze route wijst nu naar V2, maar blijft een rewrite: de publieke URL
  // verandert niet, zodat gedeelde demolinks blijven werken.
  assert.match(redirects, /^\/klantportaal\s+klant=demoAI\s+\/portal-v2\/\s+200!$/m);
});

test('all other customer slugs from scans serve the legacy full portal', () => {
  assert.match(redirects, /^\/klantportaal\s+klant=:klant\s+\/klantportaal\.html\s+200!$/m);
});

test('Frisse Blik bare portal handoff resolves to the legacy demo', () => {
  assert.match(frisseBlik, /\/klantportaal#direct/);
  assert.match(redirects, /^\/klantportaal\s+\/klantportaal-demo\.html\s+200!$/m);
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
