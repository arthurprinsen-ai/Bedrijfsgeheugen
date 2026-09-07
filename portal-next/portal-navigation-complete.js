import { PORTAL_SECTIONS, PORTAL_PAGE_INDEX } from './portal-content-map.js';

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

const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];

export function legacyFrameUrl(search=typeof location!=='undefined'?location.search:''){
  const params=new URLSearchParams(search),url=new URL('/klantportaal.html','https://www.bedrijfsgeheugen.nl');
  const klant=params.get('klant');if(klant)url.searchParams.set('klant',klant);return url.pathname+url.search;
}

export function initialPortalPage(search=typeof location!=='undefined'?location.search:''){
  const requested=new URLSearchParams(search).get('page')||'overzicht';
  return PORTAL_PAGE_INDEX[requested]?'offerte'===requested?'offerte':requested:'overzicht';
}

function pageTrace(page){return `<div class="native-trace-chain"><span>Bron</span><i>→</i><span>Datahub</span><i>→</i><span>AI Brain</span><i>→</i><span>Powerhouse</span><i>→</i><span>${page.label}</span><i>→</i><span>Actie</span><i>→</i><span>Outcome</span><i>→</i><span>Learning</span></div>`;}
function parityHtml(page){
  if(!page.legacyTab)return `<section class="native-live-content native-live-content--new"><div class="native-live-head"><div><span class="eyebrow">Nieuwe Business OS-module</span><h3>${page.label}</h3><p>Deze module heeft geen legacy-tab. Status en inhoud blijven fail-closed totdat er geautoriseerde runtime-evidence beschikbaar is.</p></div></div></section>`;
  return `<section class="native-live-content"><div class="native-live-head"><div><span class="eyebrow">Volledige bestaande functionaliteit</span><h3>${page.label}</h3><p>De bestaande IJsselmonde-inhoud draait hieronder binnen de nieuwe portaal-shell. De klantcontext blijft behouden.</p></div><button type="button" data-open-legacy="${page.id}">Open los ↗</button></div><iframe class="native-legacy-frame" data-legacy-frame data-page-id="${page.id}" data-legacy-tab="${page.legacyTab}" src="${legacyFrameUrl()}" title="${page.label}"></iframe></section>`;
}
function nativePageHtml(page){const copy=PAGE_COPY[page.id]||[page.label,'Deze pagina is onderdeel van het complete Bedrijfsgeheugen Business OS.'];return `<section class="native-page" data-native-page="${page.id}"><header class="native-page-hero"><div><span class="eyebrow">${PORTAL_SECTIONS[page.sectionId]?.label||'Portaal'}</span><h2>${copy[0]}</h2><p>${copy[1]}</p></div><button type="button" data-native-back>← Overzicht</button></header><div class="native-page-layers"><article class="native-layer"><span>01</span><h3>Managementbeeld</h3><p>Samenvatting, belangrijkste signalen, risico’s, kansen en besluiten. Waarden blijven neutraal wanneer geverifieerde klantdata ontbreekt.</p><div class="native-status is-neutral">Geen fictieve bedrijfswaarheid</div></article><article class="native-layer"><span>02</span><h3>Operationele details</h3><p>Onderliggende onderdelen, eigenaar, status, afhankelijkheden, acties en open werk. Alleen runtime met evidence wordt als actief getoond.</p><div class="native-status">Evidence-gated</div></article><article class="native-layer"><span>03</span><h3>Trace & evidence</h3><p>Herleid elke aanbeveling of actie naar bron, Datahub, AI Brain, Powerhouse, eigenaar, outcome en learning/writeback.</p><div class="native-status">Auditbaar</div></article></div>${parityHtml(page)}<section class="native-system-trace"><div><span class="eyebrow">Hoe deze pagina verbonden is</span><h3>Van informatie naar resultaat en terug naar leren</h3></div>${pageTrace(page)}<p>Een stap licht alleen actief op wanneer runtime-evidence die status ondersteunt. Idle, waiting, blocked en niet geverifieerd blijven expliciet zichtbaar.</p></section></section>`;}

function buildGroupedNav(container){container.innerHTML=Object.entries(PORTAL_SECTIONS).map(([sectionId,section])=>`<section class="portal-nav-group" data-section="${sectionId}"><h4>${section.label}</h4>${section.pages.map(id=>{const p=PORTAL_PAGE_INDEX[id];return p?`<button type="button" data-portal-page="${id}">${p.label}</button>`:''}).join('')}</section>`).join('');}
function mountDesktopPrimaryNav(){const nav=q('.sidebar .nav');if(!nav)return;nav.innerHTML=PRIMARY_NAV.map(([icon,label,id],i)=>`<button class="nav-item ${i===0?'is-active':''}" type="button" data-primary-page="${id}">${icon} ${label}</button>`).join('');const all=document.createElement('button');all.type='button';all.className='portal-all-pages-trigger';all.dataset.portalMenuToggle='';all.textContent='☰ Alle pagina’s';nav.after(all);}
function mountMobileNavigation(){const main=q('.main');if(!main||q('#mobileMenuToggle'))return;const bar=document.createElement('div');bar.className='portal-mobile-bar';bar.innerHTML=`<button id="mobileMenuToggle" class="portal-mobile-menu-toggle" type="button" aria-controls="portalMobileDrawer" aria-expanded="false">☰ Menu</button><strong>Bedrijfsgeheugen</strong><button class="portal-mobile-ai" type="button" data-mobile-ai>✦ AI</button>`;main.prepend(bar);const drawer=document.createElement('aside');drawer.id='portalMobileDrawer';drawer.className='portal-mobile-drawer';drawer.setAttribute('aria-hidden','true');drawer.innerHTML=`<button class="portal-mobile-backdrop" data-mobile-menu-close aria-label="Sluit menu"></button><div class="portal-mobile-drawer-panel"><header><strong>Alle portalpagina’s</strong><button type="button" data-mobile-menu-close aria-label="Sluiten">×</button></header><nav id="portalMobileNav" aria-label="Volledige mobiele portaalnavigatie"></nav></div>`;document.body.append(drawer);buildGroupedNav(drawer.querySelector('#portalMobileNav'));}
function mountDesktopDrawer(){if(q('#portalNavigationDrawer'))return;const drawer=document.createElement('aside');drawer.id='portalNavigationDrawer';drawer.className='portal-navigation-drawer';drawer.setAttribute('aria-hidden','true');drawer.innerHTML=`<button class="portal-nav-backdrop" data-portal-menu-close aria-label="Sluit menu"></button><div class="portal-navigation-panel"><header><div><span class="eyebrow">Bedrijfsgeheugen</span><h2>Alle pagina’s</h2></div><button type="button" data-portal-menu-close aria-label="Sluiten">×</button></header><nav data-portal-nav-tree aria-label="Alle portaalpagina's"></nav></div>`;document.body.append(drawer);buildGroupedNav(drawer.querySelector('[data-portal-nav-tree]'));}
function setDrawer(open,mobile=false){const drawer=q(mobile?'#portalMobileDrawer':'#portalNavigationDrawer');if(!drawer)return;drawer.classList.toggle('is-open',open);drawer.setAttribute('aria-hidden',String(!open));document.body.classList.toggle('portal-menu-open',open);if(mobile)q('#mobileMenuToggle')?.setAttribute('aria-expanded',String(open));}

function styleLegacyDocument(doc){if(!doc||doc.getElementById('portal-next-embedded-style'))return;const style=doc.createElement('style');style.id='portal-next-embedded-style';style.textContent=`.balk,.tabs,.zij,.menuknop{display:none!important}.lay{display:block!important}.wrap{max-width:none!important;padding:.5rem!important}.inhoudkolom{width:100%!important}body{background:#fff!important}html{background:#fff!important}@media(max-width:720px){.wrap{padding:.25rem!important}.kaart{padding:1rem!important}}`;doc.head.append(style);}
export function activateEmbeddedLegacyPage(frame,page){if(!frame||!page?.legacyTab)return false;let attempts=0;const run=()=>{attempts++;try{const doc=frame.contentDocument;if(!doc)return false;styleLegacyDocument(doc);const button=doc.querySelector(`[data-p="${page.legacyTab}"]`);if(button){button.click();styleLegacyDocument(doc);return true}}catch{return true}return attempts>=40};if(run())return true;const timer=setInterval(()=>{if(run())clearInterval(timer)},250);return true;}
function bindEmbeddedFrame(page){const frame=q('[data-legacy-frame]');if(!frame)return;const activate=()=>activateEmbeddedLegacyPage(frame,page);frame.addEventListener('load',activate,{once:false});try{if(frame.contentDocument?.readyState==='complete')activate()}catch{}}

function showOverview(){q('#overviewView')?.classList.add('is-active');q('#workspaceView')?.classList.remove('is-active');if(q('#workspaceContent'))q('#workspaceContent').innerHTML='';if(q('#routeTitle'))q('#routeTitle').textContent='Overzicht';if(q('#routeSubtitle'))q('#routeSubtitle').textContent='Grip op je bedrijf. Van context naar besluit, actie, bewijs en leren.';qa('[data-primary-page]').forEach(b=>b.classList.toggle('is-active',b.dataset.primaryPage==='overzicht'));setDrawer(false);setDrawer(false,true);window.scrollTo({top:0,behavior:'smooth'});}
function showNativePage(id){if(id==='overzicht'){showOverview();return;}const page=PORTAL_PAGE_INDEX[id];if(!page)return;const overview=q('#overviewView'),workspace=q('#workspaceView'),content=q('#workspaceContent');overview?.classList.remove('is-active');workspace?.classList.add('is-active');if(content)content.innerHTML=nativePageHtml(page);if(q('#routeTitle'))q('#routeTitle').textContent=page.label;if(q('#routeSubtitle'))q('#routeSubtitle').textContent=PAGE_COPY[id]?.[1]||'';qa('[data-primary-page]').forEach(b=>b.classList.toggle('is-active',b.dataset.primaryPage===id));bindEmbeddedFrame(page);setDrawer(false);setDrawer(false,true);window.scrollTo({top:0,behavior:'smooth'});}
function openLegacy(id){const page=PORTAL_PAGE_INDEX[id],url=new URL(legacyFrameUrl(),location.origin);if(page?.legacyTab)url.hash=`#${page.legacyTab}`;window.open(url.toString(),'_blank','noopener');}
function bind(){document.addEventListener('click',e=>{const pageButton=e.target.closest('[data-portal-page],[data-primary-page]');if(pageButton){showNativePage(pageButton.dataset.portalPage||pageButton.dataset.primaryPage);return;}if(e.target.closest('[data-portal-menu-toggle]')){setDrawer(true);return;}if(e.target.closest('#mobileMenuToggle')){setDrawer(true,true);return;}if(e.target.closest('[data-portal-menu-close]')){setDrawer(false);return;}if(e.target.closest('[data-mobile-menu-close]')){setDrawer(false,true);return;}if(e.target.closest('[data-native-back]')){showOverview();return;}const legacy=e.target.closest('[data-open-legacy]');if(legacy){openLegacy(legacy.dataset.openLegacy);return;}if(e.target.closest('[data-mobile-ai]'))q('#aiCommand')?.click();});}
export function mountCompletePortalNavigation(){mountDesktopPrimaryNav();mountDesktopDrawer();mountMobileNavigation();bind();showNativePage(initialPortalPage());}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountCompletePortalNavigation);else mountCompletePortalNavigation();}
