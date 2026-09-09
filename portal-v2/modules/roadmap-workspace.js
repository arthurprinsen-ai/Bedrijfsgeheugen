import { mountWorkspace } from '../workspace-shell.js';
import { mountRoadmapBoard } from './roadmap-board.js';
import { mountDeliveryBoard } from './delivery-board.js';

function ensureStyles(){
 if(typeof document==='undefined')return;
 if(!document.querySelector('link[data-roadmap-board-style]')){const link=document.createElement('link');link.rel='stylesheet';link.href='./roadmap-board.css';link.dataset.roadmapBoardStyle='true';document.head.appendChild(link);}
 if(!document.querySelector('link[data-delivery-board-style]')){const link=document.createElement('link');link.rel='stylesheet';link.href='./delivery-board.css';link.dataset.deliveryBoardStyle='true';document.head.appendChild(link);}
}
function analysis(content,domainState){
 const items=domainState?.get?.('portal.roadmap.items')||[];
 const delivery=domainState?.get?.('portal.roadmap.delivery')||{};
 const features=Array.isArray(delivery.features)?delivery.features:[];
 const stories=Array.isArray(delivery.stories)?delivery.stories:[];
 const done=items.filter(item=>item.done===true).length;
 const progress=items.length?Math.round(items.reduce((sum,item)=>sum+(Number(item.progress)||0),0)/items.length):0;
 content.innerHTML=`<div class="v2profilemetrics"><article><small>Items</small><strong>${items.length}</strong></article><article><small>Afgerond</small><strong>${done}</strong></article><article><small>Gem. voortgang</small><strong>${progress}%</strong></article><article><small>Features / stories</small><strong>${features.length} / ${stories.length}</strong></article></div>`;
}
function actions(content,openPage){
 content.innerHTML='<div class="pvactions"><button type="button" class="primary" data-page="advies"><span>Naar advies</span><i>→</i></button><button type="button" data-page="strategie-naar-maandagochtend"><span>Naar strategie</span><i>→</i></button></div>';
 content.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>openPage?.(button.dataset.page)));
}
function evidence(content){
 content.innerHTML='<div class="v2reviewlist"><article><div><small>Roadmap</small><b>Kaarten herschikken en tussen sprints verplaatsen</b></div><strong>desktop + mobiel</strong></article><article><div><small>Delivery</small><b>Features tussen backlog/sprints; stories tussen features</b></div><strong>desktop + mobiel</strong></article><article><div><small>Opslag</small><b>portal.roadmap.items + portal.roadmap.delivery</b></div><strong>server-confirmed</strong></article></div>';
}
function mountPlanning(content,{domainState,onSaveStatus}){
 let mode='roadmap';
 content.innerHTML='<div class="v2roadmapmodes" role="group" aria-label="Planningweergave"><button type="button" data-roadmap-mode="roadmap" aria-pressed="true">Roadmap</button><button type="button" data-roadmap-mode="delivery" aria-pressed="false">Deliveryboard</button></div><div data-roadmap-stage></div>';
 const stage=content.querySelector('[data-roadmap-stage]');
 const render=()=>{
  content.querySelectorAll('[data-roadmap-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.roadmapMode===mode)));
  if(mode==='delivery')mountDeliveryBoard(stage,{domainState,statePath:'portal.roadmap.delivery',onSaveStatus});
  else mountRoadmapBoard(stage,{domainState,onSaveStatus});
 };
 content.querySelectorAll('[data-roadmap-mode]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.roadmapMode;render();}));
 render();
}

export function mountRoadmapWorkspace(root,{contract,view,domainState,openPage}={}){
 ensureStyles();let workspace;
 const renderTab=(tab,content)=>{
  if(tab==='analyse'){analysis(content,domainState);return;}
  if(tab==='acties'){actions(content,openPage);return;}
  if(tab==='bewijs'){evidence(content);return;}
  if(!domainState){content.innerHTML='<section class="v2tabempty"><h4>Beveiligde context laden</h4><p>De roadmap wordt beschikbaar zodra de klantcontext is geladen.</p></section>';return;}
  mountPlanning(content,{domainState,onSaveStatus:status=>workspace?.setSaveStatus(status)});
 };
 workspace=mountWorkspace(root,contract,{title:view?.title||'Roadmap',description:view?.description||'Plan initiatieven, features en user stories over backlog en sprints.',saveStatus:domainState?.status?.()||'idle',render:content=>renderTab('invullen',content),onTabChange:(tab,content)=>renderTab(tab,content)});
 workspace.shell.dataset.functionalWorkspace='roadmap';
 workspace.shell.setAttribute('data-functional-workspace','roadmap');
 return workspace;
}
