import { mountRoadmapBoard } from './roadmap-board.js';

function ensureStyles(){
 if(typeof document==='undefined'||document.querySelector('link[data-roadmap-board-style]'))return;
 const link=document.createElement('link');link.rel='stylesheet';link.href='./roadmap-board.css';link.dataset.roadmapBoardStyle='true';document.head.appendChild(link);
}
function analysis(content,domainState){
 const items=domainState?.get?.('portal.roadmap.items')||[];
 const done=items.filter(item=>item.done===true).length;
 const progress=items.length?Math.round(items.reduce((sum,item)=>sum+(Number(item.progress)||0),0)/items.length):0;
 const owners=new Set(items.map(item=>String(item.owner||'').trim()).filter(Boolean)).size;
 content.innerHTML=`<div class="v2profilemetrics"><article><small>Items</small><strong>${items.length}</strong></article><article><small>Afgerond</small><strong>${done}</strong></article><article><small>Gem. voortgang</small><strong>${progress}%</strong></article><article><small>Eigenaren</small><strong>${owners}</strong></article></div>`;
}
function actions(content,openPage){
 content.innerHTML='<div class="pvactions"><button type="button" class="primary" data-page="advies"><span>Naar advies</span><i>→</i></button><button type="button" data-page="strategie-naar-maandagochtend"><span>Naar strategie</span><i>→</i></button></div>';
 content.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>openPage?.(button.dataset.page)));
}
function evidence(content){
 content.innerHTML='<div class="v2reviewlist"><article><div><small>Interactiemodel</small><b>Roadmapkaarten herschikken</b></div><strong>native V2</strong></article><article><div><small>Sprintplanning</small><b>Kaarten tussen 12 sprints verplaatsen</b></div><strong>desktop + mobiel</strong></article><article><div><small>Opslag</small><b>portal.roadmap.items</b></div><strong>server-confirmed</strong></article></div>';
}

export function mountRoadmapWorkspace(root,{domainState,openPage,shell,onSaveStatus}={}){
 ensureStyles();
 if(!root?.replaceChildren)throw new TypeError('ROADMAP_WORKSPACE_ROOT_REQUIRED');
 const renderTab=tab=>{
  if(tab==='analyse'){analysis(root,domainState);return;}
  if(tab==='acties'){actions(root,openPage);return;}
  if(tab==='bewijs'){evidence(root);return;}
  if(!domainState){root.innerHTML='<section class="v2tabempty"><h4>Beveiligde context laden</h4><p>De roadmap wordt beschikbaar zodra de klantcontext is geladen.</p></section>';return;}
  mountRoadmapBoard(root,{domainState,onSaveStatus});
 };
 const buttons=[...(shell?.querySelectorAll?.('[data-workspace-tab]')||[])];
 const listeners=buttons.map(button=>{
  const listener=()=>queueMicrotask(()=>renderTab(button.dataset.workspaceTab));
  button.addEventListener('click',listener);
  return [button,listener];
 });
 renderTab(shell?.dataset.activeTab||'invullen');
 return ()=>listeners.forEach(([button,listener])=>button.removeEventListener('click',listener));
}
