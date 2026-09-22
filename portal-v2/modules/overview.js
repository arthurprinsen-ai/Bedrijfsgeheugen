import { profileOverviewMetrics } from './company-input.js';
import { mountOverviewReorder } from './overview-reorder.js';
import { mountAuthenticatedCompanyCockpit } from '../company-cockpit-bootstrap.js';
import { isDemoCustomer, renderDemoOverview } from './overview-demo.js';
import { directievragenMarkup, DIRECTIEVRAGEN_STIJL } from './directievragen.js';
import { openPortalPage } from '../page-shell.js';
import { renderLegacyOverviewComplete } from './legacy-overview-complete.js';
import { mountControlPlaneCockpit } from '../control-plane-cockpit.js';
import { buildBusinessContext, BUSINESS_STAGES } from '../../brain/context/business-context-engine.mjs';

const nl0=value=>new Intl.NumberFormat('nl-NL',{maximumFractionDigits:0}).format(value||0);
const nl1=value=>new Intl.NumberFormat('nl-NL',{minimumFractionDigits:1,maximumFractionDigits:1}).format(value||0);
const euro=value=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(value||0);
let overviewReorderController=null;
let cockpitMounted=false;
let controlPlaneMountStarted=false;

const ADOPTION_STAGES=Object.freeze([
 Object.freeze({id:'bewustwording',label:'Bewustwording',min:1}),
 Object.freeze({id:'structureren',label:'Structureren',min:2}),
 Object.freeze({id:'verbinden',label:'Verbinden',min:3}),
 Object.freeze({id:'opschalen',label:'Opschalen',min:4}),
 Object.freeze({id:'borgen',label:'Borgen',min:5})
]);

export function legacyOverviewInsights(state={}){
 const profile=state?.portal?.profile||{};
 if(!profile.maturity||typeof profile.maturity!=='object')return null;
 const metrics=profileOverviewMetrics(state);
 const dimensions=PROFILE_DIMENSION_LABELS.map(([id,label])=>({id,label,level:Number(profile.maturity?.[id])||2}));
 const blockers=[...dimensions].sort((a,b)=>a.level-b.level).slice(0,3);
 const level=Math.max(1,Math.min(5,Math.round(metrics.averageMaturity)));
 const stage=ADOPTION_STAGES[level-1];
 const progress=Math.max(0,Math.min(100,Math.round((metrics.averageMaturity/5)*100)));
 return Object.freeze({level,stage,progress,blockers,averageMaturity:metrics.averageMaturity,annualManualHours:metrics.annualManualHours});
}

const PROFILE_DIMENSION_LABELS=Object.freeze([
 ['sturing','Strategie en sturing'],['commercie','Commercie en klant'],['operatie','Operatie en levering'],['finance','Finance'],['mensen','Mensen en kennis'],['analytics','Stuurinformatie'],['quality','Datakwaliteit'],['governance','Governance'],['tech','Systemen en AI'],['culture','Organisatie en cultuur'],['service','Klantenservice'],['security','Beveiliging'],['duurzaam','Duurzaamheid en CSRD']
]);

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

function ensureControlPlaneCockpit(root){
 if(controlPlaneMountStarted||!root?.querySelector?.('.main'))return;
 controlPlaneMountStarted=true;
 mountControlPlaneCockpit(root).catch(()=>{controlPlaneMountStarted=false;});
}

export function bindPageButtons(scope){
 scope?.querySelectorAll?.('[data-pv-page]').forEach(btn=>{
  if(btn.dataset.pvBound==='true')return;
  btn.dataset.pvBound='true';
  btn.addEventListener('click',()=>openPortalPage(btn.dataset.pvPage));
 });
}

function renderLegacyOverviewInsights(root,state){
 const main=root?.querySelector?.('.main');if(!main)return false;
 let section=main.querySelector('[data-legacy-overview-insights]');
 if(!section){section=(root.ownerDocument||document).createElement('section');section.className='legacy-overview-insights';section.dataset.legacyOverviewInsights='true';const anchor=main.querySelector('.dashboard')||main.querySelector('.lower');main.insertBefore(section,anchor||null);}
 const model=legacyOverviewInsights(state);
 if(!model){section.innerHTML=`<article class="legacy-insight-card company-state"><div class="legacy-insight-head"><span>Stand van je bedrijf</span><strong>CMMI —/5</strong></div><h3>Nog niet ingevuld</h3><p>Vul het organisatieprofiel in om de actuele volwassenheid en voortgang te berekenen.</p><div class="legacy-progress"><i style="width:0%"></i></div></article><article class="legacy-insight-card adoption-card"><div class="legacy-insight-head"><span>Adoptiecurve</span><strong>Nog niet bepaald</strong></div><div class="adoption-curve">${ADOPTION_STAGES.map((item,index)=>`<div class="adoption-step"><i></i><b>${item.label}</b><small>Niveau ${index+1}</small></div>`).join('')}</div></article><article class="legacy-insight-card blockers-card"><div class="legacy-insight-head"><span>Waar organisatie staat</span><strong>Onbekend</strong></div><div class="legacy-blockers"><button type="button" data-pv-page="profiel"><span>Organisatieprofiel aanvullen</span><strong>→</strong></button></div><p>Blokkades en aandachtspunten worden pas berekend uit expliciete klantinvoer.</p></article>`;bindPageButtons(section);return true;}
 section.innerHTML=`<article class="legacy-insight-card company-state"><div class="legacy-insight-head"><span>Stand van je bedrijf</span><strong>CMMI ${model.level}/5</strong></div><h3>${model.stage.label}</h3><p>Gemiddelde volwassenheid ${nl1(model.averageMaturity)}/5 · ${model.progress}% op de volwassenheidsladder.</p><div class="legacy-progress"><i style="width:${model.progress}%"></i></div></article><article class="legacy-insight-card adoption-card"><div class="legacy-insight-head"><span>Adoptiecurve</span><strong>${model.stage.label}</strong></div><div class="adoption-curve">${ADOPTION_STAGES.map((item,index)=>`<div class="adoption-step ${index+1<=model.level?'active':''} ${index+1===model.level?'current':''}"><i></i><b>${item.label}</b><small>Niveau ${index+1}</small></div>`).join('')}</div></article><article class="legacy-insight-card blockers-card"><div class="legacy-insight-head"><span>Waar organisatie staat</span><strong>${model.blockers.length} aandachtspunten</strong></div><div class="legacy-blockers">${model.blockers.map(item=>`<button type="button" data-pv-page="profiel"><span>${item.label}</span><strong>${item.level}/5</strong></button>`).join('')}</div><p>${nl0(model.annualManualHours)} uur handmatig werk per jaar op basis van de huidige invoer.</p></article>`;
 bindPageButtons(section);
 return true;
}


function renderBusinessJourneyOverview(root,state){
 const main=root?.querySelector?.('.main');if(!main)return false;
 const context=buildBusinessContext(state);
 let section=main.querySelector('[data-business-journey-overview]');
 if(!section){section=(root.ownerDocument||document).createElement('section');section.dataset.businessJourneyOverview='true';section.className='business-journey-overview';const anchor=main.querySelector('[data-legacy-overview-insights]')||main.querySelector('.dashboard');anchor?.after?.(section);}
 const target=context.targetJourney?.target;
 const targetLabel=target?BUSINESS_STAGES[target]?.label||target:'Nog niet gekozen';
 const forecasts=context.goalForecasts||[];
 const forecastRows=forecasts.slice(0,3).map(item=>{
   const progress=item.progress==null?'—':Math.round(item.progress)+'%';
   const status=({ 'on-track':'Op koers','at-risk':'Risico','off-track':'Niet op koers'})[item.trackStatus]||'Nog geen forecast';
   return '<div class="bjo-goal"><span><b>'+item.label+'</b><small>'+progress+' · '+status+'</small></span><i style="width:'+(item.progress==null?0:Math.round(item.progress))+'%"></i></div>';
 }).join('');
 section.innerHTML='<article><div class="bjo-head"><div><span>Bedrijfsreis</span><h3>'+(context.evidenceMode==='unproven-default'?'Fase nog niet bevestigd':context.primary.label)+'</h3></div><button type="button" data-pv-page="bedrijfssituatie">Open reis →</button></div><div class="bjo-route"><span>Nu</span><b>'+context.primary.label+'</b><em>→</em><span>Doel</span><b>'+targetLabel+'</b></div><div class="bjo-goals">'+(forecastRows||'<p>Leg doelen vast om voortgang en forecast hier te volgen.</p>')+'</div></article>';
 bindPageButtons(section);
 return true;
}

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
  const insights=doel.querySelector('[data-legacy-overview-insights]');
  const lower=doel.querySelector('.lower');
  if(insights?.parentNode===doel)insights.after(houder);
  else if(lower?.parentNode===doel)lower.after(houder);
  else doel.appendChild(houder);
 }
 houder.innerHTML=directievragenMarkup(state);
 bindPageButtons(houder);
 return true;
}

export function applyOverviewDashboard(root=document,state={}){
 ensureCompanyCockpit(root);
 ensureControlPlaneCockpit(root);
 renderLegacyOverviewComplete(root,state,openPortalPage,globalThis.__BG_PORTAL_DOMAIN_STATE__);
 renderLegacyOverviewInsights(root,state);
 renderBusinessJourneyOverview(root,state);
 renderDirectievragen(root,state);
 ensureOverviewReorder(root);
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
