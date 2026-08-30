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

export function repairCustomerPortalAuth(html) {
  if (html.includes(GUARDED_HANDLER)) return html;

  const occurrences = html.split(OLD_HANDLER).length - 1;
  if (occurrences !== 1) {
    throw new Error(`Expected exactly one legacy customer login handler, found ${occurrences}`);
  }

  const repaired = html.replace(OLD_HANDLER, GUARDED_HANDLER);
  if (!repaired.includes(GUARDED_HANDLER)) {
    throw new Error('Customer auth race guard was not applied');
  }
  return repaired;
}

export const customerAuthRaceGuard = GUARDED_HANDLER;
