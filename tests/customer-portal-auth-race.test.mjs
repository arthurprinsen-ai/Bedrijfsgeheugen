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
  }

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

test('customer login button opens the Supabase customer login instead of becoming inert', () => {
  const html = repairCustomerPortalAuth(source);
  assert.match(html, /window\.__bgCustomerLogin/);
  assert.doesNotMatch(html, /if\(new URLSearchParams\(location\.search\)\.get\('klant'\)\) return;/);
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

test('iOS login initializes once and only exposes fields after the full page load', () => {
  const html = repairCustomerPortalAuth(source);
  assert.match(html, /if \(window\.__bgCustomerAuthStarted\) return;/);
  assert.match(html, /window\.__bgCustomerAuthStarted = true;/);
  assert.match(html, /document\.readyState === 'complete'/);
  assert.match(html, /window\.addEventListener\('load', activeerKlantAuth, \{once:true\}\)/);
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

test('production build always applies customer portal auth repair after generating V18', () => {
  const build = readFileSync(new URL('../tools/bouw-v18-production.mjs', import.meta.url), 'utf8');
  const helper = readFileSync(new URL('../tools/apply-customer-portal-auth.mjs', import.meta.url), 'utf8');
  assert.match(build, /applyCustomerPortalAuth/);
  assert.ok(build.indexOf("await import('./bouw-v18-production-core.mjs')") < build.indexOf('applyCustomerPortalAuth()'));
  assert.match(helper, /repairCustomerPortalAuth/);
  assert.match(helper, /writeFileSync/);
});
