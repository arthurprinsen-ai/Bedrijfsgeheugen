import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { repairCustomerPortalAuth } from '../tools/customer-portal-auth-race.mjs';

const source = `(function(){
  var par = new URLSearchParams(location.search);
  var slug = (par.get('klant') || '').toLowerCase();
  var K = (window.__KLANTEN__ || {})[slug];
  var DEMO = slug === 'demo' || /[?&]direct\\b/.test(location.search);

  const bl=document.getElementById('btnLogin');
  if(bl) bl.addEventListener('click',function(){
    if(window.netlifyIdentity && netlifyIdentity.open){ netlifyIdentity.open(); }
    else { toonPortaal({email:'lokaal'}); }
  });

  function toonInlog(s) {
    var poort = document.getElementById('poort');
    poort.insertAdjacentHTML('beforeend', '<input id="bgMail"><input id="bgWw">');
  }

  /* Elke keer dat de pagina opent de offerte opnieuw ophalen. */
  .then(function (sessie) { return haalOfferte(sessie.access_token, s).then(function (k) { bewaar(s, k, sessie.access_token); }); })
        .then(function () { location.reload(); })

    var heeft = false;
    try { heeft = !!sessionStorage.getItem(BEWAAR + s); } catch (e) {}

    if (heeft) {
      document.querySelectorAll('[aria-label="Uitloggen"]').forEach(function (b) {
        b.addEventListener('click', wissen, true);
      });
      verversen(s);
      return;
    }

    wissen();
    toonInlog(s);
})();`;

test('real customer slug bypasses the legacy Netlify auth controller', () => {
  const html = repairCustomerPortalAuth(source);
  assert.match(html, /var slug = .*?;\s*if \(slug && slug !== 'demo'\) return;/s);
});

test('customer login button opens the customer auth flow instead of becoming inert', () => {
  const html = repairCustomerPortalAuth(source);
  assert.match(html, /window\.__bgCustomerLogin/);
  assert.doesNotMatch(html, /if\(new URLSearchParams\(location\.search\)\.get\('klant'\)\) return;/);
});

test('legacy portal never renders editable customer login fields inline', () => {
  const html = repairCustomerPortalAuth(source);
  assert.match(html, /function toonInlog\(s\) \{\s*location\.replace\('https:\/\/www\.bedrijfsgeheugen\.nl\/klant-login\.html\?klant=' \+ encodeURIComponent\(s\)\);\s*\}/s);
  assert.doesNotMatch(html, /<input id="bgMail"/);
  assert.doesNotMatch(html, /<input id="bgWw"/);
});

test('dedicated customer login page signs in, stores session and returns to the legacy portal', () => {
  const login = readFileSync(new URL('../klant-login.html', import.meta.url), 'utf8');
  assert.match(login, /\/auth\/v1\/token\?grant_type=password/);
  assert.match(login, /localStorage\.setItem\('bg_customer_auth'/);
  assert.match(login, /sessionStorage\.setItem\('bg_klant_' \+ slug/);
  assert.match(login, /sessionStorage\.setItem\('bg_token'/);
  assert.match(login, /location\.replace\('https:\/\/www\.bedrijfsgeheugen\.nl\/klantportaal\?klant=' \+ encodeURIComponent\(slug\)\)/);
});

test('successful customer authentication stores the session and opens the legacy portal directly', () => {
  const html = repairCustomerPortalAuth(source);
  assert.match(html, /bewaarAuth\(sessie\)/);
  assert.match(html, /window\.__KLANTEN__\[s\] = k/);
  assert.match(html, /toonPortaal\(\{email:\s*mail \|\| \(sessie\.user && sessie\.user\.email\) \|\| ''\}\)/);
  assert.doesNotMatch(html, /\.then\(function \(\) \{ location\.reload\(\); \}\)/);
});

test('customer auth persists and refreshes before showing login again', () => {
  const html = repairCustomerPortalAuth(source);
  assert.match(html, /AUTH_STORE\s*=\s*'bg_customer_auth'/);
  assert.match(html, /localStorage\.setItem\(AUTH_STORE, JSON\.stringify\(sessie\)\)/);
  assert.match(html, /grant_type=refresh_token/);
});

test('real customer start path has one auth authority and never calls the destructive legacy refresh loop', () => {
  const html = repairCustomerPortalAuth(source);
  assert.match(html, /herstelAuth\(s\)\.catch\(function\(\)\{ wissen\(\); toonInlog\(s\); \}\)/);
  assert.doesNotMatch(html, /if \(heeft\)[\s\S]*?verversen\(s\)/);
});

test('iOS in-app browser gets a first-party cookie fallback when localStorage is not retained', () => {
  const html = repairCustomerPortalAuth(source);
  assert.match(html, /AUTH_COOKIE\s*=\s*'bg_customer_auth'/);
  assert.match(html, /document\.cookie\s*=\s*AUTH_COOKIE/);
  assert.match(html, /Max-Age=2592000/);
  assert.match(html, /SameSite=Lax/);
  assert.match(html, /Secure/);
  assert.match(html, /leesCookieAuth\(\)/);
});

test('production build repairs and then verifies the isolated customer login contract', () => {
  const build = readFileSync(new URL('../tools/bouw-v18-production.mjs', import.meta.url), 'utf8');
  const helper = readFileSync(new URL('../tools/apply-customer-portal-auth.mjs', import.meta.url), 'utf8');
  const verifier = readFileSync(new URL('../tools/verify-customer-login-contract.mjs', import.meta.url), 'utf8');
  assert.match(build, /applyCustomerPortalAuth/);
  assert.match(build, /verifyCustomerLoginContract/);
  assert.ok(build.indexOf("await import('./bouw-v18-production-core.mjs')") < build.indexOf('applyCustomerPortalAuth()'));
  assert.ok(build.indexOf('applyCustomerPortalAuth()') < build.indexOf('verifyCustomerLoginContract()'));
  assert.match(helper, /repairCustomerPortalAuth/);
  assert.match(helper, /writeFileSync/);
  assert.match(verifier, /klant-login\.html/);
  assert.match(verifier, /klantportaal\.html/);
  assert.match(verifier, /bgMail/);
  assert.match(verifier, /bgWw/);
  assert.match(verifier, /klant-login\.html\?klant=/);
});

test('customer login architecture is documented as a non-regression rule', () => {
  const doc = readFileSync(new URL('../docs/customer-login-architecture.md', import.meta.url), 'utf8');
  assert.match(doc, /enige klantlogin/i);
  assert.match(doc, /klant-login\.html/);
  assert.match(doc, /klantportaal\.html/);
  assert.match(doc, /Supabase/i);
  assert.match(doc, /RLS/);
  assert.match(doc, /niet.*inline/i);
});
