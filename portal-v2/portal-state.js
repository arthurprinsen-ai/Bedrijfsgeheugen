import { DEMO_PORTAL_STATE, DEMO_USER } from './demo-state.js';
import { createPortalProjectClient, mergeProjectState } from './project-state.js';

const API_URL='/api/portal-state';
export const PORTAL_STATE_MODES=Object.freeze(['authenticated','preview','empty','error']);

let bootReleased=false;
function installBootGuard(){
 if(!globalThis.document||document.getElementById('portalBoot'))return;
 document.documentElement.classList.add('v2-hydrating');
 const style=document.createElement('style');style.id='portalBoot';style.textContent='.v2-hydrating .app{visibility:hidden!important}.v2-hydrating body::before{content:"Portaal laden…";position:fixed;inset:0;display:grid;place-items:center;background:#f7f9fc;color:#526076;font:600 15px system-ui;z-index:2147483647}';
 document.head.appendChild(style);
}
function releaseBootGuard(){
 if(bootReleased||!globalThis.document)return;bootReleased=true;
 document.documentElement.classList.remove('v2-hydrating');
 document.getElementById('portalBoot')?.remove();
}
installBootGuard();
setTimeout(releaseBootGuard,5000);

function snapshot(mode,state=null,error=null,user=null){return Object.freeze({mode,state,error,user,updatedAt:new Date().toISOString()})}
function identityUser(identity){try{return identity?.currentUser?.()||null}catch{return null}}
async function authToken(user){try{return await user?.jwt?.()||''}catch{return''}}
const clone=value=>value==null?value:structuredClone(value);

export function isPortalDemoRoute(pathname=globalThis.window?.location?.pathname||''){
 const path=String(pathname||'').replace(/\/+$/,'')||'/';
 return path==='/portaal/demo';
}
export function isPortalCustomerRoute(pathname=globalThis.window?.location?.pathname||''){
 const path=String(pathname||'').replace(/\/+$/,'')||'/';
 return /^\/portaal\/[^/]+$/i.test(path)&&!isPortalDemoRoute(path);
}

export function ensureIdentityWidget(){
 if(globalThis.window?.netlifyIdentity)return Promise.resolve(globalThis.window.netlifyIdentity);
 if(!globalThis.document)return Promise.resolve(null);
 return new Promise(resolve=>{
  const existing=document.querySelector('script[data-v2-identity]');
  if(existing){existing.addEventListener('load',()=>resolve(globalThis.window?.netlifyIdentity||null),{once:true});return;}
  const script=document.createElement('script');
  script.src='https://identity.netlify.com/v1/netlify-identity-widget.js';
  script.async=true;script.dataset.v2Identity='true';
  script.addEventListener('load',()=>resolve(globalThis.window?.netlifyIdentity||null),{once:true});
  script.addEventListener('error',()=>resolve(null),{once:true});
  document.head.appendChild(script);
 });
}

export function createPortalStateClient({fetchImpl=globalThis.fetch,identityProvider=()=>globalThis.window?.netlifyIdentity||null,demoMode=isPortalDemoRoute(),customerMode=isPortalCustomerRoute()}={}){
 const demo=Boolean(demoMode);const customer=Boolean(customerMode);
 let demoState=demo?clone(DEMO_PORTAL_STATE):null;
 let current=snapshot('preview');
 const listeners=new Set();
 const publish=next=>{current=next;for(const fn of listeners){try{fn(current)}catch{}}releaseBootGuard();return current};
 const headersFor=async user=>{const token=await authToken(user);return token?{accept:'application/json',authorization:`Bearer ${token}`}:{accept:'application/json'}};

 async function load(){
  if(demo)return publish(snapshot('authenticated',clone(demoState),null,DEMO_USER));
  const identity=identityProvider();const user=identityUser(identity);
  if(!user)return publish(snapshot('preview',null,null,null));
  const headers=await headersFor(user);
  if(!headers.authorization)return publish(snapshot('error',null,'AUTH_TOKEN_UNAVAILABLE',user));
  try{
   const response=await fetchImpl(API_URL,{method:'GET',headers,credentials:'same-origin'});
   let state={};
   if(response.ok)state=await response.json();
   else if(response.status!==404)return publish(snapshot('error',null,`PORTAL_STATE_${response.status}`,user));
   if(customer){
    const projectClient=createPortalProjectClient({fetchImpl,getToken:()=>authToken(user)});
    try{const project=await projectClient.load();state=mergeProjectState(state,project);}catch(error){
      if(!Object.keys(state).length)return publish(snapshot('error',null,error?.message||'PORTAL_PROJECT_UNAVAILABLE',user));
    }
   }
   if(!Object.keys(state).length)return publish(snapshot('empty',null,null,user));
   return publish(snapshot('authenticated',state,null,user));
  }catch(error){return publish(snapshot('error',null,error?.message||'PORTAL_STATE_UNAVAILABLE',user))}
 }

 async function write(nextState){
  if(demo){demoState=clone(nextState||{});return publish(snapshot('authenticated',clone(demoState),null,DEMO_USER));}
  const identity=identityProvider();const user=identityUser(identity);
  if(!user)throw new Error('AUTH_REQUIRED');
  const headers=await headersFor(user);
  if(!headers.authorization)throw new Error('AUTH_TOKEN_UNAVAILABLE');
  const response=await fetchImpl(API_URL,{method:'POST',headers:{...headers,'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify(nextState||{})});
  const body=await response.json().catch(()=>({}));
  if(!response.ok||body?.stored===false)throw new Error(body?.error||`PORTAL_STATE_WRITE_${response.status}`);
  return load();
 }

 return Object.freeze({apiUrl:API_URL,isDemo:()=>demo,isCustomer:()=>customer,getSnapshot:()=>current,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},load,write,currentUser:()=>demo?DEMO_USER:identityUser(identityProvider()),authHeaders:async()=>demo?{accept:'application/json'}:headersFor(identityUser(identityProvider()))});
}
