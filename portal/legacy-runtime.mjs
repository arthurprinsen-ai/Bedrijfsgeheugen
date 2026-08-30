import { parsePortalLocation } from './core.mjs';
import { resolvePortalRoute } from './legacy-map.mjs';
import { renderLegacyBridge } from './render-legacy-bridge.mjs';
import { bindLegacyFrames } from './legacy-frame.mjs';

const NATIVE_LEGACY_WORKSPACES=new Set(['profiel','dataai','antwoorden','aiscan','business','cijfers','mensen','wijzigingen','advies','branche','onderzoek','strategie','bijhouden','roadmap','canvassen','dd','eindconclusie','waarde','beleid','aicap','dna','downloaden','afdrukken','openen','invoeren','offerte']);

const style=document.createElement('link');
style.rel='stylesheet';
style.href=new URL('./legacy-bridge.css',window.location.href).href;
document.head.append(style);

function customerSlug(){try{return new URLSearchParams(location.search).get('klant')||''}catch{return''}}
function route(){return resolvePortalRoute(parsePortalLocation(location.hash)).route}
function applyLegacyWorkspace(){
 const current=route();
 if(!current.includes('/legacy/'))return;
 const id=current.split('/legacy/')[1]||'';
 if(NATIVE_LEGACY_WORKSPACES.has(id))return;
 const main=document.querySelector('.main-content');
 if(!main)return;
 if(main.dataset.legacyRoute!==current){
  main.dataset.legacyRoute=current;
  main.innerHTML=renderLegacyBridge({route:current,customerSlug:customerSlug()});
 }
 bindLegacyFrames(main);
}
function schedule(){queueMicrotask(applyLegacyWorkspace)}
window.addEventListener('hashchange',schedule);
const root=document.getElementById('app');
if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
schedule();
