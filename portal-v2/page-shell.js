import { findPage, listPortalGroups } from './page-registry.js';
import { nativePageContent } from './native-pages.js';
import { renderCsrdImpact } from './csrd-impact.js';

const COPY = {
  overzicht:['Overzicht','De centrale cockpit met gezondheid, voortgang, kansen, risico’s, acties en impact.'],
  profiel:['Profiel per onderdeel','Bekijk de actuele stand per bedrijfsdomein, inclusief onderbouwing, risico’s en aanbevolen vervolgstappen.'],
  'data-ai':['Data en AI','Breng bronnen, datakwaliteit, AI-kansen en uitvoerbare verbeteringen samen.'],
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
  'compliance-governance':['Compliance, security en governance','Volg verplichtingen, controls, risico’s, bewijs en acties voor onder meer AI Act, NIS2, privacy en security.'],
  'compliance-command-center':['Compliance Command Center','Eén operationele cockpit voor compliance-readiness, bewijs, open risico’s en auditacties.'],
  'ai-capabilities':['AI-capabilities','Zie welke AI-capabilities beschikbaar, gewenst, verantwoord en aantoonbaar operationeel zijn.'],
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
  'actieve-acties':['Actieve acties','Van inzicht naar concrete uitvoering, eigenaar, voortgang en bewijs.'],
  'recovery-obligations':['Open recovery obligations','Elke containment of blokkade blijft zichtbaar totdat root cause, fix, test en heractivatie aantoonbaar gesloten zijn.'],
  'outcomes-evidence':['Outcomes & evidence','Koppel acties aan gemeten resultaat en bewijs zodat effect niet op aannames rust.'],
  'learning-writeback':['Learning/writeback','Zet geverifieerde outcomes om in herbruikbare learnings voor volgende beslissingen.'],
  'self-heal':['Self-heal / recovery','Detecteer problemen, herstel binnen grenzen, verifieer en heractiveer gecontroleerd.'],
  audittrail:['Audittrail','Maak besluiten, acties, wijzigingen en bewijs terugvindbaar in één traceerbare keten.']
};

const BRAIN_PAGES=new Set(['bronnenstatus','datahubstatus','brain-verwerking','agentstatus','actieve-acties','recovery-obligations','outcomes-evidence','learning-writeback','self-heal','audittrail']);

export function pagePresentation(pageId) {
  const page=findPage(pageId);
  if(!page) return null;
  const [title,description]=COPY[pageId] || [page.label,`${page.label} is een standaardonderdeel van Portal V2.`];
  const content=nativePageContent(pageId);
  return {
    ...page,
    ...content,
    title,
    description,
    kind:'native-v2',
    evidenceLabel: pageId==='csrd-impact'
      ? 'Impactdata + evidence in één traceerbare cockpit'
      : BRAIN_PAGES.has(pageId)
        ? 'Native Portal V2 · status alleen met runtime-evidence'
        : 'Native Portal V2 · zelfstandige module zonder legacy-afhankelijkheid'
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
  root.innerHTML=`<div class="pvbackdrop" data-close></div><section class="pvpanel" role="dialog" aria-modal="true" aria-labelledby="pvTitle"><header class="pvhead"><div><span class="pvkicker" id="pvKicker">Portal V2</span><h2 id="pvTitle">Onderdeel</h2><p id="pvDescription"></p></div><button class="pvclose" type="button" data-close aria-label="Sluiten">×</button></header><div class="pvbody"><div class="pvstatus"><span class="pvdot"></span><strong id="pvStatus"></strong></div><div class="pvnative" id="pvNative"></div></div></section>`;
  document.body.appendChild(root);
  root.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click',closePortalPage));
  return root;
}

export function closePortalPage(){
  const root=document.getElementById('portalView');if(!root)return;
  root.classList.remove('open','impact-mode');root.setAttribute('aria-hidden','true');
  document.documentElement.classList.remove('portalview-open');
}

function esc(value=''){
  return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function renderMetrics(block){
  return `<section class="pvmodule pvmetrics"><div class="pvmodulehead"><span>01</span><h3>${esc(block.title)}</h3></div><div class="pvmetricgrid">${block.items.map(([label,value])=>`<article><small>${esc(label)}</small><strong>${esc(value)}</strong></article>`).join('')}</div></section>`;
}
function renderWorklist(block){
  return `<section class="pvmodule"><div class="pvmodulehead"><span>02</span><h3>${esc(block.title)}</h3></div><div class="pvworklist">${block.items.map(([label,value])=>`<article><div><b>${esc(label)}</b><p>${esc(value)}</p></div><span>→</span></article>`).join('')}</div></section>`;
}
function renderActions(block){
  return `<section class="pvmodule"><div class="pvmodulehead"><span>03</span><h3>${esc(block.title)}</h3></div><div class="pvactions">${block.items.map(([label,pageId],index)=>`<button type="button" data-pv-page="${esc(pageId)}" class="${index===0?'primary':''}"><span>${esc(label)}</span><i>→</i></button>`).join('')}</div></section>`;
}

function renderNative(native,view){
  const blocks=Array.isArray(view.blocks)?view.blocks:[];
  native.innerHTML=`<div class="pvnativehero"><div><span>Zelfstandig onderdeel</span><h3>${esc(view.title)}</h3><p>${esc(view.description)}</p></div><button type="button" class="pvprimary">${esc(view.primaryAction || 'Open onderdeel')} <span>→</span></button></div>${blocks.map(block=>block.type==='metrics'?renderMetrics(block):block.type==='worklist'?renderWorklist(block):block.type==='actions'?renderActions(block):'').join('')}<div class="pvevidence"><b>Native V2 contract</b><p>Deze module draait binnen dezelfde Portal V2-shell, gebruikt dezelfde V2-context en schakelt niet door naar een tweede portaal. Live-status wordt alleen getoond wanneer runtime-evidence beschikbaar is.</p></div>`;
  native.querySelectorAll('[data-pv-page]').forEach(btn=>btn.addEventListener('click',()=>openPortalPage(btn.dataset.pvPage)));
  native.querySelector('.pvprimary')?.addEventListener('click',()=>{
    const first=blocks.find(block=>block.type==='actions')?.items?.[0]?.[1];
    if(first) openPortalPage(first);
  });
}

export function openPortalPage(pageId){
  const view=pagePresentation(pageId);if(!view)return false;
  const root=ensureShell();
  root.classList.toggle('impact-mode',pageId==='csrd-impact');
  root.querySelector('#pvKicker').textContent=view.sectionId==='brein-powerhouse'?'Brein & Powerhouse':'Portal V2';
  root.querySelector('#pvTitle').textContent=view.title;
  root.querySelector('#pvDescription').textContent=view.description;
  root.querySelector('#pvStatus').textContent=view.evidenceLabel;
  root.dataset.pageId=pageId;
  const native=root.querySelector('#pvNative');
  if(pageId==='csrd-impact') renderCsrdImpact(native,{openPage:openPortalPage,closePage:closePortalPage}); else renderNative(native,view);
  root.classList.add('open');root.setAttribute('aria-hidden','false');document.documentElement.classList.add('portalview-open');
  return true;
}

function bindTextButton(selector,needle,pageId){
  [...document.querySelectorAll(selector)].find(btn=>btn.textContent.toLocaleLowerCase('nl').includes(needle))?.addEventListener('click',()=>openPortalPage(pageId));
}

function ensureStylesheet(href){
  if([...document.querySelectorAll('link[rel="stylesheet"]')].some(link=>link.getAttribute('href')===href)) return;
  const style=document.createElement('link');style.rel='stylesheet';style.href=href;document.head.appendChild(style);
}

export function enhancePortalShell(){
  ensureShell();
  ensureStylesheet('./interaction.css');
  ensureStylesheet('./csrd-impact.css');
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

  document.querySelectorAll('[data-open-page]').forEach(node=>node.addEventListener('click',event=>{
    event.preventDefault();
    openPortalPage(node.dataset.openPage);
  }));

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
  if(ai && !ai.id) ai.addEventListener('click',()=>openPortalPage('brain-verwerking'));
}
