import { findPage, listPortalGroups, buildLegacyUrl } from './page-registry.js';
import { customerSlug, canEmbedLegacy } from './legacy-bridge.js';
import { renderCsrdImpact } from './csrd-impact.js';

const BRAIN_PAGES = new Set([
  'bronnenstatus','datahubstatus','brain-verwerking','agentstatus','actieve-acties',
  'recovery-obligations','outcomes-evidence','learning-writeback','self-heal','audittrail'
]);
const NATIVE_PAGES = new Set(['csrd-impact', ...BRAIN_PAGES]);

const COPY = {
  'csrd-impact':['CSRD & Impact','Van CO₂, water en circulariteit tot social, governance, readiness, acties en auditbewijs in één klantwaardige impactcockpit.'],
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

export function pagePresentation(pageId) {
  const page=findPage(pageId);
  if(!page) return null;
  const brain=BRAIN_PAGES.has(pageId);
  const [title,description]=COPY[pageId] || [page.label, brain?'Onderdeel van de Brain & Powerhouse-laag.':`Open ${page.label} in de bestaande portalfunctionaliteit.`];
  return {
    ...page,
    title,
    description,
    kind: NATIVE_PAGES.has(pageId) ? 'native-v2' : (page.legacyTab ? 'legacy' : 'native-v2'),
    evidenceLabel: pageId==='csrd-impact' ? 'Impactdata + evidence in één traceerbare cockpit' : (brain ? 'Status alleen met runtime-evidence' : 'Bestaande portalinhoud behouden')
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
  root.innerHTML=`<div class="pvbackdrop" data-close></div><section class="pvpanel" role="dialog" aria-modal="true" aria-labelledby="pvTitle"><header class="pvhead"><div><span class="pvkicker" id="pvKicker">Klantenportaal</span><h2 id="pvTitle">Onderdeel</h2><p id="pvDescription"></p></div><button class="pvclose" type="button" data-close aria-label="Sluiten">×</button></header><div class="pvbody"><div class="pvstatus"><span class="pvdot"></span><strong id="pvStatus"></strong></div><div class="pvnative" id="pvNative"><div class="pvsteps"><article><b>1 · Context</b><span>Bronnen en samenhang</span></article><article><b>2 · Intelligentie</b><span>Analyse, besluit en prioriteit</span></article><article><b>3 · Uitvoering</b><span>Actie, bewijs en learning</span></article></div><div class="pvevidence"><b>Geen cosmetische live-status</b><p>V2 toont alleen een actieve productieflow wanneer daar runtime-evidence voor beschikbaar is. In reviewmodus blijft dit expliciet een product-/UX-weergave.</p></div></div><div class="pvlegacy" id="pvLegacy"><iframe id="pvFrame" title="Bestaande klantenportaalpagina"></iframe><div class="pvfallback" id="pvFallback"><p>Deze reviewomgeving kan de live klantenportal niet veilig inbedden.</p><a id="pvOpen" target="_blank" rel="noopener">Open bestaande functionaliteit ↗</a></div></div></div></section>`;
  document.body.appendChild(root);
  root.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click',closePortalPage));
  return root;
}

export function closePortalPage(){
  const root=document.getElementById('portalView');if(!root)return;
  root.classList.remove('open','impact-mode');root.setAttribute('aria-hidden','true');
  document.documentElement.classList.remove('portalview-open');
}

function resetNative(native){
  native.innerHTML=`<div class="pvsteps"><article><b>1 · Context</b><span>Bronnen en samenhang</span></article><article><b>2 · Intelligentie</b><span>Analyse, besluit en prioriteit</span></article><article><b>3 · Uitvoering</b><span>Actie, bewijs en learning</span></article></div><div class="pvevidence"><b>Geen cosmetische live-status</b><p>V2 toont alleen een actieve productieflow wanneer daar runtime-evidence voor beschikbaar is. In reviewmodus blijft dit expliciet een product-/UX-weergave.</p></div>`;
}

export function openPortalPage(pageId){
  const view=pagePresentation(pageId);if(!view)return false;
  const root=ensureShell();
  root.classList.toggle('impact-mode',pageId==='csrd-impact');
  root.querySelector('#pvKicker').textContent=view.sectionId==='brein-powerhouse'?'Brein & Powerhouse':'Klantenportaal';
  root.querySelector('#pvTitle').textContent=view.title;
  root.querySelector('#pvDescription').textContent=view.description;
  root.querySelector('#pvStatus').textContent=view.evidenceLabel;
  root.dataset.pageId=pageId;
  const native=root.querySelector('#pvNative'),legacy=root.querySelector('#pvLegacy');
  const frame=root.querySelector('#pvFrame'),fallback=root.querySelector('#pvFallback'),link=root.querySelector('#pvOpen');
  if(view.kind==='legacy'){
    native.hidden=true;legacy.hidden=false;
    const url=buildLegacyUrl(pageId,customerSlug());
    link.href=url || 'https://www.bedrijfsgeheugen.nl/klantportaal';
    if(canEmbedLegacy(location)){
      frame.hidden=false;fallback.hidden=true;frame.src=url;
    }else{
      frame.hidden=true;fallback.hidden=false;frame.removeAttribute('src');
    }
  }else{
    legacy.hidden=true;native.hidden=false;
    if(pageId==='csrd-impact') renderCsrdImpact(native,{openPage:openPortalPage}); else resetNative(native);
  }
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
  bindTextButton('.nav button','strategie','strategie-naar-maandagochtend');
  bindTextButton('.nav button','processen','profiel');
  bindTextButton('.nav button','kennis','documenten');
  bindTextButton('.nav button','data & koppelingen','koppelingen');
  bindTextButton('.nav button','ai & insights','brain-verwerking');
  bindTextButton('.nav button','acties & impact','actieve-acties');
  bindTextButton('.nav button','rapportages','audit');

  bindTextButton('.quick button','koppelingen','koppelingen');
  bindTextButton('.quick button','taken','taken-werkstromen');
  bindTextButton('.quick button','kennisbank','documenten');
  bindTextButton('.quick button','gebruikers','gebruikers');
  bindTextButton('.quick button','instellingen','instellingen');

  const search=document.querySelector('.search');
  if(search){
    const results=document.createElement('div');results.className='pvsearchresults';search.parentElement.appendChild(results);
    const render=()=>{
      const term=search.value; if(!term.trim()){results.classList.remove('open');results.innerHTML='';return;}
      const hits=searchPortalPages(term);results.innerHTML=hits.length?hits.map(p=>`<button type="button" data-page="${p.id}"><b>${p.label}</b><span>${p.groupLabel}</span></button>`).join(''):'<div class="pvempty">Geen portalonderdeel gevonden</div>';
      results.classList.add('open');results.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{openPortalPage(b.dataset.page);results.classList.remove('open')}));
    };
    search.addEventListener('input',render);search.addEventListener('focus',render);
    document.addEventListener('click',e=>{if(!results.contains(e.target)&&e.target!==search)results.classList.remove('open')});
  }

  const ai=document.querySelector('.smallbtn.ai');
  if(ai && !ai.id) ai.addEventListener('click',()=>openPortalPage('brain-verwerking'));
}
