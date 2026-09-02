import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const TOKEN_FLOW_RE = /#(?:invite|recovery|confirmation|email_change)_token=/;

const EARLY_IDENTITY_HANDLER = `if(window.netlifyIdentity){
  netlifyIdentity.on('init',u=>{ if(u) toonPortaal(u); });
  netlifyIdentity.on('login',u=>{ netlifyIdentity.close(); toonPortaal(u); });
  netlifyIdentity.on('logout',()=>location.reload());
}`;

const FIXED_IDENTITY_HANDLER = `if(window.netlifyIdentity){
  const identityTokenFlow=/#(?:invite|recovery|confirmation|email_change)_token=/.test(location.hash);
  netlifyIdentity.on('init',u=>{ if(identityTokenFlow) return; if(u) toonPortaal(u); });
  netlifyIdentity.on('recovery',()=>{ netlifyIdentity.open('recovery'); });
  netlifyIdentity.on('invite',()=>{ netlifyIdentity.open('signup'); });
  netlifyIdentity.on('login',u=>{ if(identityTokenFlow) return; netlifyIdentity.close(); toonPortaal(u); });
  netlifyIdentity.on('logout',()=>location.reload());
}`;

export function transformIdentityTokenFlow(html){
  if(!html.includes(EARLY_IDENTITY_HANDLER)){
    if(html.includes("const identityTokenFlow=/#(?:invite|recovery|confirmation|email_change)_token=/")) return html;
    throw new Error('Expected legacy Netlify Identity init handler not found; refusing silent build drift.');
  }
  return html.replace(EARLY_IDENTITY_HANDLER,FIXED_IDENTITY_HANDLER);
}

export function patchIdentityTokenFlowFile(file='klantportaal.html'){
  const before=fs.readFileSync(file,'utf8');
  const after=transformIdentityTokenFlow(before);
  if(after!==before) fs.writeFileSync(file,after,'utf8');
  return {changed:after!==before};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const result=patchIdentityTokenFlowFile(process.argv[2]||'klantportaal.html');
  console.log(result.changed?'Netlify Identity token flow patched.':'Netlify Identity token flow already patched.');
}
