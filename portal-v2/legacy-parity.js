import { calculateLegacyEquivalent } from './legacy-parity-engine.js';
import { profileOverviewMetrics } from './modules/company-input.js';

export const LEGACY_CAPABILITY_MAP = Object.freeze({
  overzicht:'overzicht', profiel:'profiel', dataai:'data-ai', aiscan:'ai-scan',
  invoeren:'gegevens-invullen', antwoorden:'ingevulde-gegevens', business:'businesscase',
  cijfers:'cijfers-maatstaven', waarde:'waarde-financiering', mensen:'mensen',
  branche:'branche-markt', onderzoek:'onderzoek', beleid:'compliance-governance',
  aicap:'ai-capabilities', strategie:'strategiemodellen', canvassen:'canvassen',
  eindconclusie:'eindconclusie', dd:'due-diligence', dna:'strategy-dna',
  bijhouden:'actueel-houden', wijzigingen:'wijzigingen', advies:'advies',
  offerte:'offerte', roadmap:'roadmap'
});

export const OVERVIEW_CAPABILITIES = Object.freeze([
  ['maturity','Volwassenheidsniveau'],
  ['manual-work-annual','Handmatig werk per jaar'],
  ['fte','FTE-impact'],
  ['company-state','Bedrijfsstatus'],
  ['cmmi','Procesvolwassenheid'],
  ['adoption-curve','Adoptiecurve'],
  ['leakage','Waarde-lekkage'],
  ['blockers','Blokkades'],
  ['progress','Voortgang'],
  ['advice','Topadvies']
]);

export const GLOBAL_CAPABILITIES = Object.freeze([
  'identity-login-logout','export','import','print-permission','feedback','customer-branding','mobile-navigation'
]);

const EMPTY='—';
const nl=(value,digits=0)=>new Intl.NumberFormat('nl-NL',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(Number(value)||0);
const euro=value=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(value)||0);
const calc=(id,state)=>{try{return calculateLegacyEquivalent(id,state);}catch{return null;}};
const titleCase=value=>{const text=String(value||'').trim();return text?text.charAt(0).toUpperCase()+text.slice(1):EMPTY;};

export function overviewCapabilitySnapshot(state={}){
  const profile=state?.portal?.profile;
  const hasProfile=Boolean(profile&&typeof profile==='object'&&profile.maturity);
  const metrics=hasProfile?profileOverviewMetrics(state):null;
  const cmmi=calc('cmmi-level',state);
  const blockers=Array.isArray(calc('blocker-ranking',state))?calc('blocker-ranking',state):[];
  const advice=Array.isArray(calc('advice-priority',state))?calc('advice-priority',state):[];
  const progress=calc('progress',state);
  return Object.freeze([
    Object.freeze({id:'maturity',label:'Volwassenheidsniveau',value:metrics?`${nl(metrics.averageMaturity,1)} / 5`:EMPTY,detail:'Gebaseerd op de actuele volwassenheid per bedrijfsonderdeel.'}),
    Object.freeze({id:'manual-work-annual',label:'Handmatig werk per jaar',value:metrics?`${nl(metrics.annualManualHours)} uur`:EMPTY,detail:'46 weken als conservatieve jaarbasis.'}),
    Object.freeze({id:'fte',label:'FTE-impact',value:metrics?`${nl(metrics.fteLost,1)} FTE`:EMPTY,detail:'Beschikbare capaciteit op jaarbasis; geen cashbesparing.'}),
    Object.freeze({id:'company-state',label:'Bedrijfsstatus',value:hasProfile?titleCase(calc('company-state',state)):EMPTY,detail:'Afgeleid uit dezelfde canonieke volwassenheidsscores.'}),
    Object.freeze({id:'cmmi',label:'Procesvolwassenheid',value:cmmi?`Niveau ${cmmi}`:EMPTY,detail:cmmi?String((calc('cmmi-ladder',state)||[]).find(item=>item.huidig)?.naam||EMPTY):'Nog onvoldoende klantdata.'}),
    Object.freeze({id:'adoption-curve',label:'Adoptiecurve',value:String(state?.portal?.dataAi?.phase||EMPTY),detail:'Actuele implementatie- en adoptiefase uit dezelfde Powerhouse-state.'}),
    Object.freeze({id:'leakage',label:'Waarde-lekkage',value:metrics?euro(metrics.annualManualCost):EMPTY,detail:'Indicatieve capaciteitswaarde van handmatig werk; geen cashclaim.'}),
    Object.freeze({id:'blockers',label:'Blokkades',value:String(blockers.length),detail:blockers[0]?String(blockers[0].title||blockers[0].name||'Hoogste blokkade'):'Geen blokkades vastgelegd.'}),
    Object.freeze({id:'progress',label:'Voortgang',value:`${nl(progress)}%`,detail:'Gemiddelde voortgang van de actuele roadmap.'}),
    Object.freeze({id:'advice',label:'Topadvies',value:String(advice[0]?.title||advice[0]?.name||EMPTY),detail:'Hoogste bestaande adviesprioriteit uit Powerhouse.'})
  ]);
}

function ensureStyles(){if(document.querySelector('link[data-v2-parity-style]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='./legacy-parity.css';l.dataset.v2ParityStyle='true';document.head.appendChild(l)}
function renderOverviewParity(section,state,openPage){
  const rows=overviewCapabilitySnapshot(state);
  section.innerHTML=`<div class="sectiontitle"><div><h3>Bedrijfsbeeld</h3><p>De volledige kernset uit het oorspronkelijke portaal, live afgeleid uit dezelfde Powerhouse-state.</p></div><span>46 weken als conservatieve jaarbasis</span></div><div class="legacygrid">${rows.map(({id,label,value,detail})=>`<article data-overview-capability="${id}"><small>${label}</small><strong>${value}</strong><p>${detail}</p></article>`).join('')}</div><div class="legacyoverviewactions"><button type="button" data-legacy-open="businesscase">Open businesscase</button><button type="button" data-legacy-open="profiel">Open profiel</button><button type="button" data-legacy-open="advies">Open advies</button></div>`;
  section.querySelectorAll('[data-legacy-open]').forEach(button=>button.addEventListener('click',()=>openPage?.(button.dataset.legacyOpen)));
}
function mountOverviewParity(openPage){
  const anchor=document.querySelector('.kpis');if(!anchor)return;
  let section=document.querySelector('[data-legacy-overview]');
  if(!section){section=document.createElement('section');section.className='card legacyoverview';section.dataset.legacyOverview='true';anchor.insertAdjacentElement('afterend',section)}
  const domainState=globalThis.__BG_PORTAL_DOMAIN_STATE__;
  const paint=state=>renderOverviewParity(section,state||{},openPage);
  paint(domainState?.get?.()||{});
  domainState?.subscribe?.(snapshot=>paint(snapshot?.state||{}));
}
function bindLegacyDeepLinks(openPage){const raw=new URLSearchParams(location.search).get('legacy')||location.hash.replace(/^#/,'');const target=LEGACY_CAPABILITY_MAP[raw];if(target)requestAnimationFrame(()=>openPage(target))}
export function mountLegacyParity({openPage}){ensureStyles();mountOverviewParity(openPage);bindLegacyDeepLinks(openPage);document.querySelector('.mobilebar')?.setAttribute('data-capability','mobile-navigation')}
