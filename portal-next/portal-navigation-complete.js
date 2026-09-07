import {PORTAL_SECTIONS,PORTAL_PAGE_INDEX} from './portal-content-map.js';
import {loadPortalProject} from './portal-project-store.js';
import {renderProjectPage} from './portal-project-views.js';
import {renderProjectTrace} from './portal-project-trace.js';
import {mapRuntimeSnapshotToPortalFlow} from './portal-powerhouse-adapter.js';

const PAGE_COPY={
  overzicht:['Overzicht','Managementbeeld van gezondheid, kennis, processen, data, AI, acties en impact.'],
  profiel:['Profiel per onderdeel','Bekijk de belangrijkste bedrijfscontext per onderdeel en hoe die samenhangt.'],
  'data-ai':['Data en AI','Bekijk databronnen, datakwaliteit, AI-context en relevante afhankelijkheden.'],
  'ai-scan':['AI-scan: kansenkaart','Bekijk kansen, risico’s en mogelijke AI-toepassingen zonder voorbeeldwaarheid als feit te tonen.'],
  kansenkaart:['Kansenkaart','Prioriteer kansen op impact, haalbaarheid, eigenaar en bewijs.'],
  'gegevens-invullen':['Je gegevens invullen','Vul ontbrekende bedrijfscontext gecontroleerd aan.'],
  'ingevulde-gegevens':['Wat je hebt ingevuld','Controleer welke gegevens beschikbaar zijn, door wie en wanneer bijgewerkt.'],
  businesscase:['Businesscase','Verbind aannames, investering, baten, risico en bewijs.'],
  'cijfers-maatstaven':['Cijfers en maatstaven','Bekijk KPI’s, definities, herkomst en ontwikkeling.'],
  'waarde-financiering':['Waarde en financiering','Maak waarde, financiering en onderliggende aannames inzichtelijk.'],
  mensen:['Mensen','Bekijk rollen, expertise, afhankelijkheden en kennisborging.'],
  'branche-markt':['Branche en markt','Verbind interne prestaties met markt-, branche- en concurrentiesignalen.'],
  onderzoek:['Onderzoek','Bundel analyses, bevindingen, hypotheses en onderliggende bronnen.'],
  'compliance-governance':['Compliance, security en governance','Maak verplichtingen, risico’s, controles en eigenaarschap traceerbaar.'],
  'ai-capabilities':['AI-capabilities','Bekijk beschikbare AI-capabilities, bevoegdheden en toepassingscontext.'],
  strategiemodellen:['Strategiemodellen','Gebruik strategiemodellen met expliciete aannames en versiebeheer.'],
  modellen:['Alle modellen','Beheer rekenmodellen, scenario’s en analyses.'],
  canvassen:['Canvassen','Werk met business-, strategie- en execution-canvassen.'],
  eindconclusie:['De eindconclusie','Bundel belangrijkste conclusies, bewijs, risico’s en beslispunten.'],
  'due-diligence':['Due diligence','Onderzoek risico’s, kansen, afhankelijkheden en bewijs voor besluitvorming.'],
  exit:['Exit','Maak exit-gereedheid, waardedrijvers en open risico’s inzichtelijk.'],
  'strategie-naar-maandagochtend':['Van strategie naar maandagochtend','Vertaal strategie naar concreet gedrag, processen, systemen, data en acties.'],
  'actueel-houden':['Actueel houden','Laat nieuwe signalen gecontroleerd doorwerken in context, besluiten en acties.'],
  wijzigingen:['Wijzigingen','Bekijk mutaties, geraakte onderdelen, analyse, actie en vervolg.'],
  advies:['Advies','Bekijk aanbevelingen met bron, redenering, eigenaar en status.'],
  offerte:['Offerte','Verbind scope, oplossing, effort, prijs, afspraken en opvolging.'],
  roadmap:['Roadmap','Bekijk prioriteiten, afhankelijkheden, mijlpalen, eigenaar en voortgang.'],
  uitvoeringsladder:['Uitvoeringsladder','Volg van tellen en vastleggen naar koppelen, meten, borgen, actie en outcome.'],
  'taken-werkstromen':['Taken & werkstromen','Stuur acties, eigenaarschap, deadlines, blokkades en bewijs.'],
  bronnenstatus:['Bronnenstatus','Bekijk verbinding, toestemming, actualiteit en datakwaliteit per bron.'],
  datahubstatus:['Datahubstatus','Bekijk normalisatie, verrijking, structuur en herkomst.'],
  'brain-verwerking':['Brain-verwerking','Bekijk welke context het AI Brain verwerkt en op basis waarvan.'],
  agentstatus:['Agentstatus','Bekijk Powerhouse-agenten, bevoegdheden, status en bewijs.'],
  'actieve-acties':['Actieve acties','Bekijk alleen acties die aantoonbaar actief of toegewezen zijn.'],
  'recovery-obligations':['Open recovery obligations','Houd herstelverplichtingen open tot verificatie en veilige afronding.'],
  'outcomes-evidence':['Outcomes & evidence','Scheid expected, observed en verified outcome en toon bewijs.'],
  'learning-writeback':['Learning/writeback','Laat gecontroleerd zien welke uitkomst wordt teruggeschreven als learning.'],
  'self-heal':['Self-heal / recovery','Bekijk detectie, containment, herstel, verificatie en heractivatie.'],
  audittrail:['Audittrail','Volg bron, verwerking, besluit, actie, evidence en learning chronologisch.'],
  koppelingen:['Koppelingen','Beheer bronverbindingen, autorisatie, synchronisatie en storingen.'],
  gebruikers:['Gebruikers','Beheer rollen, rechten, klantcontext en verantwoordelijkheden.'],
  documenten:['Documenten','Beheer documenten, herkomst, status, versie en gebruik in context.'],
  instellingen:['Instellingen','Beheer portaal- en systeeminstellingen zonder verborgen gedrag.'],
  audit:['Audit','Controleer wijzigingen, acties, rechten en bewijs.']
};

const PRIMARY_NAV=[
  ['⌂','Overzicht','overzicht'],['♡','Bedrijfsgezondheid','profiel'],['↗','Strategie & uitvoering','strategie-naar-maandagochtend'],
  ['◎','Processen & organisatie','taken-werkstromen'],['▤','Kennis','documenten'],['◫','Data & koppelingen','koppelingen'],
  ['✦','AI & Insights','ai-scan'],['✓','Acties & impact','actieve-acties'],['▥','Rapportages & beheer','audit']
];
const PROJECT_PAGES=new Set(['offerte','roadmap','taken-werkstromen','documenten','koppelingen']);
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
let projectResult={state:'loading',project:null,error:null};
let currentPage='overzicht';
let projectLoadPromise=null;

export function initialPortalPage(search=typeof location!=='undefined'?location.search:''){
  const requested=new URLSearchParams(search).get('page')||'overzicht';
  return PORTAL_PAGE_INDEX[requested]?requested:'overzicht';
}

export function portalPageUrl(pageId,search=typeof location!=='undefined'?location.search:''){
  const source=new URLSearchParams(search),next=new URLSearchParams();
  const klant=source.get('klant');if(klant)next.set('klant',klant);
  if(pageId&&pageId!=='overzicht')next.set('page',pageId);
  const suffix=next.toString();return `/portal-next/${suffix?`?${suffix}`:''}`;
}

function pageTrace(page){return `<div class="native-trace-chain"><span>Bron</span><i>→</i><span>Datahub</span><i>→</i><span>AI Brain</span><i>→</i><span>Powerhouse</span><i>→</i><span>${page.label}</span><i>→</i><span>Actie</span><i>→</i><span>Outcome</span><i>→</i><span>Learning</span></div>`;}
function neutralPageContent(page){return `<section class="native-live-content native-live-content--new"><div class="native-live-head"><div><span class="eyebrow">Native Business OS-module</span><h3>${page.label}</h3><p>Deze pagina blijft fail-closed wanneer geautoriseerde bron- of runtimegegevens ontbreken. Er wordt geen voorbeeldwaarheid als klantfeit ingevuld.</p></div></div></section>`;}
function projectStateContent(pageId){
  if(projectResult.state==='loading')return `<section class="project-empty" role="status"><strong>Projectgegevens laden…</strong><p>De klantcontext wordt server-side gecontroleerd.</p></section>`;
  if(projectResult.state==='unauthorized')return `<section class="project-empty" role="status"><strong>Geen toegang</strong><p>Deze projectgegevens zijn alleen beschikbaar voor de geautoriseerde tenant.</p></section>`;
  if(projectResult.state==='empty')return `<section class="project-empty" role="status"><strong>Nog geen projectgegevens</strong><p>Er is geen offerte/project voor deze tenant beschikbaar.</p></section>`;
  if(projectResult.state==='error')return `<section class="project-empty" role="status"><strong>Projectgegevens niet beschikbaar</strong><p>${String(projectResult.error||'Onbekende fout').replace(/[&<>]/g,'')}</p></section>`;
  const body=renderProjectPage(pageId,projectResult.project);
  const flow=mapRuntimeSnapshotToPortalFlow(projectResult.project?.runtime||{});
  return `${body}${renderProjectTrace({flow})}`;
}
function nativePageHtml(page){
  const copy=PAGE_COPY[page.id]||[page.label,'Deze pagina is onderdeel van het complete Bedrijfsgeheugen Business OS.'];
  const content=PROJECT_PAGES.has(page.id)?projectStateContent(page.id):neutralPageContent(page);
  return `<section class="native-page" data-native-page="${page.id}"><header class="native-page-hero"><div><span class="eyebrow">${PORTAL_SECTIONS[page.sectionId]?.label||'Portaal'}</span><h2>${copy[0]}</h2><p>${copy[1]}</p></div><button type="button" data-native-back>← Overzicht</button></header><div class="native-page-layers"><article class="native-layer"><span>01</span><h3>Managementbeeld</h3><p>Samenvatting, belangrijkste signalen, risico’s, keuzes en voortgang. Ontbrekende waarden blijven neutraal.</p><div class="native-status is-neutral">Geen fictieve bedrijfswaarheid</div></article><article class="native-layer"><span>02</span><h3>Operationele details</h3><p>Onderdelen, sprints, stories, planning, eigenaarschap en afhankelijkheden uit dezelfde klantcontext.</p><div class="native-status">Evidence-gated</div></article><article class="native-layer"><span>03</span><h3>Trace & evidence</h3><p>Bron, verwerking, actie, outcome en learning blijven van elkaar te onderscheiden.</p><div class="native-status">Auditbaar</div></article></div>${content}${PROJECT_PAGES.has(page.id)?'':`<section class="native-system-trace"><div><span class="eyebrow">Hoe deze pagina verbonden is</span><h3>Van informatie naar resultaat en terug naar leren</h3></div>${pageTrace(page)}<p>Een stap licht alleen actief op wanneer runtime-evidence die status ondersteunt.</p></section>`}</section>`;
}

function buildGroupedNav(container){container.innerHTML=Object.entries(PORTAL_SECTIONS).map(([sectionId,section])=>`<section class="portal-nav-group" data-section="${sectionId}"><h4>${section.label}</h4>${section.pages.map(id=>{const p=PORTAL_PAGE_INDEX[id];return p?`<button type="button" data-portal-page="${id}">${p.label}</button>`:''}).join('')}</section>`).join('');}
function mountDesktopPrimaryNav(){const nav=q('.sidebar .nav');if(!nav)return;nav.innerHTML=PRIMARY_NAV.map(([icon,label,id],i)=>`<button class="nav-item ${i===0?'is-active':''}" type="button" data-primary-page="${id}">${icon} ${label}</button>`).join('');const existing=q('.portal-all-pages-trigger');if(existing)existing.remove();const all=document.createElement('button');all.type='button';all.className='portal-all-pages-trigger';all.dataset.portalMenuToggle='';all.textContent='☰ Alle pagina’s';nav.after(all);}
function mountMobileNavigation(){const main=q('.main');if(!main||q('#mobileMenuToggle'))return;const bar=document.createElement('div');bar.className='portal-mobile-bar';bar.innerHTML=`<button id="mobileMenuToggle" class="portal-mobile-menu-toggle" type="button" aria-controls="portalMobileDrawer" aria-expanded="false">☰ Menu</button><strong>Bedrijfsgeheugen</strong><button class="portal-mobile-ai" type="button" data-mobile-ai>✦ AI</button>`;main.prepend(bar);const drawer=document.createElement('aside');drawer.id='portalMobileDrawer';drawer.className='portal-mobile-drawer';drawer.setAttribute('aria-hidden','true');drawer.innerHTML=`<button class="portal-mobile-backdrop" data-mobile-menu-close aria-label="Sluit menu"></button><div class="portal-mobile-drawer-panel"><header><strong>Alle portalpagina’s</strong><button type="button" data-mobile-menu-close aria-label="Sluiten">×</button></header><nav id="portalMobileNav" aria-label="Volledige mobiele portaalnavigatie"></nav></div>`;document.body.append(drawer);buildGroupedNav(drawer.querySelector('#portalMobileNav'));}
function mountDesktopDrawer(){if(q('#portalNavigationDrawer'))return;const drawer=document.createElement('aside');drawer.id='portalNavigationDrawer';drawer.className='portal-navigation-drawer';drawer.setAttribute('aria-hidden','true');drawer.innerHTML=`<button class="portal-nav-backdrop" data-portal-menu-close aria-label="Sluit menu"></button><div class="portal-navigation-panel"><header><div><span class="eyebrow">Bedrijfsgeheugen</span><h2>Alle pagina’s</h2></div><button type="button" data-portal-menu-close aria-label="Sluiten">×</button></header><nav data-portal-nav-tree aria-label="Alle portaalpagina's"></nav></div>`;document.body.append(drawer);buildGroupedNav(drawer.querySelector('[data-portal-nav-tree]'));}
function setDrawer(open,mobile=false){const drawer=q(mobile?'#portalMobileDrawer':'#portalNavigationDrawer');if(!drawer)return;drawer.classList.toggle('is-open',open);drawer.setAttribute('aria-hidden',String(!open));document.body.classList.toggle('portal-menu-open',open);if(mobile)q('#mobileMenuToggle')?.setAttribute('aria-expanded',String(open));}
function updateHistory(id,replace=false){if(typeof history==='undefined'||typeof location==='undefined')return;const url=portalPageUrl(id,location.search);history[replace?'replaceState':'pushState']({page:id},'',url);}
function scrollTop(){if(typeof window!=='undefined'&&typeof window.scrollTo==='function')window.scrollTo({top:0,behavior:'smooth'});}

function showOverview({historyMode='push'}={}){currentPage='overzicht';q('#overviewView')?.classList.add('is-active');q('#workspaceView')?.classList.remove('is-active');if(q('#workspaceContent'))q('#workspaceContent').innerHTML='';if(q('#routeTitle'))q('#routeTitle').textContent='Overzicht';if(q('#routeSubtitle'))q('#routeSubtitle').textContent='Grip op je bedrijf. Van context naar besluit, actie, bewijs en leren.';qa('[data-primary-page]').forEach(b=>b.classList.toggle('is-active',b.dataset.primaryPage==='overzicht'));setDrawer(false);setDrawer(false,true);if(historyMode!=='none')updateHistory('overzicht',historyMode==='replace');scrollTop();}
function showNativePage(id,{historyMode='push'}={}){if(id==='overzicht'){showOverview({historyMode});return;}const page=PORTAL_PAGE_INDEX[id];if(!page)return;currentPage=id;q('#overviewView')?.classList.remove('is-active');q('#workspaceView')?.classList.add('is-active');if(q('#workspaceContent'))q('#workspaceContent').innerHTML=nativePageHtml(page);if(q('#routeTitle'))q('#routeTitle').textContent=page.label;if(q('#routeSubtitle'))q('#routeSubtitle').textContent=PAGE_COPY[id]?.[1]||'';qa('[data-primary-page]').forEach(b=>b.classList.toggle('is-active',b.dataset.primaryPage===id));setDrawer(false);setDrawer(false,true);if(historyMode!=='none')updateHistory(id,historyMode==='replace');scrollTop();}
function bind(){if(document.documentElement.dataset.completePortalNavigationBound==='1')return;document.documentElement.dataset.completePortalNavigationBound='1';document.addEventListener('click',event=>{const pageButton=event.target.closest('[data-portal-page],[data-primary-page]');if(pageButton){showNativePage(pageButton.dataset.portalPage||pageButton.dataset.primaryPage);return;}if(event.target.closest('[data-portal-menu-toggle]')){setDrawer(true);return;}if(event.target.closest('#mobileMenuToggle')){setDrawer(true,true);return;}if(event.target.closest('[data-portal-menu-close]')){setDrawer(false);return;}if(event.target.closest('[data-mobile-menu-close]')){setDrawer(false,true);return;}if(event.target.closest('[data-native-back]')){showOverview();return;}if(event.target.closest('[data-mobile-ai]'))q('#aiCommand')?.click();});window.addEventListener('popstate',()=>showNativePage(initialPortalPage(location.search),{historyMode:'none'}));}
async function loadProject(){if(projectLoadPromise)return projectLoadPromise;projectLoadPromise=loadPortalProject().then(result=>{projectResult=result;if(PROJECT_PAGES.has(currentPage))showNativePage(currentPage,{historyMode:'none'});return result;});return projectLoadPromise;}

export function mountCompletePortalNavigation(){mountDesktopPrimaryNav();mountDesktopDrawer();mountMobileNavigation();bind();showNativePage(initialPortalPage(),{historyMode:'none'});void loadProject();}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountCompletePortalNavigation,{once:true});else mountCompletePortalNavigation();}
