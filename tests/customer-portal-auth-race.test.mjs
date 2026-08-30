import test from 'node:test';
import assert from 'node:assert/strict';
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
        .then(function () { location.reload(); })`;

test('real customer slug bypasses the legacy Netlify auth controller', () => {
  const html = repairCustomerPortalAuth(source);
  assert.match(html, /var slug = .*?;\s*if \(slug && slug !== 'demo'\) return;/s);
});

test('customer login button opens the Supabase customer login instead of becoming inert', () => {
  const html = repairCustomerPortalAuth(source);
  assert.match(html, /if\(new URLSearchParams\(location\.search\)\.get\('klant'\)\)\{\s*if\(window\.__bgCustomerLogin\) window\.__bgCustomerLogin\(\);\s*return;/s);
  assert.match(html, /window\.__bgCustomerLogin = function\(\)\{ var s=slug\(\); if\(s\) toonInlog\(s\); \};/);
  assert.doesNotMatch(html, /if\(new URLSearchParams\(location\.search\)\.get\('klant'\)\) return;/);
});

test('successful customer authentication stores the offer and opens the legacy portal directly', () => {
  const html = repairCustomerPortalAuth(source);
  assert.match(html, /bewaar\(s, k, sessie\.access_token\);[\s\S]*window\.__KLANTEN__\[s\] = k;[\s\S]*toonPortaal\(\{email:mail\}\);/);
  assert.doesNotMatch(html, /\.then\(function \(\) \{ location\.reload\(\); \}\)/);
});
