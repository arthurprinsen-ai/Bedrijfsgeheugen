import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { repairCustomerPortalAuth } from '../tools/customer-portal-auth-race.mjs';

const redirects = readFileSync(new URL('../_redirects', import.meta.url), 'utf8');
const frisseBlik = readFileSync(new URL('../frisse-blik.html', import.meta.url), 'utf8');
const klantportaal = readFileSync(new URL('../klantportaal.html', import.meta.url), 'utf8');

test('all legacy customer entry aliases canonicalize to Portal V2', () => {
  assert.match(redirects, /^\/klantportaal\s+klant=demo1\s+\/portaal\/demo\s+301!$/m);
  assert.match(redirects, /^\/klantportaal\s+klant=demo\s+\/portaal\/demo\s+301!$/m);
  assert.match(redirects, /^\/klantportaal\s+klant=demoAI\s+\/portaal\/demo\s+301!$/m);
  assert.match(redirects, /^\/klantportaal\s+klant=:klant\s+\/portaal\/:klant\s+301!$/m);
  assert.match(redirects, /^\/klantportaal\s+\/portaal\s+301!$/m);
});

test('canonical clean portal routes render Portal V2', () => {
  assert.match(redirects, /^\/portaal\/demo\s+\/portal-v2\/\s+200!$/m);
  assert.match(redirects, /^\/portaal\/ijsselmonde\s+\/portal-v2\/\s+200!$/m);
  assert.match(redirects, /^\/portaal\/\*\s+\/portal-v2\/:splat\s+200!$/m);
});

test('legacy klantportaal html is not a canonical entry route anymore', () => {
  assert.doesNotMatch(redirects, /^\/klantportaal\s+.*\/klantportaal\.html\s+200!$/m);
});

test('Frisse Blik handoff is safely canonicalized through the bare legacy alias', () => {
  assert.match(frisseBlik, /\/klantportaal#direct/);
  assert.match(redirects, /^\/klantportaal\s+\/portaal\s+301!$/m);
});

test('retained legacy auth transform remains safe for direct parity access', () => {
  const repaired = repairCustomerPortalAuth(klantportaal);
  assert.match(repaired,/AUTH_COOKIE\s*=\s*'bg_customer_auth'/);
  assert.match(repaired,/window\.__bgCustomerLogin = function/);
});
