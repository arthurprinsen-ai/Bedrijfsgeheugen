import { buildPassportFromState } from './data-ai-passport.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const STATUS_LABELS = Object.freeze({
  verified: 'Geverifieerd',
  partially_verified: 'Gedeeltelijk geverifieerd',
  unknown: 'Nog te bewijzen',
  action_required: 'Actie nodig',
});

export function renderDataAiPassport(state = {}) {
  const passport = buildPassportFromState(state);
  const { summary } = passport;
  return `<section class="passport-page">
    <header class="passport-head">
      <div>
        <a class="passport-back" href="./index.html#/company/data">← Terug naar Data & systemen</a>
        <p class="eyebrow">DATA & AI PASSPORT</p>
        <h1>Bewijs boven aannames.</h1>
        <p>Dit overzicht toont uitsluitend wat aantoonbaar is. Een ontbrekende bron wordt nooit als compliance of zekerheid gepresenteerd.</p>
      </div>
      <div class="passport-score" aria-label="Geverifieerde bewijsdekking">
        <strong>${summary.coveragePct}%</strong>
        <span>geverifieerde controls</span>
      </div>
    </header>
    <div class="passport-summary">
      <div><strong>${summary.verified}</strong><span>Geverifieerd</span></div>
      <div><strong>${summary.partiallyVerified}</strong><span>Gedeeltelijk</span></div>
      <div><strong>${summary.unknown}</strong><span>Nog te bewijzen</span></div>
      <div><strong>${summary.actionRequired}</strong><span>Actie nodig</span></div>
    </div>
    <p class="passport-disclaimer">Dit passport is een evidence-statusoverzicht en geen juridisch certificaat of automatische complianceverklaring.</p>
    <div class="passport-grid">
      ${passport.controls.map(control => `<article class="passport-card status-${esc(control.status)}">
        <div class="passport-card-head"><span>${esc(control.category)}</span><b>${esc(STATUS_LABELS[control.status] || control.status)}</b></div>
        <h2>${esc(control.label)}</h2>
        <p>${esc(control.description)}</p>
        <dl>
          <div><dt>Eigenaar</dt><dd>${esc(control.owner || 'Niet vastgelegd')}</dd></div>
          <div><dt>Evidence</dt><dd>${control.verifiedEvidenceCount}/${control.evidenceCount} geverifieerd</dd></div>
          <div><dt>Claim</dt><dd>${esc(control.claim || 'Geen geverifieerde claim')}</dd></div>
          <div><dt>Open punt</dt><dd>${esc(control.issue || (control.status === 'unknown' ? 'Bron of bewijs ontbreekt' : 'Geen expliciete blokkade'))}</dd></div>
        </dl>
      </article>`).join('')}
    </div>
  </section>`;
}
