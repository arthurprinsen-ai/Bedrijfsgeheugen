const root=document.documentElement;
root.classList.add('portal-experience-v1');

function markReady(){
  root.dataset.portalExperience='v1';
  document.body?.setAttribute('data-ui-ready','true');
}
function normalizeDynamicUi(scope=document){
  for(const el of scope.querySelectorAll?.('button,a,input,select,textarea,[role="button"]')||[]){
    if(!el.hasAttribute('data-interactive')) el.setAttribute('data-interactive','true');
  }
  for(const media of scope.querySelectorAll?.('#portalView img,#portalView canvas,#portalView [data-chart],#portalView .chart-container')||[]){
    media.setAttribute('data-responsive-media','true');
  }
}
const observer=new MutationObserver(records=>{
  for(const record of records){
    for(const node of record.addedNodes){
      if(node.nodeType===1) normalizeDynamicUi(node);
    }
  }
});
if(document.body){
  normalizeDynamicUi();
  observer.observe(document.body,{subtree:true,childList:true});
}
document.addEventListener('DOMContentLoaded',()=>{normalizeDynamicUi();markReady();},{once:true});
document.addEventListener('bg:runtime-evidence',()=>{root.dataset.runtimeEvidence='received';});
globalThis.__BG_PORTAL_EXPERIENCE__=Object.freeze({version:'v1',normalizeDynamicUi});
