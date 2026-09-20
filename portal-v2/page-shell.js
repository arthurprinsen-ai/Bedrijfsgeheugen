import { findPage, listPortalGroups } from './page-registry.js';
import { nativePageContent } from './native-pages.js';
import { pageVisual } from './page-visuals.js';
import { mountAskPortal } from './ask-portal.js';
import { mountChangeWizard } from './modules/change-wizard.js';
import { loadRuntimeEvidence } from './runtime-evidence.js';
import { renderCsrdImpact, impactSnapshotFromPortalState } from './csrd-impact.js';
import { renderStrategyDna } from './strategy-dna.js';
import { mountConnectorWizard } from '../assets/js/koppelingen/view.js';
import { getCapabilityContract } from './capability-contracts.js';
import { mountWorkspace } from './workspace-shell.js';
import { mountCompanyInput, renderProfileAnalysis } from './modules/company-input.js';
import { mountDeliveryWorkspace } from './modules/delivery-workspace.js';
import { mountFunctionalWorkspace, listFunctionalSuitePages } from './modules/functional-suite.js';
import { mountAiCapabilityWorkspace } from './modules/ai-capability-workspace.js';
import { mountExecutionLadderWorkspace } from './modules/execution-ladder-workspace.js';
import { mountRoadmapWorkspace } from './modules/roadmap-workspace.js';
import { mountEntrepreneurIntelligence } from './modules/entrepreneur-intelligence.js';
import { mountLegacyExternalPlacements } from './modules/legacy-external-placements.js';
import { mountPowerhouseObservability } from './modules/powerhouse-observability.js';
import { mountTrustedAdvisorAssurance } from './trusted-advisor-assurance.js';

const COPY = {
  overzicht:['Overzicht','De centrale cockpit met gezondheid, voortgang, kansen, risico’s, acties en impact.'],
  profiel:['Profiel per onderdeel','Bekijk de actuele stand per bedrijfsdomein, inclusief onderbouwing, risico’s en aanbevolen vervolgstappen.'],
  'data-ai':['Data en AI','Breng bronnen, datakwaliteit, AI-kansen en uitvoerbare verbeteringen samen.'],
  'trust-center':['AI Trust Center','Controleer waarop Powerhouse vertrouwt: bronnen, actualiteit, bewijs, onzekerheid, verificatie en audittrail.'],
  'ai-scan':['AI-scan: kansenkaart','Prioriteer AI-kansen op waarde, haalbaarheid, risico en benodigde data.'],
  kansenkaart:['Kansenkaart','Eén overzicht van commerciële, operationele en digitale verbeterkansen.'],
  'csrd-impact':['CSRD & Impact','Van CO₂, water en circulariteit tot social, governance, readiness, acties en auditbewijs in één klantwaardige impactcockpit.'],
  'gegevens-invullen':['Je gegevens invullen','Vul ontbrekende bedrijfscontext direct in V2 aan en zie onmiddellijk wat dat verandert in scores, risico’s en advies.'],
  'ingevulde-gegevens':['Wat je hebt ingevuld','Controleer alle vastgelegde bedrijfsgegevens, bron, eigenaar, actualiteit en volledigheid.'],
  businesscase:['Businesscase','Vertaal verbeterkansen naar investering, baten, tijdwinst, risico en terugverdientijd.'],
  'cijfers-maatstaven':['Cijfers en maatstaven','Vergelijk KPI’s, benchmarks en trends en maak afwijkingen direct bespreekbaar.'],
  'waarde-financiering':['Waarde en financiering','Maak financiële waarde, scenario’s, investeringsruimte en financieringsimpact zichtbaar.'],
  mensen:['Mensen','Breng rollen, capaciteit, expertise, afhankelijkheden en kennisrisico’s in kaart.'],
  'branche-markt':['Branche en markt','Vergelijk de organisatie met marktontwikkelingen, concurrentie en relevante benchmarks.'],
  onderzoek:['Onderzoek','Bundel analyses, hypotheses, bevindingen, bronnen en conclusies in één traceerbaar overzicht.'],
  ondernemersdata:['Actueel & externe data','Zie wat er buiten je bedrijf verandert: wetgeving, arbeidsmarkt, subsidies, economie, branche, AI en technologie.'],
  'wet-regelgeving':['Wet- & regelgeving','Volg wettelijke verplichtingen, toepasselijkheid, mijlpalen, deadlines, bron en laatste controle.'],
  'arbeidsmarkt-personeel':['Arbeidsmarkt & personeel','Volg UWV-, CBS- en andere arbeidsmarktsignalen die personeelsplanning, schaarste, verzuim en lonen kunnen raken.'],
  'subsidies-regelingen':['Subsidies & regelingen','Volg RVO-regelingen, subsidies en relevante ondernemersregelingen vanuit de bron.'],
  'economie-branche-actueel':['Economie & branche','Volg CBS-, DNB-, Eurostat- en branchesignalen voor planning, benchmark en besluitvorming.'],
  'ai-technologie-actueel':['AI & technologie','Volg veranderingen rond AI, data, cyber, digitalisering en technologie die kansen of verplichtingen kunnen creëren.'],
  deadlines:['Deadlines','Zie komende wettelijke mijlpalen en externe signalen met een concrete datum in één tijdlijn.'],
  bronnenbibliotheek:['Bronnenbibliotheek','Doorzoek en controleer de externe publicaties waarop analyses en signalen zijn gebaseerd.'],
  'compliance-governance':['Compliance, security en governance','Volg verplichtingen, controls, risico’s, bewijs en acties voor onder meer AI Act, NIS2, privacy en security.'],
  'compliance-command-center':['Compliance Command Center','Eén operationele cockpit voor compliance-readiness, bewijs, open risico’s en auditacties.'],
  'ai-capabilities':['AI-capabilities','Zie welke AI-capabilities beschikbaar, gewenst, verantwoord en aantoonbaar operationeel zijn.'],
  'strategy-dna':['Strategy DNA','Leg ambitie, klantbelofte, strategische keuzes, capabilities, bewijs en uitvoeringsritme vast en vertaal dit direct naar uitvoering.'],
  strategiemodellen:['Strategiemodellen','Gebruik strategische modellen binnen dezelfde V2-context en koppel ze direct aan uitvoering.'],
  modellen:['Alle modellen','Werk met alle relevante analyse- en beslismodellen zonder het portaal te verlaten.'],
  canvassen:['Canvassen','Leg strategie, organisatie, klantwaarde en uitvoering vast in interactieve canvassen.'],
  eindconclusie:['De eindconclusie','Vat bewijs, analyses, risico’s, kansen en prioriteiten samen tot één bestuurlijke conclusie.'],
  'due-diligence':['Due diligence','Onderzoek organisatie, data, processen, technologie, risico’s en verbeterpotentieel vanuit één V2-dossier.'],
  exit:['Exit','Maak overdraagbaarheid, afhankelijkheden, risico’s, waardedrijvers en exit-readiness zichtbaar.'],
  'strategie-naar-maandagochtend':['Van strategie naar maandagochtend','Vertaal richting naar concrete thema’s, capabilities, processen, systemen, data, acties en outcomes.'],
  'actueel-houden':['Actueel houden','Laat zien welke informatie veroudert, wie eigenaar is en welke update nodig is.'],
  wijzigingen:['Wijzigingen','Volg wat veranderde, welk onderdeel geraakt wordt en welke opvolging nodig is.'],
  advies:['Advies','Zet analyse om in geprioriteerd, uitlegbaar en uitvoerbaar advies met eigenaar en bewijs.'],
  offerte:['Offerte','Vertaal scope en gewenste uitkomst naar een concrete aanpak en voorstel.'],
  roadmap:['Roadmap','Plan initiatieven, afhankelijkheden, mijlpalen, voortgang en gerealiseerde waarde.'],
  uitvoeringsladder:['Uitvoeringsladder','Maak zichtbaar waar een onderwerp staat van tellen en vastleggen tot koppelen, meten, borgen en resultaat.'],
  'taken-werkstromen':['Taken & werkstromen','Stuur acties, eigenaren, deadlines, afhankelijkheden, status en bewijs vanuit V2.'],
  koppelingen:['Koppelingen','Beheer databronnen en systemen als native onderdeel van V2, inclusief readiness, synchronisatie, foutstatus en evidence.'],
  gebruikers:['Gebruikers','Beheer gebruikers, rollen, rechten en verantwoordelijkheden binnen V2.'],
  documenten:['Documenten','Beheer bedrijfsdocumenten, metadata, actualiteit, bron, eigenaar en AI-verwerking in V2.'],
  instellingen:['Instellingen','Beheer organisatie-, portaal-, notificatie-, data- en governance-instellingen vanuit één plek.'],
  audit:['Audit','Maak besluiten, wijzigingen, bewijs, controles en verantwoordelijkheden auditbaar.'],
  bronnenstatus:['Bronnenstatus','Zie welke bronnen beschikbaar zijn, welke aandacht vragen en waar bewijs ontbreekt.'],
  datahubstatus:['Datahubstatus','Volg structurering, verrijking en verbinding van bedrijfsdata zonder onbewezen live-status te tonen.'],
  'brain-verwerking':['Brain-verwerking','Maak zichtbaar wat het bedrijfsbrein met context doet: begrijpen, verbinden, prioriteren en adviseren.'],
  agentstatus:['Agentstatus','Overzicht van agents, hun taakgebied en hun aantoonbare uitvoeringsstatus.'],
  'powerhouse-control-center':['Powerhouse Control Center','Volg dagelijks wat AI, chats, agents, workflows en infrastructuur doen: activiteit, fouten, learnings, skills, delivery, kosten en bewijs in één filterbare cockpit.'],
  'actieve-acties':['Actieve acties','Van inzicht naar concrete uitvoering, eigenaar, voortgang en bewijs.'],
  'recovery-obligations':['Open recovery obligations','Elke containment of blokkade blijft zichtbaar totdat root cause, fix, test en heractivatie aantoonbaar gesloten zijn.'],
  'outcomes-evidence':['Outcomes & evidence','Koppel acties aan gemeten resultaat en bewijs zodat effect niet op aannames rust.'],
  'learning-writeback':['Learning/writeback','Zet geverifieerde outcomes om in herbruikbare learnings voor volgende beslissingen.'],
  'self-heal':['Self-heal / recovery','Detecteer problemen, herstel binnen grenzen, verifieer en heractiveer gecontroleerd.'],
  audittrail:['Audittrail','Maak besluiten, acties, wijzigingen en bewijs terugvindbaar in één traceerbare keten.']
};

const BRAIN_PAGES=new Set(['bronnenstatus','datahubstatus','brain-verwerking','agentstatus','powerhouse-control-center','actieve-acties','recovery-obligations','outcomes-evidence','learning-writeback','self-heal','audittrail']);
const COMPANY_INPUT_PAGES=new Set(['profiel','gegevens-invullen','ingevulde-gegevens']);
const ENTREPRENEUR_DATA_PAGES=new Set(['ondernemersdata','wet-regelgeving','arbeidsmarkt-personeel','subsidies-regelingen','economie-branche-actueel','ai-technologie-actueel','deadlines','bronnenbibliotheek']);
const FUNCTIONAL_SUITE_PAGES=new Set(listFunctionalSuitePages());
const LEGACY_EXTERNAL_CONTEXT_PAGES=new Set(['mensen','branche-markt','onderzoek','compliance-governance']);
const portalContext={domainState:null};

export function configurePortalShell(context={}){
  portalContext.domainState=context.domainState||null;
  return portalContext;
}

/* De Brein- en Powerhouse-pagina's tonen niets zolang er geen runtime-evidence
   is. Die evidence komt uit de projectie van de operating loop. Eén keer per
   sessie ophalen; faalt het, dan blijven die pagina's eerlijk leeg. */
let runtimeGeladen=false;
function ensureRuntimeEvidence(){
  if(runtimeGeladen||!portalContext.domainState)return;
  runtimeGeladen=true;
  loadRuntimeEvidence({domainState:portalContext.domainState}).then(runtime=>{
    if(runtime&&typeof document!=='undefined')document.dispatchEvent(new CustomEvent('bg:runtime-evidence'));
  });
}

function portalStateSnapshot(){
  try{return portalContext.domainState?.get?.()||globalThis.__BG_PORTAL_DOMAIN_STATE__?.get?.()||{};}catch{return {};}
}

export function pagePresentation(pageId, state) {
  const page=findPage(pageId);
  if(!page) return null;
  const [title,description]=COPY[pageId] || [page.label,`${page.label} is een standaardonderdeel van Portal V2.`];
  const model=state ?? portalStateSnapshot();
  const content=nativePageContent(pageId, model) || {};
  const visual=pageVisual(pageId, model);
  return {
    ...page,
    ...content,
    visual,
    title,
    description,
    kind:'native-v2',
    evidenceLabel: pageId==='csrd-impact'
      ? 'Impactdata + evidence in één traceerbare cockpit'
      : BRAIN_PAGES.has(pageId)
        ? 'Native Portal V2 · status alleen met runtime-evidence'
        : content.derived
          ? 'Native Portal V2 · cijfers berekend op je eigen gegevens'
          : 'Native Portal V2 · nog geen eigen gegevens ingevuld'
  };
}

export function searchPortalPages(term='') {
  const q=String(term).trim().toLocaleLowerCase('nl');
  const pages=listPortalGroups().flatMap(group=>group.pages.map(page=>({...page,groupLabel:group.label})));
  if(!q) return pages.slice(0,12);
  return pages.filter(page=>`${page.label} ${page.groupLabel} ${page.id}`.toLocaleLowerCase('nl').includes(q)).slice(0,12);
}

function ensureShell(){
  let root=document.getElementById('portalView');
  if(root) return root;
  root=document.createElement('div');
  root.id='portalView';root.className='portalview';root.setAttribute('aria-hidden','true');
  root.innerHTML=`<div class="pvbackdrop" data-close></div><section class="pvpanel" role="dialog" aria-modal="true" aria-labelledby="pvTitle"><header class="pvhead"><div><span class="pvkicker" id="pvKicker">Portal V2</span><h2 id="pvTitle">Onderdeel</h2><p id="pvDescription"></p></div><button class="pvclose" type="button" data-close aria-label="Sluiten">×</button></header><nav class="pvglobalnav" aria-label="Algemene portaalnavigatie"><button type="button" data-pv-global-page="overzicht">Overzicht</button><button type="button" data-pv-global-page="profiel">Organisatie</button><button type="button" data-pv-global-page="cijfers-maatstaven">Cijfers</button><button type="button" data-pv-global-page="data-ai">Data & AI</button><button type="button" data-pv-global-page="koppelingen">Koppelingen</button><button type="button" data-pv-global-page="strategiemodellen">Strategie</button><button type="button" data-pv-global-page="advies">Advies</button><button type="button" data-pv-global-page="roadmap">Roadmap</button><button type="button" data-pv-global-page="actueel-houden">Actueel houden</button><button type="button" data-pv-global-page="ondernemersdata">Actueel & extern</button></nav><div class="pvbody"><div class="pvstatus"><span class="pvdot"></span><strong id="pvStatus"></strong></div><div class="pvnative" id="pvNative"></div></div></section>`;
  document.body.appendChild(root);
  root.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click',closePortalPage));
  root.querySelectorAll('[data-pv-global-page]').forEach(btn=>btn.addEventListener('click',()=>{
    const target=btn.dataset.pvGlobalPage;
    if(target==='overzicht'){closePortalPage();globalThis.dispatchEvent?.(new CustomEvent('bg:portal-overview'));return;}
    openPortalPage(target);
  }));
  return root;
}

export function closePortalPage(){
  const root=document.getElementById('portalView');if(!root)return;
  root.classList.remove('open','impact-mode');root.setAttribute('aria-hidden','true');
  document.documentElement.classList.remove('portalview-open');
}

function impactSummary(impact){
  const changes=Array.isArray(impact?.changes)?impact.changes:[];
  const preferred=changes.find(x=>x.unit==='money')||changes.find(x=>x.unit==='fte')||changes.find(x=>x.unit==='months')||changes.find(x=>x.unit==='percent')||changes[0];
  if(!preferred)return impact?.advice?.added?.length||impact?.advice?.removed?.length
    ? `Advies opnieuw bepaald · +${impact.advice.added.length}/-${impact.advice.removed.length}`
    : 'Afhankelijke onderdelen opnieuw doorgerekend';
  const delta=Number(preferred.delta);
  const signed=Number.isFinite(delta)?`${delta>0?'+':''}${delta.toLocaleString('nl-NL',{maximumFractionDigits:1})}`:'gewijzigd';
  const unit=preferred.unit==='money'?'€':preferred.unit==='fte'?'fte':preferred.unit==='months'?'mnd':preferred.unit==='percent'?'%-punt':preferred.unit;
  return `${preferred.id}: ${signed} ${unit} · ${impact.affectedPages?.length||0} onderdelen geraakt`;
}

function esc(value=''){
  return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function renderMetrics(block){return `<section class="pvmodule pvmetrics" data-derived="${block.derived?'true':'false'}"><div class="pvmodulehead"><span>01</span><h3>${esc(block.title)}</h3></div><div class="pvmetricgrid">${block.items.map(([label,value])=>`<article><small>${esc(label)}</small><strong>${esc(value)}</strong></article>`).join('')}</div></section>`;}
function renderWorklist(block){return `<section class="pvmodule"><div class="pvmodulehead"><span>02</span><h3>${esc(block.title)}</h3></div><div class="pvworklist">${block.items.map(([label,value])=>`<article><div><b>${esc(label)}</b><p>${esc(value)}</p></div><span>→</span></article>`).join('')}</div></section>`;}
function renderActions(block){return `<section class="pvmodule"><div class="pvmodulehead"><span>03</span><h3>${esc(block.title)}</h3></div><div class="pvactions">${block.items.map(([label,pageId],index)=>`<button type="button" data-pv-page="${esc(pageId)}" class="${index===0?'primary':''}"><span>${esc(label)}</span><i>→</i></button>`).join('')}</div></section>`;}

function renderEmpty(block){return `<section class="pvmodule pvempty"><div class="pvmodulehead"><span>—</span><h3>${esc(block.title)}</h3></div><p class="pvemptycopy">${esc(block.copy)}</p></section>`;}

function renderNative(native,view){
  const blocks=Array.isArray(view.blocks)?view.blocks:[];
  const visual=view.visual?`<section class="pvmodule pvvisual"><div class="pvmodulehead"><span>◷</span><h3>Beeld bij deze cijfers</h3></div><div class="v2visualgrid">${view.visual}</div></section>`:'';
  native.innerHTML=`<div class="pvnativehero"><div><span>Zelfstandig onderdeel</span><h3>${esc(view.title)}</h3><p>${esc(view.description)}</p></div><button type="button" class="pvprimary">${esc(view.primaryAction || 'Open onderdeel')} <span>→</span></button></div>${blocks.map(block=>block.type==='metrics'?renderMetrics(block):block.type==='worklist'?renderWorklist(block):block.type==='empty'?renderEmpty(block):block.type==='actions'?renderActions(block):'').join('')}${visual}<div class="pvevidence"><b>Herkomst van deze cijfers</b><p>${view.derived?'Alle getallen hierboven zijn berekend op je eigen ingevoerde gegevens, met dezelfde formules als het vorige portaal.':'Er staan nog geen eigen gegevens in dit onderdeel. Het portaal toont bewust geen voorbeeldcijfers.'}</p></div>`;
  native.querySelectorAll('[data-pv-page]').forEach(btn=>btn.addEventListener('click',()=>openPortalPage(btn.dataset.pvPage)));
  native.querySelector('.pvprimary')?.addEventListener('click',()=>{
    const first=blocks.find(block=>block.type==='actions')?.items?.[0]?.[1];
    if(first) openPortalPage(first);
  });
}

function renderCompanyWorkspace(native,contract,view,pageId){
  const domainState=portalContext.domainState;
  let workspace;
  const empty=(content,title,copy)=>{content.innerHTML=`<section class="v2tabempty"><h4>${esc(title)}</h4><p>${esc(copy)}</p></section>`;};
  const renderTab=(tab,content)=>{
    if(tab==='analyse'){renderProfileAnalysis(content,{domainState});return;}
    if(tab==='acties'){
      content.innerHTML='<div class="pvactions"><button type="button" data-pv-page="businesscase" class="primary"><span>Open businesscase</span><i>→</i></button><button type="button" data-pv-page="advies"><span>Naar advies</span><i>→</i></button><button type="button" data-pv-page="roadmap"><span>Naar roadmap</span><i>→</i></button></div>';
      content.querySelectorAll('[data-pv-page]').forEach(btn=>btn.addEventListener('click',()=>openPortalPage(btn.dataset.pvPage)));
      return;
    }
    if(tab==='bewijs'){
      mountCompanyInput(content,{pageId:'ingevulde-gegevens',domainState});
      return;
    }
    if(!domainState){empty(content,'Beveiligde context laden','De invoerwerkruimte wordt beschikbaar zodra je klantcontext is geladen.');return;}
    mountCompanyInput(content,{pageId,domainState,onSaveStatus:status=>workspace?.setSaveStatus(status)});
  };
  workspace=mountWorkspace(native,contract,{
    title:view.title,
    description:view.description,
    saveStatus:domainState?.status?.()||'idle',
    render:content=>renderTab('invullen',content),
    onTabChange:(tab,content)=>renderTab(tab,content)
  });
}

function renderAiCapabilitiesWorkspace(native,contract,view){
  const domainState=portalContext.domainState;
  let workspace;
  const renderTab=(tab,content)=>{
    if(tab==='invullen'){
      mountAiCapabilityWorkspace(content,{domainState,onSaveStatus:status=>workspace?.setSaveStatus(status)});
      return;
    }
    const state=domainState?.get?.()||{};
    const values=Object.values(state?.portal?.aiCapabilities||{}).map(Number).filter(value=>Number.isFinite(value)&&value>0);
    const scanned=Object.values(state?.portal?.aiCapabilitySources||{}).filter(Boolean).length;
    if(tab==='analyse'){
      const average=values.length?(values.reduce((sum,value)=>sum+value,0)/values.length).toFixed(1):'—';
      content.innerHTML=`<section class="pvmodule"><div class="pvmodulehead"><span>AI</span><h3>Capability-analyse</h3></div><div class="pvmetricgrid"><article><small>Ingevulde capabilities</small><strong>${values.length}/86</strong></article><article><small>Gemiddelde score</small><strong>${average}</strong></article><article><small>Uit scan onderbouwd</small><strong>${scanned}</strong></article></div></section>`;
      return;
    }
    if(tab==='acties'){
      content.innerHTML='<div class="pvactions"><button type="button" data-pv-page="ai-scan" class="primary"><span>Open AI-scan</span><i>→</i></button><button type="button" data-pv-page="roadmap"><span>Vertaal naar roadmap</span><i>→</i></button></div>';
      content.querySelectorAll('[data-pv-page]').forEach(btn=>btn.addEventListener('click',()=>openPortalPage(btn.dataset.pvPage)));
      return;
    }
    content.innerHTML=`<section class="pvmodule"><div class="pvmodulehead"><span>✓</span><h3>Bewijs & herkomst</h3></div><p>Scores worden tenant-scoped opgeslagen in <code>${esc(contract.dataSlice)}</code>. ${values.length} capabilities hebben een vastgelegde score; ${scanned} daarvan hebben scanherkomst. Onbekende waarden blijven bewust leeg.</p></section>`;
  };
  workspace=mountWorkspace(native,contract,{
    title:view.title,
    description:view.description,
    saveStatus:domainState?.status?.()||'idle',
    delegate:false,
    attachLegacyParity:true,
    render:content=>renderTab('invullen',content),
    onTabChange:(tab,content)=>renderTab(tab,content)
  });
}

export function openPortalPage(pageId){
  const view=pagePresentation(pageId);if(!view)return false;
  const root=ensureShell();
  root.classList.toggle('impact-mode',pageId==='csrd-impact');
  // De kicker hoort bij de pagina, niet bij de zijbalkgroep: de indeling van de
  // zijbalk mag veranderen zonder dat een breinpagina zijn kop kwijtraakt.
  root.querySelector('#pvKicker').textContent=BRAIN_PAGES.has(pageId)?'Brein & Powerhouse':'Portal V2';
  root.querySelector('#pvTitle').textContent=view.title;
  root.querySelector('#pvDescription').textContent=view.description;
  root.querySelector('#pvStatus').textContent=view.evidenceLabel;
  root.dataset.pageId=pageId;
  root.querySelectorAll('[data-pv-global-page]').forEach(btn=>btn.classList.toggle('active',btn.dataset.pvGlobalPage===pageId));
  const native=root.querySelector('#pvNative');
  const contract=getCapabilityContract(pageId);
  if(pageId==='csrd-impact'){
    const snapshot=impactSnapshotFromPortalState(portalStateSnapshot());
    renderCsrdImpact(native,{openPage:openPortalPage,closePage:closePortalPage,snapshot});
  }
  else if(pageId==='strategy-dna') renderStrategyDna(native,{openPage:openPortalPage});
  else if(ENTREPRENEUR_DATA_PAGES.has(pageId)){native.innerHTML='';mountEntrepreneurIntelligence(native,{pageId,openPage:openPortalPage});}
  else if(pageId==='koppelingen'){native.innerHTML='';mountConnectorWizard(native);}
  else if(pageId==='powerhouse-control-center'){native.innerHTML='';mountPowerhouseObservability(native,{domainState:portalContext.domainState});}
  else if(pageId==='taken-werkstromen')mountDeliveryWorkspace(native,{domainState:portalContext.domainState,openPage:openPortalPage,title:view.title,description:view.description});
  else if(COMPANY_INPUT_PAGES.has(pageId)&&contract?.legacyCapability)renderCompanyWorkspace(native,contract,view,pageId);
  else if(['strategiemodellen','modellen'].includes(pageId)&&contract)mountWorkspace(native,contract,{title:view.title,description:view.description,saveStatus:portalContext.domainState?.status?.()||'idle'});
  else if(pageId==='canvassen'&&contract?.legacyCapability)mountWorkspace(native,contract,{title:view.title,description:view.description,saveStatus:portalContext.domainState?.status?.()||'idle'});
  else if(pageId==='roadmap'&&contract?.legacyCapability){
    native.innerHTML='';
    const shell=mountWorkspace(native,contract,{title:view.title,description:view.description,saveStatus:portalContext.domainState?.status?.()||'idle',delegate:false,attachLegacyParity:true});
    mountRoadmapWorkspace(shell.content||native,{domainState:portalContext.domainState,openPage:openPortalPage,shell:shell.shell,onSaveStatus:status=>shell.setSaveStatus?.(status)});
  }
  else if(pageId==='ai-capabilities'&&contract?.legacyCapability)renderAiCapabilitiesWorkspace(native,contract,view);
  else if(pageId==='uitvoeringsladder'&&contract?.legacyCapability){native.innerHTML='';mountExecutionLadderWorkspace(native,{domainState:portalContext.domainState,openPage:openPortalPage,onSaveStatus:()=>{}});}
  else if(FUNCTIONAL_SUITE_PAGES.has(pageId)&&contract?.legacyCapability)mountFunctionalWorkspace(native,{pageId,contract,view,domainState:portalContext.domainState,openPage:openPortalPage});
  else if(contract?.legacyCapability){
    mountWorkspace(native,contract,{title:view.title,description:view.description,saveStatus:'idle',render:content=>renderNative(content,view)});
  } else renderNative(native,view);
  if(LEGACY_EXTERNAL_CONTEXT_PAGES.has(pageId)){
    mountLegacyExternalPlacements(native,{pageId,state:portalStateSnapshot()});
  }
  if(pageId==='wijzigingen'&&portalContext.domainState?.get){
    const wizard=document.createElement('div');
    native.prepend(wizard);
    mountChangeWizard(wizard,{domainState:portalContext.domainState,onSaved:()=>openPortalPage('wijzigingen')});
  }
  ensureRuntimeEvidence();
  mountTrustedAdvisorAssurance(root.querySelector('.pvbody'),{pageId,state:portalStateSnapshot(),openPage:openPortalPage});
  mountAskPortal(root.querySelector('.pvbody'),{currentPage:()=>pageId});
  root.classList.add('open');root.setAttribute('aria-hidden','false');document.documentElement.classList.add('portalview-open');
  return true;
}

function bindTextButton(selector,needle,pageId){
  [...document.querySelectorAll(selector)].find(btn=>btn.textContent.toLocaleLowerCase('nl').includes(needle))?.addEventListener('click',()=>openPortalPage(pageId));
}
function ensureStylesheet(href){
  if([...document.querySelectorAll('link[rel="stylesheet"]')].some(link=>link.getAttribute('href')===href))return;
  const style=document.createElement('link');style.rel='stylesheet';style.href=href;document.head.appendChild(style);
}

export function enhancePortalShell(){
  ensureShell();
  ensureStylesheet('./interaction.css');
  ensureStylesheet('./workspace.css');
  ensureStylesheet('./company-input.css');
  ensureStylesheet('./csrd-impact.css');
  ensureStylesheet('./entrepreneur-intelligence.css');
  ensureStylesheet('./legacy-external-placements.css');
  ensureStylesheet('./powerhouse-observability.css');
  ensureStylesheet('./trusted-advisor-assurance.css');
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closePortalPage()});

  bindTextButton('.nav button','csrd','csrd-impact');
  bindTextButton('.nav button','bedrijfsgezondheid','profiel');
  bindTextButton('.nav button','strategie','strategie-naar-maandagochtend');
  bindTextButton('.nav button','processen','profiel');
  bindTextButton('.nav button','kennis','documenten');
  bindTextButton('.nav button','data & koppelingen','koppelingen');
  bindTextButton('.nav button','ai & insights','brain-verwerking');
  bindTextButton('.nav button','acties & impact','actieve-acties');
  bindTextButton('.nav button','rapportages','audit');

  bindTextButton('.quick button','koppelingen','koppelingen');
  bindTextButton('.quick button','koppeling bouwen','koppelingen');
  bindTextButton('.quick button','taken','taken-werkstromen');
  bindTextButton('.quick button','kennisbank','documenten');
  bindTextButton('.quick button','rapportages','audit');
  bindTextButton('.quick button','gebruikers','gebruikers');
  bindTextButton('.quick button','instellingen','instellingen');

  document.querySelectorAll('[data-open-page]').forEach(node=>node.addEventListener('click',event=>{event.preventDefault();openPortalPage(node.dataset.openPage);}));

  if(!document.documentElement.dataset.portalImpactBound){
    document.documentElement.dataset.portalImpactBound='true';
    globalThis.addEventListener?.('bg:portal-impact',event=>{
      const impact=event.detail||{};
      globalThis.dispatchEvent?.(new CustomEvent('bg:portal-overview-refresh',{detail:impact}));
      const root=document.getElementById('portalView');
      if(!root?.classList.contains('open'))return;
      const current=root.dataset.pageId;
      if(!impact.affectedPages?.includes(current))return;
      const status=root.querySelector('#pvStatus');
      if(status)status.textContent=impactSummary(impact);
      // Tijdens typen blijft het bronformulier stabiel. Andere open afgeleide
      // pagina's mogen direct opnieuw renderen, net als teken() in het oude portaal.
      if(current!==impact.sourcePage)requestAnimationFrame(()=>openPortalPage(current));
    });
    globalThis.addEventListener?.('bg:portal-brain-synced',event=>{
      const impact=event.detail?.impact;
      globalThis.dispatchEvent?.(new CustomEvent('bg:portal-overview-refresh',{detail:impact||{}}));
      const root=document.getElementById('portalView');
      if(!root?.classList.contains('open'))return;
      const current=root.dataset.pageId;
      if(!impact?.affectedPages?.includes(current))return;
      // Na Opslaan is het veilig ook de bronpagina opnieuw op te bouwen:
      // canonieke state + Brain-record zijn dan bevestigd.
      requestAnimationFrame(()=>openPortalPage(current));
    });
  }

  const search=document.querySelector('.search');
  if(search){
    const results=document.createElement('div');results.className='pvsearchresults';search.parentElement.appendChild(results);
    const render=()=>{
      const term=search.value;if(!term.trim()){results.classList.remove('open');results.innerHTML='';return;}
      const hits=searchPortalPages(term);results.innerHTML=hits.length?hits.map(p=>`<button type="button" data-page="${p.id}"><b>${p.label}</b><span>${p.groupLabel}</span></button>`).join(''):'<div class="pvempty">Geen portalonderdeel gevonden</div>';
      results.classList.add('open');results.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{openPortalPage(b.dataset.page);results.classList.remove('open')}));
    };
    search.addEventListener('input',render);search.addEventListener('focus',render);
    document.addEventListener('click',e=>{if(!results.contains(e.target)&&e.target!==search)results.classList.remove('open')});
  }

  const ai=document.querySelector('.smallbtn.ai');
  if(ai && !ai.id)ai.addEventListener('click',()=>openPortalPage('brain-verwerking'));
}