import { evaluatePortfolio, rankRisks, createAuditSnapshot } from './compliance-engine.js';
import { buildCustomerControls, buildBedrijfsgeheugenControls, readPortalComplianceInput } from './compliance-input-adapter.js';

export const COMPLIANCE_WORKSPACE_SECTIONS = Object.freeze(['executive-pulse','compliance-constellation','control-matrix','remediation-flightplan','audit-room']);

const FRAMEWORK_LABEL={EU_AI_ACT:'EU AI Act',NIS2_CBW:'NIS2 / Cbw',GDPR_DATA:'Data & privacy'};
const STATUS_LABEL={VERIFIED:'Geverifieerd',EVIDENCE_MISSING:'Bewijs ontbreekt',MISSING:'Control ontbreekt',UNKNOWN:'Nog onbekend',IN_PROGRESS:'In uitvoering',NOT_APPLICABLE:'Niet van toepassing',NOT_ASSESSED:'Niet beoordeeld'};
const STATUS_TONE={VERIFIED:'ok',EVIDENCE_MISSING:'warn',MISSING:'danger',UNKNOWN:'unknown',IN_PROGRESS:'progress',NOT_APPLICABLE:'neutral',NOT_ASSESSED:'unknown'};
const SEVERITY_LABEL={critical:'Kritiek',high:'Hoog',medium:'Middel',low:'Laag',info:'Info'};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const frameworkLabel=key=>FRAMEWORK_LABEL[key]||key;
const fmtDate=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('nl-NL',{dateStyle:'medium'}).format(d)};

function riskCards(risks){
  if(!risks.length)return '<article class="cc-risk"><div class="cc-risk-body"><h3>Geen open risico’s</h3><p>Alleen geldig voor de huidige evidence-set.</p></div></article>';
  return risks.slice(0,3).map((risk,index)=>`<article class="cc-risk cc-risk--${esc(risk.severity||'medium')}" data-risk-id="${esc(risk.id)}">
    <span class="cc-risk-severity">${SEVERITY_LABEL[risk.severity]||'Middel'}</span>
    <div class="cc-risk-body"><h3>${esc(risk.requirement)}</h3><p>${esc(risk.reason||'Nog geen onderbouwing beschikbaar.')}</p><div class="cc-risk-status">● ${STATUS_LABEL[risk.status]||risk.status}</div></div>
    <button class="cc-risk-toggle" type="button" data-compliance-risk-toggle aria-expanded="false">Waarom nu?⌄</button>
    <div class="cc-risk-expand">Prioriteit ${risk.riskScore}. ${esc(risk.status==='MISSING'?'De control zelf ontbreekt en veroorzaakt directe exposure.':risk.status==='EVIDENCE_MISSING'?'De maatregel kan bestaan, maar zonder bewijs is hij niet auditbaar.':'Eerst ontbrekende scope/informatie oplossen om schijnzekerheid te voorkomen.')}</div>
  </article>`).join('');
}

function frameworkStats(portfolio,key){return portfolio.frameworks[key]||{total:0,verified:0,missing:0,evidenceMissing:0,unknown:0,coverage:null}}

function constellation(portfolio){
  const evidence=portfolio.controls.reduce((sum,c)=>sum+(c.evidence?.length||0),0);
  const ai=frameworkStats(portfolio,'EU_AI_ACT'),nis=frameworkStats(portfolio,'NIS2_CBW'),data=frameworkStats(portfolio,'GDPR_DATA');
  return `<div class="cc-orbit-stage">
    <span class="cc-orbit-label" style="left:9%;top:28%">AI-gebruik</span><span class="cc-orbit-label" style="left:2%;top:49%">Gegevens-<br>verwerking</span><span class="cc-orbit-label" style="left:13%;bottom:17%">Datalocatie</span>
    <span class="cc-orbit-label" style="right:8%;top:27%">Risicobeheer</span><span class="cc-orbit-label" style="right:2%;top:45%">Leveranciers</span><span class="cc-orbit-label" style="right:4%;top:61%">Incidenten</span><span class="cc-orbit-label" style="right:11%;bottom:15%">Organisatie & beleid</span>
    <i class="cc-orbit-dot" style="left:19%;top:37%"></i><i class="cc-orbit-dot" style="left:23%;top:54%"></i><i class="cc-orbit-dot" style="right:22%;top:38%"></i><i class="cc-orbit-dot" style="right:18%;top:55%"></i><i class="cc-orbit-dot" style="left:48%;bottom:11%"></i>
    <div class="cc-core-orb"><div><strong>Bewijs</strong><small>${evidence} bewijsitems gekoppeld</small></div></div>
    <button class="cc-framework-orb ai" data-filter-framework="EU_AI_ACT"><span>✦</span>EU AI Act<small>${ai.total-ai.verified} open · ${ai.coverage??'—'}% aantoonbaar</small></button>
    <button class="cc-framework-orb data" data-filter-framework="GDPR_DATA"><span>⬡</span>Data & privacy<small>${data.total-data.verified} open · ${data.coverage??'—'}% aantoonbaar</small></button>
    <button class="cc-framework-orb nis" data-filter-framework="NIS2_CBW"><span>▣</span>NIS2 / Cbw<small>${nis.total-nis.verified} open · ${nis.coverage??'—'}% aantoonbaar</small></button>
  </div>`;
}

function controlRows(controls){return controls.map(c=>`<tr id="control-${esc(c.id)}" data-framework-row="${esc(c.framework)}" data-search-row="${esc(`${c.id} ${c.requirement} ${c.owner||''}`.toLowerCase())}">
<td><b>${esc(c.id)}</b></td><td><b>${esc(c.requirement)}</b><small>${frameworkLabel(c.framework)}</small></td><td>${frameworkLabel(c.framework)}</td><td><span class="cc-status tone-${STATUS_TONE[c.status]||'unknown'}">● ${STATUS_LABEL[c.status]||c.status}</span></td><td><span class="cc-evidence-tag">${c.evidence?.length?`${c.evidence.length} bewijsitem(s)`:'Geen bewijs'}</span></td><td>${esc(c.owner||'Nog toewijzen')}</td><td>${esc(c.nextAction||'Beoordelen')}</td><td>${c.verifiedAt?fmtDate(c.verifiedAt):'—'}</td></tr>`).join('')}

function flightplan(risks){
  const items=risks.slice(0,5);
  if(!items.length)return '<p style="padding:12px">Geen open remediation-items.</p>';
  return items.map((r,i)=>`<article class="cc-flight-step"><span class="cc-flight-label">${i===0?'NU EERST':i===3?'DAARNA':''}</span><div class="cc-flight-index">${i+1}</div><h3>${esc(r.requirement)}</h3><small>${frameworkLabel(r.framework)} · ${SEVERITY_LABEL[r.severity]||'Middel'}</small><p><b>Waarom nu?</b><br>${esc(r.nextAction||'Beoordelen en bewijs toevoegen.')}</p></article>`).join('');
}

function auditSheet(snapshot){
 const rows=Object.entries(snapshot.frameworks).map(([k,v])=>`<tr><td>${frameworkLabel(k)}</td><td>${v.total}</td><td>${v.verified}</td><td>${v.unknown}</td><td>${v.missing+v.evidenceMissing}</td><td>${v.coverage??'—'}%</td></tr>`).join('');
 const findings=snapshot.findings.slice(0,12).map(f=>`<li><b>${esc(f.id)} · ${esc(f.requirement)}</b> — ${STATUS_LABEL[f.status]||f.status}. ${esc(f.nextAction||'')}</li>`).join('');
 return `<section class="cc-audit-sheet"><h1>Compliance Command Center — audit snapshot</h1><p>Scope: ${snapshot.scope==='bedrijfsgeheugen'?'Bedrijfsgeheugen':'Uw organisatie'} · ${fmtDate(snapshot.timestamp)}</p><table><thead><tr><th>Kader</th><th>Controls</th><th>Verified</th><th>Unknown</th><th>Gaps</th><th>Dekking</th></tr></thead><tbody>${rows}</tbody></table><h2>Open findings</h2><ol>${findings}</ol><p>Evidence index: ${snapshot.evidenceIndex.length}. Deze snapshot ondersteunt audit en governance en vervangt geen formeel juridisch oordeel.</p></section>`;
}

export function buildComplianceCommandCenterMarkup({controls=[],scope='customer',now=new Date()}={}){
 const portfolio=evaluatePortfolio(controls,{scope,now});const risks=rankRisks(portfolio.controls,{now});const audit=createAuditSnapshot(portfolio.controls,{scope,now});
 const critical=risks.filter(r=>r.severity==='critical').length;const evidenceGaps=portfolio.controls.filter(c=>c.status==='EVIDENCE_MISSING').length;const unknown=portfolio.controls.filter(c=>c.status==='UNKNOWN').length;const score=portfolio.coverage??0;const auditReady=portfolio.coverage===100&&unknown===0;
 return `<main class="compliance-command-center" data-compliance-scope="${scope}">
  <section class="cc-titlebar"><div class="cc-title"><span class="cc-title-icon">▥</span><div><h1>Compliance Command Center</h1><p>Volledig overzicht van de status voor EU AI Act, NIS2, gegevensverwerking, AI-gebruik, datalocatie, risicoprioriteit, bewijs en volgende stappen.</p></div></div><div class="cc-scope-switch" role="group" aria-label="Compliance perspectief"><button data-compliance-scope-switch="bedrijfsgeheugen" class="${scope==='bedrijfsgeheugen'?'is-active':''}">Bedrijfsgeheugen</button><button data-compliance-scope-switch="customer" class="${scope==='customer'?'is-active':''}">Uw organisatie</button></div></section>
  <section class="cc-summary-strip"><article class="cc-summary-main"><div class="cc-score-ring" style="--score:${score*3.6}deg"><b>${portfolio.coverage==null?'?':`${portfolio.coverage}%`}</b></div><div><strong>Compliance score</strong><small>Gebaseerd op beschikbaar bewijs</small></div></article><article class="cc-summary-metric red"><span class="cc-metric-icon">△</span><div><b>${critical}</b><span>Kritieke risico’s</span><small>prioriteit nu</small></div></article><article class="cc-summary-metric orange"><span class="cc-metric-icon">▤</span><div><b>${evidenceGaps}</b><span>Bewijs ontbreekt</span><small>control mogelijk aanwezig</small></div></article><article class="cc-summary-metric gray"><span class="cc-metric-icon">?</span><div><b>${unknown}</b><span>Nog onbekend</span><small>scope/informatie nodig</small></div></article><article class="cc-summary-metric green"><span class="cc-metric-icon">◎</span><div><b>${auditReady?'100%':`${score}%`}</b><span>Audit readiness</span><small>groen vereist bewijs</small></div></article><article class="cc-summary-metric cc-portal-note"><span class="cc-metric-icon">ⓘ</span><div><span>Gebaseerd op uw bestaande portal-invoer</span><small>We hergebruiken strategie, processen, data, leveranciers en risico’s. Groene status verschijnt alleen met bewijs en verificatiedatum.</small></div></article></section>
  <section class="cc-dashboard-row"><section class="cc-panel" data-compliance-section="executive-pulse"><div class="cc-panel-head"><div><h2>〽 Executive Pulse</h2><p>Top risico’s die nu aandacht vragen.</p></div><button class="cc-panel-link" type="button" data-scroll-matrix>Bekijk alle risico’s →</button></div><div class="cc-risk-list">${riskCards(risks)}</div></section><section class="cc-panel cc-constellation-panel" data-compliance-section="compliance-constellation"><div class="cc-panel-head"><div><h2>⌘ Compliance Constellation</h2><p>Samenhang tussen wetgeving, risico’s en beheersmaatregelen.</p></div></div>${constellation(portfolio)}</section><aside class="cc-panel cc-copilot"><div class="cc-copilot-head"><span class="cc-copilot-badge">✦</span><div><b>AI Copilot</b><small>BETA</small></div></div><textarea data-copilot-input placeholder="Stel een vraag over compliance, risico’s of regelgeving..."></textarea><div class="cc-copilot-prompts"><button data-copilot-prompt="Welke risico’s vragen nu prioriteit?">Welke risico’s vragen nu prioriteit?</button><button data-copilot-prompt="Hoe zit het met onze NIS2-readiness?">Hoe zit het met onze NIS2-readiness?</button><button data-copilot-prompt="Toon ontbrekend bewijs voor EU AI Act">Toon ontbrekend bewijs voor EU AI Act</button><button data-copilot-prompt="Genereer een samenvatting voor de auditor">Genereer een samenvatting voor de auditor</button></div><div class="cc-copilot-answer" data-copilot-answer></div></aside></section>
  <section class="cc-panel cc-matrix-panel" data-compliance-section="control-matrix"><div class="cc-panel-head"><div><h2>⌘ Control Matrix</h2><p>Overzicht van beheersmaatregelen en actuele status.</p></div></div><div class="cc-matrix-toolbar"><div class="cc-filter"><button data-compliance-filter="all" class="is-active">Alles (${portfolio.controls.length})</button><button data-compliance-filter="EU_AI_ACT">EU AI Act</button><button data-compliance-filter="NIS2_CBW">NIS2 / Cbw</button><button data-compliance-filter="GDPR_DATA">Data</button></div><div class="cc-search-controls"><input type="search" data-compliance-search placeholder="Zoek op controle, eis of eigenaar..."></div></div><div class="cc-table-wrap"><table class="cc-control-table"><thead><tr><th>Control ID</th><th>Requirement</th><th>Framework</th><th>Status</th><th>Bewijs</th><th>Eigenaar</th><th>Volgende stap</th><th>Laatst bijgewerkt</th></tr></thead><tbody>${controlRows(portfolio.controls)}</tbody></table></div></section>
  <section class="cc-bottom-row"><section class="cc-panel cc-flight-panel" data-compliance-section="remediation-flightplan"><div class="cc-panel-head"><div><h2>➤ Remediation Flightplan</h2><p>Van risico naar actie. Geprioriteerde route op basis van impact, wetgeving en afhankelijkheden.</p></div><button class="cc-panel-link" type="button" data-scroll-matrix>Bekijk volledige routekaart →</button></div><div class="cc-flight-horizontal">${flightplan(risks)}</div></section><section class="cc-panel cc-audit-panel" data-compliance-section="audit-room"><div class="cc-panel-head"><div><h2>▤ Audit Room</h2><p>Direct een audit-klaar overzicht voor elke stakeholder.</p></div></div><div class="cc-audit-grid"><a class="cc-audit-tile" href="https://www.bedrijfsgeheugen.nl/portal-next/compliance.html"><i>♙</i><span><strong>Bestuur / MT</strong><small>Strategische samenvatting en belangrijkste risico’s</small></span><b>›</b></a><a class="cc-audit-tile" href="https://www.bedrijfsgeheugen.nl/portal-next/compliance.html"><i>▥</i><span><strong>Accountant / auditor</strong><small>Volledig controledossier en bewijsstukken</small></span><b>›</b></a><a class="cc-audit-tile" href="https://www.bedrijfsgeheugen.nl/portal-next/compliance.html"><i>⌂</i><span><strong>Toezichthouder</strong><small>Wettelijke rapportage en statusoverzicht</small></span><b>›</b></a><a class="cc-audit-tile" href="https://www.bedrijfsgeheugen.nl/due-diligence"><i>⌕</i><span><strong>Due diligence</strong><small>Kerninformatie voor investeerders en partners</small></span><b>›</b></a></div><button class="cc-audit-button" type="button" data-compliance-print>▤ Print / bewaar als PDF⌄</button>${auditSheet(audit)}</section></section>
 </main>`;
}

export class ComplianceCommandCenter extends (globalThis.HTMLElement||class{}){
 constructor(){super();this.scope=this.getAttribute?.('scope')||'customer';this.now=new Date()}
 connectedCallback(){this.render();this.bind()}
 controls(){return this.scope==='bedrijfsgeheugen'?buildBedrijfsgeheugenControls(globalThis.BG_SELF_COMPLIANCE_EVIDENCE||{}):buildCustomerControls(readPortalComplianceInput(globalThis))}
 render(){this.innerHTML=buildComplianceCommandCenterMarkup({controls:this.controls(),scope:this.scope,now:this.now})}
 bind(){
  this.querySelectorAll('[data-compliance-scope-switch]').forEach(b=>b.addEventListener('click',()=>{this.scope=b.dataset.complianceScopeSwitch;this.render();this.bind()}));
  this.querySelectorAll('[data-compliance-print]').forEach(b=>b.addEventListener('click',()=>globalThis.print?.()));
  this.querySelectorAll('[data-compliance-risk-toggle]').forEach(b=>b.addEventListener('click',()=>{const card=b.closest('.cc-risk');const open=card.classList.toggle('is-open');b.setAttribute('aria-expanded',String(open))}));
  this.querySelectorAll('[data-compliance-filter]').forEach(b=>b.addEventListener('click',()=>{const f=b.dataset.complianceFilter;this.querySelectorAll('[data-compliance-filter]').forEach(x=>x.classList.toggle('is-active',x===b));this.querySelectorAll('[data-framework-row]').forEach(row=>row.hidden=f!=='all'&&row.dataset.frameworkRow!==f)}));
  this.querySelectorAll('[data-filter-framework]').forEach(b=>b.addEventListener('click',()=>{this.querySelector(`[data-compliance-filter="${b.dataset.filterFramework}"]`)?.click();this.querySelector('[data-compliance-section="control-matrix"]')?.scrollIntoView({behavior:'smooth',block:'start'})}));
  this.querySelectorAll('[data-scroll-matrix]').forEach(b=>b.addEventListener('click',()=>this.querySelector('[data-compliance-section="control-matrix"]')?.scrollIntoView({behavior:'smooth',block:'start'})));
  const search=this.querySelector('[data-compliance-search]');search?.addEventListener('input',()=>{const q=search.value.trim().toLowerCase();this.querySelectorAll('[data-search-row]').forEach(row=>row.hidden=q&&!row.dataset.searchRow.includes(q))});
  const input=this.querySelector('[data-copilot-input]'),answer=this.querySelector('[data-copilot-answer]');this.querySelectorAll('[data-copilot-prompt]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.copilotPrompt;answer.textContent='Copilot gebruikt uitsluitend de huidige control- en evidence-status. Open de Control Matrix om de onderliggende bron en volgende actie te beoordelen.';answer.classList.add('is-visible')}));
 }
}
if(globalThis.customElements&&!globalThis.customElements.get('bg-compliance-command-center'))globalThis.customElements.define('bg-compliance-command-center',ComplianceCommandCenter);
