import { evaluatePortfolio, rankRisks, createAuditSnapshot } from './compliance-engine.js';
import { buildCustomerControls, buildBedrijfsgeheugenControls, readPortalComplianceInput } from './compliance-input-adapter.js';

export const COMPLIANCE_WORKSPACE_SECTIONS = Object.freeze([
  'executive-pulse',
  'compliance-constellation',
  'control-matrix',
  'remediation-flightplan',
  'audit-room'
]);

const FRAMEWORK_LABEL = Object.freeze({ EU_AI_ACT: 'EU AI Act', NIS2_CBW: 'NIS2 / Cbw', GDPR_DATA: 'Data & privacy' });
const STATUS_LABEL = Object.freeze({ VERIFIED:'Geverifieerd', EVIDENCE_MISSING:'Bewijs ontbreekt', MISSING:'Control ontbreekt', UNKNOWN:'Nog onbekend', IN_PROGRESS:'In uitvoering', NOT_APPLICABLE:'Niet van toepassing', NOT_ASSESSED:'Niet beoordeeld' });
const STATUS_TONE = Object.freeze({ VERIFIED:'ok', EVIDENCE_MISSING:'warn', MISSING:'danger', UNKNOWN:'unknown', IN_PROGRESS:'progress', NOT_APPLICABLE:'neutral', NOT_ASSESSED:'unknown' });
const SEVERITY_LABEL = Object.freeze({ critical:'Kritiek', high:'Hoog', medium:'Middel', low:'Laag', info:'Info' });

function esc(value='') { return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
function fmtDate(value) { const date=value instanceof Date?value:new Date(value); return Number.isNaN(date.getTime())?'—':new Intl.DateTimeFormat('nl-NL',{dateStyle:'medium',timeStyle:'short'}).format(date); }
function frameworkLabel(key) { return FRAMEWORK_LABEL[key] || key; }
function coverageLabel(summary) { return summary?.coverage == null ? '—' : `${summary.coverage}%`; }

function frameworkCards(portfolio) {
  const order=['EU_AI_ACT','NIS2_CBW','GDPR_DATA'];
  return order.map(key=>{
    const item=portfolio.frameworks[key] || {total:0,verified:0,unknown:0,missing:0,evidenceMissing:0,coverage:null};
    const circumference=264;
    const pct=item.coverage ?? 0;
    const offset=circumference-(pct/100)*circumference;
    return `<article class="cc-framework-card" data-framework="${key}">
      <div class="cc-ring" style="--ring-offset:${offset}"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42"></circle><circle class="cc-ring-value" cx="50" cy="50" r="42"></circle></svg><strong>${coverageLabel(item)}</strong></div>
      <div><span>${frameworkLabel(key)}</span><b>${item.verified}/${Math.max(item.total-item.notApplicable,0)} aantoonbaar</b><small>${item.unknown||0} onbekend · ${item.missing||0} control gap · ${item.evidenceMissing||0} bewijs gap</small></div>
    </article>`;
  }).join('');
}

function topRisks(risks) {
  if (!risks.length) return `<article class="cc-empty"><b>Geen open risico’s in de huidige evidence-set.</b><p>Dit is alleen groen wanneer alle toepasselijke controls werkelijk geverifieerd zijn.</p></article>`;
  return risks.slice(0,5).map((risk,index)=>`<article class="cc-risk cc-risk--${esc(risk.severity||'medium')}" data-risk-id="${esc(risk.id)}">
    <span class="cc-rank">${String(index+1).padStart(2,'0')}</span>
    <div><div class="cc-risk-meta"><em>${SEVERITY_LABEL[risk.severity]||'Middel'}</em><span>${frameworkLabel(risk.framework)}</span><span>${STATUS_LABEL[risk.status]||risk.status}</span></div><h3>${esc(risk.requirement)}</h3><p>${esc(risk.reason||'Nog geen onderbouwing beschikbaar.')}</p><details><summary>Waarom nu?</summary><p>Prioriteit ${risk.riskScore}. ${esc(risk.status==='MISSING'?'De control zelf ontbreekt; alleen documenteren is onvoldoende.':risk.status==='EVIDENCE_MISSING'?'De maatregel kan bestaan, maar zonder actueel bewijs kan hij niet als aantoonbaar beheerst gelden.':'Eerst de scope of ontbrekende informatie vaststellen; anders ontstaat schijnzekerheid.')}</p></details></div>
    <aside><small>Eerstvolgende actie</small><b>${esc(risk.nextAction||'Beoordeel deze control en koppel bewijs.')}</b></aside>
  </article>`).join('');
}

function constellation(controls) {
  const frameworkNodes=['EU_AI_ACT','NIS2_CBW','GDPR_DATA'].map((framework,index)=>`<button class="cc-orbit-node cc-orbit-node--framework cc-orbit-node--f${index+1}" data-filter-framework="${framework}"><span>${frameworkLabel(framework)}</span></button>`).join('');
  const controlNodes=controls.slice(0,12).map((control,index)=>`<button class="cc-orbit-node cc-orbit-node--control cc-orbit-node--c${index+1} tone-${STATUS_TONE[control.status]||'unknown'}" data-control-jump="${esc(control.id)}" title="${esc(control.requirement)}"><b>${esc(control.id)}</b><small>${STATUS_LABEL[control.status]||control.status}</small></button>`).join('');
  const evidenceCount=controls.reduce((sum,item)=>sum+(item.evidence?.length||0),0);
  return `<div class="cc-constellation" aria-label="Compliance constellation">
    <svg class="cc-constellation-lines" viewBox="0 0 900 540" preserveAspectRatio="none" aria-hidden="true"><path d="M450 270 C310 150 210 120 95 95"></path><path d="M450 270 C590 150 690 120 805 95"></path><path d="M450 270 C450 390 450 430 450 505"></path>${evidenceCount?'<circle class="cc-evidence-pulse" cx="450" cy="270" r="165"></circle>':''}</svg>
    <div class="cc-core"><span>Evidence<br>Core</span><b>${evidenceCount}</b><small>bewijsitems gekoppeld</small></div>${frameworkNodes}${controlNodes}
  </div>`;
}

function controlRows(controls) {
  return controls.map(control=>`<tr id="control-${esc(control.id)}" data-framework-row="${control.framework}">
    <td><b>${esc(control.id)}</b><small>${frameworkLabel(control.framework)}</small></td>
    <td><strong>${esc(control.requirement)}</strong><small>${esc(control.reason||'')}</small></td>
    <td><span class="cc-status tone-${STATUS_TONE[control.status]||'unknown'}">${STATUS_LABEL[control.status]||control.status}</span></td>
    <td><span>${control.evidence?.length||0}</span><small>${control.verifiedAt?`geverifieerd ${fmtDate(control.verifiedAt)}`:'geen verificatiedatum'}</small></td>
    <td>${esc(control.owner||'Nog toewijzen')}</td>
    <td><button class="cc-text-button" data-control-jump="${esc(control.id)}">${esc(control.nextAction||'Beoordelen')} →</button></td>
  </tr>`).join('');
}

function flightplan(risks) {
  if (!risks.length) return '<div class="cc-flight-empty">Geen open remediation-items.</div>';
  return risks.slice(0,8).map((risk,index)=>`<article class="cc-flight-step ${index===0?'is-next':''}">
    <div class="cc-flight-index"><span>${index+1}</span></div><div><small>${index===0?'NU EERST':'DAARNA'} · ${frameworkLabel(risk.framework)} · ${SEVERITY_LABEL[risk.severity]||'Middel'}</small><h3>${esc(risk.requirement)}</h3><p>${esc(risk.nextAction||'Beoordelen en bewijs toevoegen.')}</p>${index===0?`<aside><b>Waarom deze voorrang?</b><span>Risicoscore ${risk.riskScore}. De combinatie van ernst, huidige status en gekoppelde afhankelijkheden maakt dit nu de meest waardevolle risicoreductie.</span></aside>`:''}</div>
  </article>`).join('');
}

function auditMarkup(snapshot) {
  const frameworkRows=Object.entries(snapshot.frameworks).map(([key,value])=>`<tr><td>${frameworkLabel(key)}</td><td>${value.total}</td><td>${value.verified}</td><td>${value.unknown}</td><td>${value.missing+value.evidenceMissing}</td><td>${coverageLabel(value)}</td></tr>`).join('');
  const findings=snapshot.findings.slice(0,12).map(item=>`<li><b>${esc(item.id)} · ${esc(item.requirement)}</b><span>${frameworkLabel(item.framework)} · ${STATUS_LABEL[item.status]||item.status} · ${SEVERITY_LABEL[item.severity]||item.severity}</span><small>${esc(item.nextAction||'')}</small></li>`).join('')||'<li>Geen open findings.</li>';
  return `<div class="cc-audit-sheet" data-audit-sheet>
    <header><div><span>Bedrijfsgeheugen · Compliance evidence snapshot</span><h3>Audit Room</h3></div><div><b>Scope: ${snapshot.scope==='bedrijfsgeheugen'?'Bedrijfsgeheugen':'Uw organisatie'}</b><small>${fmtDate(snapshot.timestamp)}</small></div></header>
    <div class="cc-audit-audiences"><span>Bestuur / MT</span><span>Accountant / auditor</span><span>Toezichthouder</span><span>Due diligence</span></div>
    <table><thead><tr><th>Kader</th><th>Controls</th><th>Verified</th><th>Unknown</th><th>Gaps</th><th>Dekking</th></tr></thead><tbody>${frameworkRows}</tbody></table>
    <section><h4>Open findings</h4><ol>${findings}</ol></section>
    <footer><b>Evidence index: ${snapshot.evidenceIndex.length} gekoppelde items</b><p>Deze snapshot is een evidence- en controlmanagementoverzicht. Hij vervangt geen formeel juridisch oordeel over toepasselijkheid of naleving.</p></footer>
  </div>`;
}

export function buildComplianceCommandCenterMarkup({ controls = [], scope = 'customer', now = new Date() } = {}) {
  const portfolio=evaluatePortfolio(controls,{scope,now});
  const risks=rankRisks(portfolio.controls,{now});
  const audit=createAuditSnapshot(portfolio.controls,{scope,now});
  const critical=risks.filter(item=>item.severity==='critical').length;
  const evidenceGaps=portfolio.controls.filter(item=>item.status==='EVIDENCE_MISSING').length;
  const unknown=portfolio.controls.filter(item=>item.status==='UNKNOWN').length;
  return `<main class="compliance-command-center" data-compliance-scope="${scope}">
    <header class="cc-hero" data-compliance-section="executive-pulse">
      <div class="cc-hero-copy"><span class="cc-kicker">Trust & Governance · live evidence model</span><h1>Compliance Command Center</h1><p>Niet: “hebben we een vinkje?” Wel: <strong>wat is aantoonbaar, wat weten we nog niet, waar zit het grootste risico en wat moet nu als eerste?</strong></p><div class="cc-scope-switch" role="group" aria-label="Compliance perspectief"><button data-compliance-scope-switch="bedrijfsgeheugen" class="${scope==='bedrijfsgeheugen'?'is-active':''}">Bedrijfsgeheugen</button><button data-compliance-scope-switch="customer" class="${scope==='customer'?'is-active':''}">Uw organisatie</button></div></div>
      <div class="cc-pulse"><div class="cc-pulse-orbit"><span></span><span></span><span></span></div><strong>${portfolio.coverage==null?'?':portfolio.coverage}</strong><small>${portfolio.coverage==null?'nog niet genoeg bewijs':'% aantoonbaar geverifieerd'}</small></div>
      <div class="cc-hero-actions"><button data-compliance-print>Audit snapshot / PDF</button><a href="/klantportaal${typeof location!=='undefined'?location.search:''}">Terug naar portaal</a></div>
    </header>

    <section class="cc-signal-strip" aria-label="Compliance kernsignalen"><article><span>Kritieke risico’s</span><b>${critical}</b><small>${critical?'bestuurlijke aandacht':'geen kritieke gaps zichtbaar'}</small></article><article><span>Bewijs ontbreekt</span><b>${evidenceGaps}</b><small>control mogelijk aanwezig</small></article><article><span>Nog onbekend</span><b>${unknown}</b><small>eerst scope/informatie</small></article><article><span>Audit readiness</span><b>${portfolio.coverage===100&&unknown===0?'JA':'NEE'}</b><small>groen vereist bewijs</small></article></section>

    <section class="cc-frameworks">${frameworkCards(portfolio)}</section>

    <section class="cc-panel cc-attention"><div class="cc-panel-head"><div><span>Executive Pulse</span><h2>Waar moet het bestuur nu naar kijken?</h2></div><small>Automatisch geprioriteerd · uitlegbaar · evidence-first</small></div><div class="cc-risk-list">${topRisks(risks)}</div></section>

    <section class="cc-panel cc-constellation-panel" data-compliance-section="compliance-constellation"><div class="cc-panel-head"><div><span>Compliance Constellation</span><h2>Zie hoe wet, control, bewijs en risico samenhangen</h2></div><p>Klik een node om naar de onderliggende control te springen. Alleen gekoppeld bewijs activeert de evidence-core.</p></div>${constellation(portfolio.controls)}</section>

    <section class="cc-panel" data-compliance-section="control-matrix"><div class="cc-panel-head"><div><span>Control Matrix</span><h2>Van wettelijke eis naar aantoonbare beheersing</h2></div><div class="cc-filter"><button data-compliance-filter="all" class="is-active">Alles</button><button data-compliance-filter="EU_AI_ACT">EU AI Act</button><button data-compliance-filter="NIS2_CBW">NIS2 / Cbw</button><button data-compliance-filter="GDPR_DATA">Data</button></div></div><div class="cc-table-wrap"><table class="cc-control-table"><thead><tr><th>Control</th><th>Eis & waarom</th><th>Status</th><th>Evidence</th><th>Eigenaar</th><th>Volgende stap</th></tr></thead><tbody>${controlRows(portfolio.controls)}</tbody></table></div></section>

    <section class="cc-panel cc-flight" data-compliance-section="remediation-flightplan"><div class="cc-panel-head"><div><span>Remediation Flightplan</span><h2>Niet alles tegelijk. Dit is de slimste route vooruit.</h2></div><p>Volgorde is gebaseerd op ernst, ontbrekende control/bewijs, afhankelijkheden en hergebruik over meerdere verplichtingen.</p></div><div class="cc-flight-track">${flightplan(risks)}</div></section>

    <section class="cc-panel cc-audit" data-compliance-section="audit-room"><div class="cc-panel-head"><div><span>Audit Room</span><h2>Eén versie van de waarheid voor accountant, auditor en toezichthouder</h2></div><button data-compliance-print>Print / bewaar als PDF</button></div>${auditMarkup(audit)}</section>
  </main>`;
}

export class ComplianceCommandCenter extends (globalThis.HTMLElement || class {}) {
  constructor(){ super(); this.scope=this.getAttribute?.('scope') || 'customer'; this.now=new Date(); }
  connectedCallback(){ this.render(); this.bind(); }
  controls(){
    if(this.scope==='bedrijfsgeheugen') return buildBedrijfsgeheugenControls(globalThis.BG_SELF_COMPLIANCE_EVIDENCE || {});
    return buildCustomerControls(readPortalComplianceInput(globalThis));
  }
  render(){ this.innerHTML=buildComplianceCommandCenterMarkup({controls:this.controls(),scope:this.scope,now:this.now}); }
  bind(){
    this.querySelectorAll?.('[data-compliance-scope-switch]').forEach(button=>button.addEventListener('click',()=>{this.scope=button.dataset.complianceScopeSwitch;this.render();this.bind();}));
    this.querySelectorAll?.('[data-compliance-print]').forEach(button=>button.addEventListener('click',()=>globalThis.print?.()));
    this.querySelectorAll?.('[data-compliance-filter]').forEach(button=>button.addEventListener('click',()=>{const filter=button.dataset.complianceFilter;this.querySelectorAll('[data-compliance-filter]').forEach(x=>x.classList.toggle('is-active',x===button));this.querySelectorAll('[data-framework-row]').forEach(row=>row.hidden=filter!=='all'&&row.dataset.frameworkRow!==filter);}));
    this.querySelectorAll?.('[data-filter-framework]').forEach(button=>button.addEventListener('click',()=>{const target=this.querySelector(`[data-compliance-filter="${button.dataset.filterFramework}"]`);target?.click();this.querySelector('[data-compliance-section="control-matrix"]')?.scrollIntoView({behavior:'smooth',block:'start'});}));
    this.querySelectorAll?.('[data-control-jump]').forEach(button=>button.addEventListener('click',()=>this.querySelector(`#control-${CSS.escape(button.dataset.controlJump)}`)?.scrollIntoView({behavior:'smooth',block:'center'})));
  }
}

if(globalThis.customElements && !globalThis.customElements.get('bg-compliance-command-center')) globalThis.customElements.define('bg-compliance-command-center',ComplianceCommandCenter);
