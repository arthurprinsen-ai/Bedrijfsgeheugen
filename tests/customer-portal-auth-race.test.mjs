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
  assert.match(html, /toonPortaal\(\{email:mail\}\)/);
  assert.doesNotMatch(html, /\.then\(function \(\) \{ location\.reload\(\); \}\)/);
});

test('customer auth persists and refreshes before showing login again', () => {
  const html = repairCustomerPortalAuth(source);
  assert.match(html, /AUTH_STORE\s*=\s*'bg_customer_auth'/);
  assert.match(html, /localStorage\.setItem\(AUTH_STORE, JSON\.stringify\(sessie\)\)/);
  assert.match(html, /grant_type=refresh_token/);
  assert.match(html, /herstelAuth\(s\)\.catch\(function\(\)\{ toonInlog\(s\); \}\)/);
});

test('checked-in customer portal source already contains persistent auth before the Netlify build starts', () => {
  const portal = readFileSync(new URL('../klantportaal.html', import.meta.url), 'utf8');
  assert.match(portal, /AUTH_STORE\s*=\s*'bg_customer_auth'/);
  assert.match(portal, /localStorage\.setItem\(AUTH_STORE, JSON\.stringify\(sessie\)\)/);
  assert.match(portal, /herstelAuth\(s\)/);
});
