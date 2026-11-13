import { DEMO_PORTAL_STATE, DEMO_USER } from './demo-state.js';
import { createPortalProjectClient, mergeProjectState } from './project-state.js';
import { savePortalBusinessInput } from './business-input-store.js';

const API_URL='/api/portal-state';
export const PORTAL_STATE_MODES=Object.freeze(['authenticated','preview','empty','error']);
const DERIVED_READ_MODEL_KEYS=Object.freeze(['businessInputs','signals','recommendedActions','memories','audit','sourceMeta','dataAiRuntime','aiGovernance','resourceBusinessValue']);

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


/** Authoritative same-principal GET must contain every authored portal value.
 * Additional server-derived fields are allowed; missing/old submitted fields
 * (including false, 0, null and arrays) are not successful persistence.
 */
export function portalAuthoringReadbackMatches(submitted,received){
 if(submitted===undefined)return true;
 if(submitted===null||typeof submitted!=='object')return Object.is(submitted,received);
 if(Array.isArray(submitted))return Array.isArray(received)
    &&submitted.length===received.length
    &&submitted.every((value,index)=>portalAuthoringReadbackMatches(value,received[index]));
 if(!received||typeof received!=='object'||Array.isArray(received))return false;
 return Object.entries(submitted).every(([key,value])=>
   value===undefined||portalAuthoringReadbackMatches(value,received[key]));
}

export function buildPortalBusinessInput(nextState={}){
 const answers=clone(nextState||{})||{};
 for(const key of DERIVED_READ_MODEL_KEYS)delete answers[key];
 // The durable retry manifest is delivery control data, never a business
 // fact or AI-eligible source document. Keep it in authenticated server
 // Portal State, but exclude it from canonical BusinessInput answers.
 if(answers.portal&&typeof answers.portal==='object'&&!Array.isArray(answers.portal))
  delete answers.portal.__brainHandoffJournalV1;
 return Object.freeze({
  inputType:'PortalDomainStateSnapshot',
  modelId:'portal-v2-domain-state',
  instanceId:'primary',
  schemaVersion:1,
  answers,
  sourcePortal:'portal-v2',
  metadata:{scope:'portal-domain-state',writeOrder:'canonical-authority-before-portal-projection'}
 });
}

export function isPortalDemoRoute(pathname=globalThis.window?.location?.pathname||'',search=globalThis.window?.location?.search||''){
 const path=String(pathname||'').replace(/\/+$/,'')||'/';
 if(path==='/portaal/demo')return true;
 if(path!=='/klantportaal')return false;
 try{return String(new URLSearchParams(String(search||'')).get('klant')||'').toLowerCase()==='demoai'}catch{return false}
}
export function isPortalCustomerRoute(pathname=globalThis.window?.location?.pathname||''){
 const path=String(pathname||'').replace(/\/+$/,'')||'/';
 return /^\/portaal\/[^/]+$/i.test(path)&&!isPortalDemoRoute(path);
}

function installDemoAiDesign(){
 if(!globalThis.document||!isPortalDemoRoute())return;
 document.documentElement.classList.add('portal-demo-ai');
 if(document.getElementById('portalDemoAiTheme'))return;
 const link=document.createElement('link');
 link.id='portalDemoAiTheme';link.rel='stylesheet';link.href='./demoai-dashboard.css';
 document.head.appendChild(link);
}
installDemoAiDesign();

function withDemoMarker(state){
 const next=clone(state||{})||{};
 next.portal={...(next.portal||{}),klant:'demo'};
 return next;
}

let identityWidgetPromise=null;
function initializeIdentityWidget(identity){
 if(!identity)return null;
 try{identity.init?.()}catch{}
 return identity;
}
export function ensureIdentityWidget(){
 const ready=globalThis.window?.netlifyIdentity;
 if(ready)return Promise.resolve(initializeIdentityWidget(ready));
 if(!globalThis.document)return Promise.resolve(null);
 if(identityWidgetPromise)return identityWidgetPromise;
 identityWidgetPromise=new Promise(resolve=>{
  const finish=()=>resolve(initializeIdentityWidget(globalThis.window?.netlifyIdentity||null));
  const existing=document.querySelector('script[data-v2-identity]');
  if(existing){
   if(globalThis.window?.netlifyIdentity){finish();return;}
   existing.addEventListener('load',finish,{once:true});
   existing.addEventListener('error',()=>resolve(null),{once:true});
   setTimeout(finish,1500);
   return;
  }
  const script=document.createElement('script');
  script.src='https://identity.netlify.com/v1/netlify-identity-widget.js';
  script.async=true;script.dataset.v2Identity='true';
  script.addEventListener('load',finish,{once:true});
  script.addEventListener('error',()=>resolve(null),{once:true});
  document.head.appendChild(script);
 });
 return identityWidgetPromise;
}

export function createPortalStateClient({fetchImpl=globalThis.fetch,identityProvider=()=>globalThis.window?.netlifyIdentity||null,demoMode=isPortalDemoRoute(),customerMode=isPortalCustomerRoute()}={}){
 const demo=Boolean(demoMode);const customer=Boolean(customerMode);
 let demoState=demo?withDemoMarker(DEMO_PORTAL_STATE):null;
 let current=snapshot('preview');
 const listeners=new Set();
 const publish=next=>{current=next;for(const fn of listeners){try{fn(current)}catch{}}releaseBootGuard();return current};
 const headersFor=async user=>{const token=await authToken(user);return token?{accept:'application/json',authorization:`Bearer ${token}`}:{accept:'application/json'}};

 async function load(){
  if(demo)return publish(snapshot('authenticated',withDemoMarker(demoState),null,DEMO_USER));
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
  if(demo){demoState=withDemoMarker(nextState||{});return publish(snapshot('authenticated',withDemoMarker(demoState),null,DEMO_USER));}
  const identity=identityProvider();const user=identityUser(identity);
  if(!user)throw new Error('AUTH_REQUIRED');
  const headers=await headersFor(user);
  if(!headers.authorization)throw new Error('AUTH_TOKEN_UNAVAILABLE');
  await savePortalBusinessInput(buildPortalBusinessInput(nextState),{fetchFn:fetchImpl,authorization:headers.authorization});
  const response=await fetchImpl(API_URL,{method:'POST',headers:{...headers,'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify(nextState||{})});
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(body?.error||`PORTAL_STATE_WRITE_${response.status}`);
  // A 2xx response alone, an omitted stored flag, or an explicitly stale
  // projection is NOT an authenticated persistence/consumer receipt.
  if(body?.stale===true)throw new Error(body?.error||'PORTAL_STATE_STALE_PROJECTION');
  if(body?.stored!==true||body?.stale!==false)throw new Error(body?.error||'PORTAL_STATE_ACK_INCOMPLETE');
  const confirmed=await load();
  if(confirmed?.mode!=='authenticated')throw new Error('PORTAL_STATE_READBACK_NOT_AUTHENTICATED');
  // Source and projection ACKs must also match every authored root-level
  // field, not only portal.*. Derived/read-only models are deliberately
  // excluded by the original canonical BusinessInput projection. A stale
  // non-portal authored value must never be reported as saved.
  const authoredAnswers=buildPortalBusinessInput(nextState).answers;
  if(!portalAuthoringReadbackMatches(authoredAnswers,confirmed?.state))
    throw new Error('PORTAL_STATE_VALUE_READBACK_MISMATCH');
  return confirmed;
 }

 return Object.freeze({apiUrl:API_URL,isDemo:()=>demo,isCustomer:()=>customer,getSnapshot:()=>current,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},load,write,currentUser:()=>demo?DEMO_USER:identityUser(identityProvider()),authHeaders:async()=>demo?{accept:'application/json'}:headersFor(identityUser(identityProvider()))});
}
