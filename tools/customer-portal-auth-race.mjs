const OLD_HANDLER = `  const bl=document.getElementById('btnLogin');
  if(bl) bl.addEventListener('click',function(){
    if(window.netlifyIdentity && netlifyIdentity.open){ netlifyIdentity.open(); }
    else { toonPortaal({email:'lokaal'}); }
  });`;

const PREVIOUS_GUARDED_HANDLER = `  const bl=document.getElementById('btnLogin');
  if(bl) bl.addEventListener('click',function(){
    if(new URLSearchParams(location.search).get('klant')) return;
    if(window.netlifyIdentity && netlifyIdentity.open){ netlifyIdentity.open(); }
    else { toonPortaal({email:'lokaal'}); }
  });`;

const GUARDED_HANDLER = `  const bl=document.getElementById('btnLogin');
  if(bl) bl.addEventListener('click',function(){
    if(new URLSearchParams(location.search).get('klant')){
      if(window.__bgCustomerLogin) window.__bgCustomerLogin();
      return;
    }
    if(window.netlifyIdentity && netlifyIdentity.open){ netlifyIdentity.open(); }
    else { toonPortaal({email:'lokaal'}); }
  });`;

const LOGIN_FUNCTION_START = `  function toonInlog(s) {`;
const PREVIOUS_CUSTOMER_LOGIN_BRIDGE = `  window.__bgCustomerLogin = function(){ var s=slug(); if(s) toonInlog(s); };\n\n  function toonInlog(s) {`;
const CUSTOMER_LOGIN_BRIDGE = `  var AUTH_STORE = 'bg_customer_auth';

  function bewaarAuth(sessie) {
    try { localStorage.setItem(AUTH_STORE, JSON.stringify(sessie)); } catch (e) {}
  }

  function leesAuth() {
    try { return JSON.parse(localStorage.getItem(AUTH_STORE) || 'null'); } catch (e) { return null; }
  }

  function wisAuth() {
    try { localStorage.removeItem(AUTH_STORE); } catch (e) {}
  }

  function openKlant(sessie, s, mail) {
    return haalOfferte(sessie.access_token, s).then(function (k) {
      bewaar(s, k, sessie.access_token);
      window.__KLANTEN__ = window.__KLANTEN__ || {};
      window.__KLANTEN__[s] = k;
      toonPortaal({email: mail || (sessie.user && sessie.user.email) || ''});
      return true;
    });
  }

  function vernieuwAuth(sessie) {
    if (!sessie || !sessie.refresh_token) return Promise.reject({message:'geen sessie'});
    return api('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({refresh_token:sessie.refresh_token})
    }).then(function (nieuw) {
      bewaarAuth(nieuw);
      return nieuw;
    });
  }

  function herstelAuth(s) {
    var sessie = leesAuth();
    if (!sessie || !sessie.access_token) return Promise.reject({message:'geen sessie'});
    var mail = (sessie.user && sessie.user.email) || '';
    return openKlant(sessie, s, mail).catch(function () {
      return vernieuwAuth(sessie).then(function (nieuw) {
        return openKlant(nieuw, s, (nieuw.user && nieuw.user.email) || mail);
      });
    }).catch(function (e) {
      wisAuth();
      throw e;
    });
  }

  window.__bgCustomerLogin = function(){
    var s=slug();
    if(s) herstelAuth(s).catch(function(){ toonInlog(s); });
  };

  function toonInlog(s) {`;

const OLD_CUSTOMER_SUCCESS = `.then(function (sessie) { return haalOfferte(sessie.access_token, s).then(function (k) { bewaar(s, k, sessie.access_token); }); })
        .then(function () { location.reload(); })`;

const PREVIOUS_OPEN_CUSTOMER_SUCCESS = `.then(function (sessie) { return haalOfferte(sessie.access_token, s).then(function (k) {
          bewaar(s, k, sessie.access_token);
          window.__KLANTEN__ = window.__KLANTEN__ || {};
          window.__KLANTEN__[s] = k;
          toonPortaal({email:mail});
        }); })`;

const OPEN_CUSTOMER_SUCCESS = `.then(function (sessie) {
          bewaarAuth(sessie);
          return openKlant(sessie, s, mail);
        })`;

const OLD_LOGIN_FALLBACK = `    wissen();
    toonInlog(s);`;
const RESTORING_LOGIN_FALLBACK = `    wissen();
    herstelAuth(s).catch(function(){ toonInlog(s); });`;

const OLD_LOGOUT_HANDLER = `b.addEventListener('click', wissen, true);`;
const PERSISTENT_LOGOUT_HANDLER = `b.addEventListener('click', function(){ wissen(); wisAuth(); }, true);`;

const NETLIFY_CONTROLLER_START = `(function(){
  var par = new URLSearchParams(location.search);
  var slug = (par.get('klant') || '').toLowerCase();`;

const NETLIFY_CONTROLLER_BYPASS = `(function(){
  var par = new URLSearchParams(location.search);
  var slug = (par.get('klant') || '').toLowerCase();
  if (slug && slug !== 'demo') return;`;

export function repairCustomerPortalAuth(html) {
  let repaired = html;

  if (!repaired.includes(GUARDED_HANDLER)) {
    if (repaired.includes(PREVIOUS_GUARDED_HANDLER)) repaired = repaired.replace(PREVIOUS_GUARDED_HANDLER, GUARDED_HANDLER);
    else {
      const occurrences = repaired.split(OLD_HANDLER).length - 1;
      if (occurrences !== 1) throw new Error(`Expected exactly one legacy customer login handler, found ${occurrences}`);
      repaired = repaired.replace(OLD_HANDLER, GUARDED_HANDLER);
    }
  }

  if (!repaired.includes(CUSTOMER_LOGIN_BRIDGE)) {
    if (repaired.includes(PREVIOUS_CUSTOMER_LOGIN_BRIDGE)) repaired = repaired.replace(PREVIOUS_CUSTOMER_LOGIN_BRIDGE, CUSTOMER_LOGIN_BRIDGE);
    else {
      const occurrences = repaired.split(LOGIN_FUNCTION_START).length - 1;
      if (occurrences !== 1) throw new Error(`Expected exactly one customer login form function, found ${occurrences}`);
      repaired = repaired.replace(LOGIN_FUNCTION_START, CUSTOMER_LOGIN_BRIDGE);
    }
  }

  if (!repaired.includes(OPEN_CUSTOMER_SUCCESS)) {
    if (repaired.includes(PREVIOUS_OPEN_CUSTOMER_SUCCESS)) repaired = repaired.replace(PREVIOUS_OPEN_CUSTOMER_SUCCESS, OPEN_CUSTOMER_SUCCESS);
    else {
      const occurrences = repaired.split(OLD_CUSTOMER_SUCCESS).length - 1;
      if (occurrences !== 1) throw new Error(`Expected exactly one customer login success handler, found ${occurrences}`);
      repaired = repaired.replace(OLD_CUSTOMER_SUCCESS, OPEN_CUSTOMER_SUCCESS);
    }
  }

  if (!repaired.includes(RESTORING_LOGIN_FALLBACK)) {
    const occurrences = repaired.split(OLD_LOGIN_FALLBACK).length - 1;
    if (occurrences !== 1) throw new Error(`Expected exactly one customer login fallback, found ${occurrences}`);
    repaired = repaired.replace(OLD_LOGIN_FALLBACK, RESTORING_LOGIN_FALLBACK);
  }

  if (!repaired.includes(PERSISTENT_LOGOUT_HANDLER) && repaired.includes(OLD_LOGOUT_HANDLER)) {
    repaired = repaired.replace(OLD_LOGOUT_HANDLER, PERSISTENT_LOGOUT_HANDLER);
  }

  if (!repaired.includes(NETLIFY_CONTROLLER_BYPASS)) {
    const occurrences = repaired.split(NETLIFY_CONTROLLER_START).length - 1;
    if (occurrences !== 1) throw new Error(`Expected exactly one legacy Netlify authorization controller, found ${occurrences}`);
    repaired = repaired.replace(NETLIFY_CONTROLLER_START, NETLIFY_CONTROLLER_BYPASS);
  }

  if (!repaired.includes(GUARDED_HANDLER) || !repaired.includes(CUSTOMER_LOGIN_BRIDGE) || !repaired.includes(OPEN_CUSTOMER_SUCCESS) || !repaired.includes(RESTORING_LOGIN_FALLBACK) || !repaired.includes(NETLIFY_CONTROLLER_BYPASS)) {
    throw new Error('Customer portal auth repair was not fully applied');
  }
  return repaired;
}

export const customerAuthRaceGuard = GUARDED_HANDLER;
export const customerLoginBridge = CUSTOMER_LOGIN_BRIDGE;
export const customerAuthSuccessHandler = OPEN_CUSTOMER_SUCCESS;
export const customerAuthRestoreHandler = RESTORING_LOGIN_FALLBACK;
export const customerNetlifyBypassGuard = NETLIFY_CONTROLLER_BYPASS;
