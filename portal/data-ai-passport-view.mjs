import { buildPassportFromState } from './data-ai-passport.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
const STATUS_LABELS = Object.freeze({verified:'Geverifieerd',partially_verified:'Gedeeltelijk geverifieerd',unknown:'Nog te bewijzen',action_required:'Actie nodig'});
const fact=(label,value)=>`<div class="passport-fact"><span>${esc(label)}</span><strong>${esc(value||'Nog te bewijzen')}</strong></div>`;

export function renderDataAiPassport(state = {}) {
  const passport = buildPassportFromState(state);
  const { summary, technicalFacts={} } = passport;
  const company=technicalFacts.tenantOwner||state?.company?.name||'Uw organisatie';
  return `<section class="passport-page">
    <header class="passport-head">
      <div>
        <a class="passport-back" href="https://www.bedrijfsgeheugen.nl/portal/index.html#/company/data">← Terug naar Data & systemen</a>
        <p class="eyebrow">DATA & AI PASSPORT · LIVE EVIDENCE</p>
        <h1>Waar gaat uw data heen?</h1>
        <p>Van bron tot opslag en AI-verwerking. Bekende feiten worden automatisch uit de live omgeving geladen; ontbrekende feiten blijven zichtbaar als <strong>nog te bewijzen</strong>.</p>
      </div>
      <div class="passport-score" aria-label="Evidence coverage">
        <strong>${summary.evidenceCoveragePct}%</strong>
        <span>controls met bewijs</span>
        <small>${summary.coveragePct}% volledig geverifieerd</small>
      </div>
    </header>

    <section class="passport-livebar" aria-label="Live platformfacts">
      ${fact('Data-eigenaar / tenant',company)}
      ${fact('Hosting & runtime',technicalFacts.hostingProvider)}
      ${fact('API verwerking',technicalFacts.processingRegion)}
      ${fact('Portal-state opslag',technicalFacts.storageRegion?`${technicalFacts.stateStore} · ${technicalFacts.storageRegion}`:technicalFacts.stateStore)}
      ${fact('Identiteit',technicalFacts.identityProvider)}
    </section>

    <section class="passport-flow" aria-label="Datastroom">
      <div><b>1</b><span>Bronnen</span><small>ERP · documenten · workflows</small></div><i>→</i>
      <div><b>2</b><span>Bedrijfsgeheugen</span><small>tenantcontext & autorisatie</small></div><i>→</i>
      <div><b>3</b><span>Automatisering</span><small>integraties / Make waar geconfigureerd</small></div><i>→</i>
      <div><b>4</b><span>AI</span><small>provider & model uit tenant-state</small></div><i>→</i>
      <div><b>5</b><span>Mens / agent</span><small>besluit, approval of actie</small></div><i>→</i>
      <div><b>6</b><span>Audit & opslag</span><small>bewijs terug naar het portaal</small></div>
    </section>

    <div class="passport-summary">
      <div><strong>${summary.verified}</strong><span>Geverifieerd</span></div>
      <div><strong>${summary.partiallyVerified}</strong><span>Gedeeltelijk</span></div>
      <div><strong>${summary.unknown}</strong><span>Nog te bewijzen</span></div>
      <div><strong>${summary.actionRequired}</strong><span>Actie nodig</span></div>
    </div>
    <p class="passport-disclaimer">Dit passport is een evidence-statusoverzicht en geen juridisch certificaat. EU AI Act- en AVG-conclusies worden alleen getoond wanneer de benodigde use-case-, contract- en verwerkingsinformatie aantoonbaar aanwezig is.</p>
    <div class="passport-grid">
      ${passport.controls.map(control => `<article class="passport-card status-${esc(control.status)}">
        <div class="passport-card-head"><span>${esc(control.category)}</span><b>${esc(STATUS_LABELS[control.status] || control.status)}</b></div>
        <h2>${esc(control.label)}</h2>
        <p>${esc(control.description)}</p>
        <dl>
          <div><dt>Eigenaar</dt><dd>${esc(control.owner || 'Niet vastgelegd')}</dd></div>
          <div><dt>Evidence</dt><dd>${control.verifiedEvidenceCount}/${control.evidenceCount} geverifieerd</dd></div>
          <div><dt>Wat weten we?</dt><dd>${esc(control.claim || 'Geen geverifieerde claim')}</dd></div>
          <div><dt>Status</dt><dd>${esc(control.issue || (control.status === 'unknown' ? 'Bron of bewijs ontbreekt' : control.status === 'partially_verified' ? 'Een deel van het bewijs ontbreekt nog' : 'Geen expliciete blokkade'))}</dd></div>
        </dl>
        ${control.evidenceCount?`<details><summary>Bekijk bewijsbronnen (${control.evidenceCount})</summary><ul>${control.evidence.map(e=>`<li><b>${e.verified?'✓':'○'}</b> ${esc(e.source)} <small>${esc(e.sourceType)}${e.retrievedAt?` · ${esc(e.retrievedAt)}`:''}</small></li>`).join('')}</ul></details>`:''}
      </article>`).join('')}
    </div>
  </section>`;
}
