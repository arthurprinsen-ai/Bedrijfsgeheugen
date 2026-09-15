import { profileOverviewMetrics } from './company-input.js';
import { mountOverviewReorder } from './overview-reorder.js';
import { mountAuthenticatedCompanyCockpit } from '../company-cockpit-bootstrap.js';
import { isDemoCustomer, renderDemoOverview } from './overview-demo.js';
import { directievragenMarkup, DIRECTIEVRAGEN_STIJL } from './directievragen.js';
import { openPortalPage } from '../page-shell.js';

const nl0=value=>new Intl.NumberFormat('nl-NL',{maximumFractionDigits:0}).format(value||0);
const nl1=value=>new Intl.NumberFormat('nl-NL',{minimumFractionDigits:1,maximumFractionDigits:1}).format(value||0);
const euro=value=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(value||0);
let overviewReorderController=null;
let cockpitMounted=false;

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

function ensureCompanyCockpit(root){
 if(cockpitMounted||!root?.querySelector?.('.main'))return;
 cockpitMounted=true;
 mountAuthenticatedCompanyCockpit(root).catch(()=>{cockpitMounted=false;});
}

/**
 * Elke knop met data-pv-page opent een portalonderdeel. In de page-shell werd
 * dat per knop gebonden; alles wat ná de eerste render in het overzicht komt -
 * het demodashboard en de zes vragen - had daardoor knoppen die niets deden.
 * Deze binding hoort bij de render, niet bij het opstarten.
 */
export function bindPageButtons(scope){
 scope?.querySelectorAll?.('[data-pv-page]').forEach(btn=>{
  if(btn.dataset.pvBound==='true')return;
  btn.dataset.pvBound='true';
  btn.addEventListener('click',()=>openPortalPage(btn.dataset.pvPage));
 });
}

/**
 * De tweede knop op een vraagkaart opent diezelfde vraag in de zijbalk. Zonder
 * die verbinding zijn het twee losse lijstjes van zes; met die verbinding is het
 * eenmaal hetzelfde stuurmodel, op twee plekken zichtbaar.
 */
export function bindGroepButtons(scope){
 scope?.querySelectorAll?.('[data-dv-groep]').forEach(btn=>{
  if(btn.dataset.dvBound==='true')return;
  btn.dataset.dvBound='true';
  btn.addEventListener('click',()=>{
   const doc=btn.ownerDocument||document;
   doc.dispatchEvent(new CustomEvent('bg:open-vraag',{detail:{groep:btn.dataset.dvGroep}}));
  });
 });
}

/**
 * De zes directievragen staan boven het dashboard: een directie opent het
 * portaal met een vraag, niet met een map. Ze staan er voor elke klant, ook
 * zonder gegevens - dan tonen ze wat er nog mist in plaats van een getal.
 */
function renderDirectievragen(root,state){
 const doel=root?.querySelector?.('.main');
 if(!doel)return false;
 const doc=root.ownerDocument||document;
 if(doc.head&&!doc.getElementById('dv-stijl')){
  const tag=doc.createElement('style');tag.id='dv-stijl';tag.textContent=DIRECTIEVRAGEN_STIJL;doc.head.appendChild(tag);
 }
 let houder=doel.querySelector('.dv-houder');
 if(!houder){
  houder=doc.createElement('div');houder.className='dv-houder';
  doel.insertBefore(houder,doel.querySelector('.kpis')||doel.firstChild);
 }
 houder.innerHTML=directievragenMarkup(state);
 bindPageButtons(houder);
 bindGroepButtons(houder);
 return true;
}

export function applyOverviewDashboard(root=document,state={}){
 ensureOverviewReorder(root);
 ensureCompanyCockpit(root);
 renderDirectievragen(root,state);
 // Demo-klant krijgt het volledige dashboard volgens design; elke andere klant
 // houdt de bestaande, uit klantdata afgeleide KPI-kaarten.
 if(isDemoCustomer(state)&&renderDemoOverview(root)){bindPageButtons(root.querySelector?.('.ovz'));return true;}
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
