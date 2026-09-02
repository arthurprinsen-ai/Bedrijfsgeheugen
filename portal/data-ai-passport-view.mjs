import { buildPassportFromState } from './data-ai-passport.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const STATUS_LABELS = Object.freeze({verified:'Geverifieerd',partially_verified:'Gedeeltelijk geverifieerd',unknown:'Nog te bewijzen',action_required:'Actie nodig'});
const fact=(label,value)=>`<div class="passport-fact"><span>${esc(label)}</span><strong>${esc(value||'Nog te bewijzen')}</strong></div>`;
const control=(passport,id)=>passport.controls.find(item=>item.id===id)||{};
const flowStep=({id,index,label,kicker,detail,status='unknown',active=false})=>`<button type="button" class="passport-flow-node status-${esc(status)}" data-flow-step="${esc(id)}" aria-pressed="${active?'true':'false'}"><span class="flow-index">0${index}</span><span class="flow-pulse" aria-hidden="true"></span><strong>${esc(label)}</strong><small>${esc(kicker)}</small><span class="flow-status">${esc(STATUS_LABELS[status]||status)}</span><span class="flow-hidden" data-flow-detail>${esc(detail)}</span></button>`;

export function renderDataAiPassport(state = {}) {
  const passport = buildPassportFromState(state);
  const { summary, technicalFacts={} } = passport;
  const company=technicalFacts.tenantOwner||state?.company?.name||'Uw organisatie';
  const residency=control(passport,'data-residency');
  const models=control(passport,'model-register');
  const transfer=control(passport,'cross-border-transfer');
  const audit=control(passport,'monitoring-audit');
  const oversight=control(passport,'human-oversight');
  const steps=[
    {id:'source',index:1,label:'Klantbron',kicker:'ERP · documenten · systemen',detail:`Data-eigenaar: ${company}. Alleen gekoppelde bronnen komen de tenantcontext binnen.`,status:'unknown',active:true},
    {id:'tenant',index:2,label:'Bedrijfsgeheugen',kicker:'Tenant · identiteit · autorisatie',detail:`Runtime: ${technicalFacts.hostingProvider||'Nog te bewijzen'} · API verwerking: ${technicalFacts.processingRegion||'Nog te bewijzen'}.`,status:residency.status||'unknown'},
    {id:'workflow',index:3,label:'Workflow',kicker:'Orchestratie · minimale context',detail:'Automatisering verwerkt alleen de context die voor de geconfigureerde taak nodig is. Leverancier en route blijven onderdeel van het bewijsregister.',status:control(passport,'supplier-assurance').status||'unknown'},
    {id:'ai',index:4,label:'AI',kicker:'Model · provider · use-case',detail:`${models.claim||'AI-provider en model nog te bewijzen.'} ${transfer.claim||''}`.trim(),status:models.status||'unknown'},
    {id:'storage',index:5,label:'Opslag',kicker:technicalFacts.storageRegion||'Regio nog te bewijzen',detail:`${technicalFacts.stateStore||'Opslag nog te bewijzen'} · ${technicalFacts.storageRegion||'locatie nog te bewijzen'}.`,status:residency.status||'unknown'},
    {id:'audit',index:6,label:'Audit',kicker:'Evidence · menselijke regie',detail:`${audit.claim||'Auditbewijs nog te bewijzen'} ${oversight.claim||''}`.trim(),status:audit.status||'unknown'}
  ];
  return `<section class="passport-page">
    <header class="passport-head">
      <div><a class="passport-back" href="https://www.bedrijfsgeheugen.nl/portal/index.html#/company/data">← Terug naar Data & systemen</a><p class="eyebrow">DATA & AI PASSPORT · LIVE EVIDENCE</p><h1>Volg uw data.<br><em>Bewijs elke stap.</em></h1><p>Geen complianceposter, maar een levende trust journey. Selecteer een knooppunt en zie wat aantoonbaar gebeurt — inclusief locaties buiten de EER wanneer die mogelijk zijn.</p></div>
      <div class="passport-score" aria-label="Evidence coverage"><span class="score-orbit" aria-hidden="true"></span><strong>${summary.evidenceCoveragePct}%</strong><span>evidence coverage</span><small>${summary.coveragePct}% volledig geverifieerd</small></div>
    </header>

    <section class="passport-livebar" aria-label="Live platformfacts">${fact('Data-eigenaar / tenant',company)}${fact('Hosting & runtime',technicalFacts.hostingProvider)}${fact('API verwerking',technicalFacts.processingRegion)}${fact('Portal-state opslag',technicalFacts.storageRegion?`${technicalFacts.stateStore} · ${technicalFacts.storageRegion}`:technicalFacts.stateStore)}${fact('Identiteit',technicalFacts.identityProvider)}</section>

    <section class="passport-orbit" aria-label="Interactieve Data & AI trust journey">
      <div class="orbit-head"><div><p class="eyebrow">LIVE TRUST JOURNEY</p><h2>Van bron naar bewijs</h2></div><p>Selecteer een stap. De lijn toont de bestuurbare keten; de status komt uit hetzelfde evidence-model als het Passport.</p></div>
      <div class="passport-flow" role="group" aria-label="Selecteer een stap in de datastroom">${steps.map(flowStep).join('<span class="flow-link" aria-hidden="true"><i></i></span>')}</div>
      <div class="flow-inspector" aria-live="polite"><div><span class="inspector-kicker">01 · KLANTBRON</span><h3 id="flow-detail-title">Klantbron</h3></div><p id="flow-detail-copy">${esc(steps[0].detail)}</p><span class="inspector-hint">Tik op een knooppunt om de keten te onderzoeken</span></div>
      <div class="trust-boundary"><span>EU DATA ANCHOR</span><strong>${esc(technicalFacts.storageRegion||'Opslagregio nog te bewijzen')}</strong><i></i><span>PROCESSING REALITY</span><strong>${esc(transfer.claim||technicalFacts.processingRegion||'Verwerkingsroute nog te bewijzen')}</strong></div>
    </section>

    <div class="passport-summary"><div><strong>${summary.verified}</strong><span>Geverifieerd</span></div><div><strong>${summary.partiallyVerified}</strong><span>Gedeeltelijk</span></div><div><strong>${summary.unknown}</strong><span>Nog te bewijzen</span></div><div><strong>${summary.actionRequired}</strong><span>Actie nodig</span></div></div>
    <p class="passport-disclaimer">Dit passport is een evidence-statusoverzicht en geen juridisch certificaat. EU AI Act- en AVG-conclusies worden alleen getoond wanneer de benodigde use-case-, contract- en verwerkingsinformatie aantoonbaar aanwezig is.</p>
    <div class="passport-grid">${passport.controls.map(control => `<article class="passport-card status-${esc(control.status)}"><div class="passport-card-head"><span>${esc(control.category)}</span><b>${esc(STATUS_LABELS[control.status] || control.status)}</b></div><h2>${esc(control.label)}</h2><p>${esc(control.description)}</p><dl><div><dt>Eigenaar</dt><dd>${esc(control.owner || 'Niet vastgelegd')}</dd></div><div><dt>Evidence</dt><dd>${control.verifiedEvidenceCount}/${control.evidenceCount} geverifieerd</dd></div><div><dt>Wat weten we?</dt><dd>${esc(control.claim || 'Geen geverifieerde claim')}</dd></div><div><dt>Status</dt><dd>${esc(control.issue || (control.status === 'unknown' ? 'Bron of bewijs ontbreekt' : control.status === 'partially_verified' ? 'Een deel van het bewijs ontbreekt nog' : 'Geen expliciete blokkade'))}</dd></div></dl>${control.evidenceCount?`<details><summary>Bekijk bewijsbronnen (${control.evidenceCount})</summary><ul>${control.evidence.map(e=>`<li><b>${e.verified?'✓':'○'}</b> ${esc(e.source)} <small>${esc(e.sourceType)}${e.retrievedAt?` · ${esc(e.retrievedAt)}`:''}</small></li>`).join('')}</ul></details>`:''}</article>`).join('')}</div>
  </section>`;
}
