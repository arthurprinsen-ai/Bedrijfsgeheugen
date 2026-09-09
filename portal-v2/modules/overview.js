import { profileOverviewMetrics } from './company-input.js';
import { mountOverviewReorder } from './overview-reorder.js';

const nl0=value=>new Intl.NumberFormat('nl-NL',{maximumFractionDigits:0}).format(value||0);
const nl1=value=>new Intl.NumberFormat('nl-NL',{minimumFractionDigits:1,maximumFractionDigits:1}).format(value||0);
const euro=value=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(value||0);
let overviewReorderController=null;

export function overviewViewModel(state={}){
 const profile=state?.portal?.profile;
 if(!profile||typeof profile!=='object'||!profile.maturity)return null;
 const metrics=profileOverviewMetrics(state);
 return Object.freeze({
  weeksPerYear:metrics.weeksPerYear,
  capacityNotCash:metrics.capacityNotCash,
  cards:Object.freeze([
   Object.freeze({label:'Gemiddelde volwassenheid',value:`${nl1(metrics.averageMaturity)}/5`,note:'gemiddeld over 13 bedrijfsonderdelen'}),
   Object.freeze({label:'Handmatig werk per jaar',value:`${nl0(metrics.annualManualHours)} uur`,note:'46 weken als conservatieve jaarbasis'}),
   Object.freeze({label:'Vermijdbare capaciteit',value:`${nl1(metrics.fteLost)} fte`,note:'ruimte die je terugkrijgt'}),
   Object.freeze({label:'Indicatieve capaciteitswaarde',value:euro(metrics.annualManualCost),note:'capaciteitswaarde; geen cashbesparing'})
  ])
 });
}

function ensureOverviewReorder(root){
 const domainState=globalThis.__BG_PORTAL_DOMAIN_STATE__;
 if(!overviewReorderController&&domainState?.get&&domainState?.set&&root?.querySelector?.('.main'))overviewReorderController=mountOverviewReorder(root,{domainState});
 return overviewReorderController;
}

export function applyOverviewDashboard(root=document,state={}){
 ensureOverviewReorder(root);
 const model=overviewViewModel(state);
 if(!model||!root?.querySelectorAll)return false;
 const cards=[...root.querySelectorAll('.kpis .kpi')].slice(0,4);
 if(cards.length<4)return false;
 cards.forEach((card,index)=>{
  const item=model.cards[index];
  const head=card.querySelector('.kpihead');const num=card.querySelector('.num');const delta=card.querySelector('.delta');
  if(head)head.innerHTML=`<span class="kpiicon">${index===0?'◎':index===1?'◷':index===2?'↗':'€'}</span>${item.label}`;
  if(num)num.textContent=item.value;
  if(delta){delta.classList.remove('down');delta.textContent=item.note;}
  card.dataset.customerDerived='true';
 });
 return true;
}
