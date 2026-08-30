const OLD_HANDLER = `  const bl=document.getElementById('btnLogin');
  if(bl) bl.addEventListener('click',function(){
    if(window.netlifyIdentity && netlifyIdentity.open){ netlifyIdentity.open(); }
    else { toonPortaal({email:'lokaal'}); }
  });`;

const GUARDED_HANDLER = `  const bl=document.getElementById('btnLogin');
  if(bl) bl.addEventListener('click',function(){
    if(new URLSearchParams(location.search).get('klant')) return;
    if(window.netlifyIdentity && netlifyIdentity.open){ netlifyIdentity.open(); }
    else { toonPortaal({email:'lokaal'}); }
  });`;

const OLD_CUSTOMER_SUCCESS = `.then(function (sessie) { return haalOfferte(sessie.access_token, s).then(function (k) { bewaar(s, k, sessie.access_token); }); })
        .then(function () { location.reload(); })`;

const OPEN_CUSTOMER_SUCCESS = `.then(function (sessie) { return haalOfferte(sessie.access_token, s).then(function (k) {
          bewaar(s, k, sessie.access_token);
          window.__KLANTEN__ = window.__KLANTEN__ || {};
          window.__KLANTEN__[s] = k;
          toonPortaal({email:mail});
        }); })`;

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
    const occurrences = repaired.split(OLD_HANDLER).length - 1;
    if (occurrences !== 1) {
      throw new Error(`Expected exactly one legacy customer login handler, found ${occurrences}`);
    }
    repaired = repaired.replace(OLD_HANDLER, GUARDED_HANDLER);
  }

  if (!repaired.includes(OPEN_CUSTOMER_SUCCESS)) {
    const occurrences = repaired.split(OLD_CUSTOMER_SUCCESS).length - 1;
    if (occurrences !== 1) {
      throw new Error(`Expected exactly one customer login success handler, found ${occurrences}`);
    }
    repaired = repaired.replace(OLD_CUSTOMER_SUCCESS, OPEN_CUSTOMER_SUCCESS);
  }

  if (!repaired.includes(NETLIFY_CONTROLLER_BYPASS)) {
    const occurrences = repaired.split(NETLIFY_CONTROLLER_START).length - 1;
    if (occurrences !== 1) {
      throw new Error(`Expected exactly one legacy Netlify authorization controller, found ${occurrences}`);
    }
    repaired = repaired.replace(NETLIFY_CONTROLLER_START, NETLIFY_CONTROLLER_BYPASS);
  }

  if (!repaired.includes(GUARDED_HANDLER) || !repaired.includes(OPEN_CUSTOMER_SUCCESS) || !repaired.includes(NETLIFY_CONTROLLER_BYPASS)) {
    throw new Error('Customer portal auth repair was not fully applied');
  }
  return repaired;
}

export const customerAuthRaceGuard = GUARDED_HANDLER;
export const customerAuthSuccessHandler = OPEN_CUSTOMER_SUCCESS;
export const customerNetlifyBypassGuard = NETLIFY_CONTROLLER_BYPASS;
