const root=document.documentElement;
const EXPERIENCE_VERSION='v2';
const VISUAL_SELECTOR=['#portalView [data-chart]','#portalView .chart-container','#portalView .v2visualgrid','#portalView .pvvisual','#portalView .legacy-insight-card','#portalView .adoption-card','#portalView canvas','#portalView svg'].join(',');
root.classList.add('portal-experience-v1');
root.classList.add('portal-experience-v2');

function signal(type,detail={}){
  dispatchEvent(new CustomEvent('bg:portal-experience-signal',{detail:{version:EXPERIENCE_VERSION,type,at:new Date().toISOString(),route:location.pathname+location.search,...detail}}));
}
function markReady(){
  root.dataset.portalExperience=EXPERIENCE_VERSION;
  document.body?.setAttribute('data-ui-ready','true');
  signal('experience_ready',{viewport:{width:innerWidth,height:innerHeight}});
}
function nodesFor(scope,selector){
  const nodes=[];
  if(scope?.nodeType===1 && scope.matches?.(selector)) nodes.push(scope);
  if(scope?.querySelectorAll) nodes.push(...scope.querySelectorAll(selector));
  return nodes;
}
function normalizeDynamicUi(scope=document){
  for(const el of nodesFor(scope,'button,a,input,select,textarea,[role="button"]')){
    if(!el.hasAttribute('data-interactive')) el.setAttribute('data-interactive','true');
  }
  for(const media of nodesFor(scope,'#portalView img,#portalView canvas,#portalView [data-chart],#portalView .chart-container')){
    media.setAttribute('data-responsive-media','true');
  }
  for(const visual of nodesFor(scope,VISUAL_SELECTOR)){
    if(!visual.hasAttribute('data-portal-visual')){
      const scroll=Boolean(visual.querySelector?.('table')) || /table|adoption/i.test(String(visual.className||''));
      visual.setAttribute('data-portal-visual',scroll?'scroll':'fit');
    }
  }
}
function measureVisual(node){
  if(!node?.isConnected)return;
  const target=node.matches?.('svg,canvas,img,video,table')?node:node.querySelector?.('svg,canvas,img,video,table');
  if(!target)return;
  const host=node.getBoundingClientRect();
  const child=target.getBoundingClientRect();
  const overflow=child.width-host.width>2;
  node.toggleAttribute('data-portal-visual-overflow',overflow);
  if(overflow)signal('visual_overflow',{containerWidth:Math.round(host.width),visualWidth:Math.round(child.width),className:String(node.className||'').slice(0,160)});
}
const resizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(entries=>{
  for(const entry of entries) measureVisual(entry.target);
}):null;
function observeVisuals(scope=document){
  normalizeDynamicUi(scope);
  for(const visual of nodesFor(scope,'[data-portal-visual]')){
    resizeObserver?.observe(visual);
    measureVisual(visual);
  }
}
const observer=new MutationObserver(records=>{
  for(const record of records){
    for(const node of record.addedNodes){
      if(node.nodeType===1) observeVisuals(node);
    }
  }
});
function boot(){
  observeVisuals(document);
  observer.observe(document.body,{subtree:true,childList:true});
  document.addEventListener('click',event=>{
    const control=event.target.closest?.('button,a,[role="button"]');
    if(!control)return;
    const target=control.dataset?.openPage||control.dataset?.navTarget||control.getAttribute('href')||'';
    if(target)signal('interaction',{target:String(target).slice(0,220)});
  },{passive:true});
  addEventListener('resize',()=>requestAnimationFrame(()=>document.querySelectorAll('[data-portal-visual]').forEach(measureVisual)),{passive:true});
  addEventListener('error',event=>signal('runtime_error',{message:String(event.message||'unknown').slice(0,300)}));
  addEventListener('unhandledrejection',event=>signal('runtime_rejection',{message:String(event.reason?.message||event.reason||'unknown').slice(0,300)}));
  markReady();
}
if(document.body)boot(); else document.addEventListener('DOMContentLoaded',boot,{once:true});
document.addEventListener('bg:runtime-evidence',()=>{root.dataset.runtimeEvidence='received';});
globalThis.__BG_PORTAL_EXPERIENCE__=Object.freeze({version:EXPERIENCE_VERSION,normalizeDynamicUi,measureVisual,signal});
