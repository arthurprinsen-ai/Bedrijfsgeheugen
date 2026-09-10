import { REGELGEVING } from './regelgeving.js';

/**
 * Data & AI Passport en het EU AI Act-auditrapport.
 *
 * Geport uit portal/data-ai-passport.mjs, portal/evidence.mjs en
 * portal/eu-ai-act-audit-report.mjs. Die zaten alleen in het oude `portal`-spoor
 * en stonden live op /portal/data-ai-passport; Portal V2 kende ze niet.
 *
 * De kern is bewust ongewijzigd: een control is pas geverifieerd als álle
 * bewijsstukken geverifieerd zijn, en de uitkomst is een bewijsstatus, geen
 * complianceverklaring. Wat is toegevoegd, is de koppeling met
 * regelgeving.js: het Passport telt nu de AI Act-mijlpalen die dit register al
 * bijhoudt, in plaats van een eigen tijdlijn te dragen die apart veroudert.
 */

const arr = value => (Array.isArray(value) ? value : []);
const txt = value => (value == null ? '' : String(value));
const at = (state, pad) => String(pad || '').split('.').filter(Boolean)
  .reduce((waarde, sleutel) => (waarde == null ? undefined : waarde[sleutel]), state);

export const PASSPORT_STATUSSEN = Object.freeze(['verified', 'partially_verified', 'unknown', 'action_required']);

export const STATUS_LABEL = Object.freeze({
  verified: 'Geverifieerd',
  partially_verified: 'Gedeeltelijk geverifieerd',
  unknown: 'Nog te bewijzen',
  action_required: 'Actie nodig'
});

/** De tien controls uit het oude portaal, ongewijzigd overgenomen. */
export const STANDAARD_CONTROLS = Object.freeze([
  { id: 'data-residency', label: 'Data residency', categorie: 'Data', uitleg: 'Waar bedrijfsdata wordt opgeslagen en verwerkt.' },
  { id: 'data-classification', label: 'Dataclassificatie', categorie: 'Data', uitleg: 'Welke gevoeligheidsklassen en omgangsregels zijn vastgelegd.' },
  { id: 'retention', label: 'Bewaartermijnen', categorie: 'Data', uitleg: 'Of bewaartermijnen aantoonbaar zijn vastgelegd en toegepast.' },
  { id: 'access-control', label: 'Toegangsbeheer', categorie: 'Security', uitleg: 'Wie toegang heeft tot data, modellen en AI-functionaliteit.' },
  { id: 'model-register', label: 'AI- en modelregister', categorie: 'AI governance', uitleg: 'Welke modellen, providers en use-cases aantoonbaar in gebruik zijn.' },
  { id: 'ai-risk-classification', label: 'AI-risicoclassificatie', categorie: 'AI governance', uitleg: 'Of AI-use-cases op risico en toepasselijke verplichtingen zijn geclassificeerd.' },
  { id: 'human-oversight', label: 'Menselijk toezicht', categorie: 'AI governance', uitleg: 'Waar menselijke controle, bevoegdheden en escalatie zijn ingericht.' },
  { id: 'privacy-impact', label: 'Privacy- en impactbeoordeling', categorie: 'Privacy', uitleg: 'Of relevante privacy- en impactbeoordelingen aantoonbaar aanwezig zijn.' },
  { id: 'supplier-assurance', label: 'Leveranciersbewijs', categorie: 'Third party', uitleg: 'Contractuele, security- en governance-evidence van relevante leveranciers.' },
  { id: 'monitoring-audit', label: 'Monitoring en audittrail', categorie: 'Operations', uitleg: 'Of beslissingen, modelgebruik, wijzigingen en incidenten herleidbaar worden vastgelegd.' }
]);

/** Bewijsstuk normaliseren; de betrouwbaarheidsschaal komt uit het oude portaal. */
export function normaliseerBewijs(input = {}) {
  const score = Number(input.confidence || 0);
  const label = !Number.isFinite(score) ? 'Onbekend'
    : score >= 90 ? 'Geverifieerd'
    : score >= 75 ? 'Hoge zekerheid'
    : score >= 50 ? 'Redelijke zekerheid'
    : score > 0 ? 'Lage zekerheid' : 'Onbekend';
  return Object.freeze({
    id: txt(input.id), bron: txt(input.source || input.bron || 'Onbekende bron'),
    soort: txt(input.sourceType || input.soort || 'intern'),
    opgehaald: input.retrievedAt || input.opgehaald || null,
    zekerheid: Number.isFinite(score) ? score : 0, zekerheidLabel: label,
    geverifieerd: Boolean(input.verified ?? input.geverifieerd),
    aiGegenereerd: Boolean(input.aiGenerated ?? input.aiGegenereerd),
    model: input.model || null
  });
}

/**
 * Een control krijgt zijn status uit het bewijs, niet uit een bewering.
 * Volgorde is bewust: een openstaand punt wint van alles.
 */
export function normaliseerControl(input = {}) {
  const bewijs = arr(input.evidence || input.bewijs).map(normaliseerBewijs);
  const geverifieerd = bewijs.filter(item => item.geverifieerd === true);
  const open = bewijs.filter(item => item.geverifieerd !== true);
  const punt = txt(input.issue || input.punt).trim() || null;
  let status = 'unknown';
  if (punt) status = 'action_required';
  else if (geverifieerd.length && open.length) status = 'partially_verified';
  else if (geverifieerd.length && geverifieerd.length === bewijs.length) status = 'verified';
  return Object.freeze({
    id: txt(input.id), label: txt(input.label || input.id), categorie: txt(input.categorie || input.category || 'Governance'),
    uitleg: txt(input.uitleg || input.description), claim: input.claim == null ? null : txt(input.claim),
    eigenaar: input.owner == null && input.eigenaar == null ? null : txt(input.owner ?? input.eigenaar),
    punt, status, geverifieerd: status === 'verified',
    bewijs, bewijsAantal: bewijs.length, bewijsGeverifieerd: geverifieerd.length,
    bijgewerkt: input.updatedAt || input.bijgewerkt || null
  });
}

function voegSamen(...lijsten) {
  const kaart = new Map();
  for (const lijst of lijsten) for (const item of arr(lijst)) {
    const id = txt(item?.id);
    if (!id) continue;
    const vorig = kaart.get(id) || {};
    kaart.set(id, { ...vorig, ...item, evidence: [...arr(vorig.evidence), ...arr(item?.evidence)] });
  }
  return [...kaart.values()];
}

/** Het Passport uit de klantstate. Zonder gegevens: tien controls op 'nog te bewijzen'. */
export function bouwPassport(state = {}) {
  const expliciet = at(state, 'portal.dataAiPassport') || {};
  const runtime = at(state, 'portal.runtime.passport') || {};
  const samengevoegd = voegSamen(runtime.controls, expliciet.controls);
  const aangeleverd = new Map(samengevoegd.map(item => [txt(item?.id), item]));
  const controls = STANDAARD_CONTROLS
    .map(basis => normaliseerControl({ ...basis, ...(aangeleverd.get(basis.id) || {}) }));
  for (const item of samengevoegd)
    if (!controls.some(control => control.id === txt(item?.id))) controls.push(normaliseerControl(item));

  const tel = status => controls.filter(control => control.status === status).length;
  const totaal = controls.length;
  const verified = tel('verified');
  const deels = tel('partially_verified');
  return Object.freeze({
    versie: 3, soort: 'data-ai-passport', claim: 'alleen bewijsstatus',
    gegenereerd: expliciet.generatedAt || runtime.generatedAt || null,
    technischeFeiten: Object.freeze({ ...(runtime.technicalFacts || expliciet.technicalFacts || {}) }),
    aiAct: runtime.aiAct || expliciet.aiAct || null,
    controls,
    samenvatting: Object.freeze({
      totaal, verified, deels, onbekend: tel('unknown'), actie: tel('action_required'),
      dekkingPct: totaal ? Math.round(verified / totaal * 100) : 0,
      bewijsdekkingPct: totaal ? Math.round((verified + deels) / totaal * 100) : 0
    })
  });
}

/**
 * Het auditrapport. Nieuw ten opzichte van het oude portaal: de baseline komt
 * uit regelgeving.js, zodat de AI Act-data op één plek worden bijgehouden en
 * niet op twee plekken apart verouderen.
 */
export function bouwAuditRapport(state = {}) {
  const passport = bouwPassport(state);
  const act = passport.aiAct || {};
  const controls = arr(act.controls);
  const bevindingen = arr(act.findings);
  const systemen = arr(act.systems);
  const aiRegels = REGELGEVING.filter(regel => regel.categorie === 'ai');
  const mijlpalen = aiRegels.flatMap(regel => arr(regel.mijlpalen).map(m => ({ ...m, regel: regel.naam })));
  return Object.freeze({
    soort: 'eu-ai-act-auditrapport',
    scope: Object.freeze({ systemen: systemen.length, useCases: systemen.map(s => txt(s.useCaseId)) }),
    baseline: Object.freeze({
      bron: 'portal-v2/regelgeving.js',
      regels: aiRegels.map(regel => regel.naam),
      mijlpalen: mijlpalen.sort((a, b) => txt(a.datum).localeCompare(txt(b.datum)))
    }),
    conclusie: txt(act.summary?.conclusion) || 'Scope nog niet bepaalbaar zonder eigen gegevens.',
    inventaris: systemen,
    controls,
    bewijsindex: controls.flatMap(control => arr(control.evidenceRefs)
      .map(ref => ({ ref, controlId: control.id, useCaseId: control.useCaseId, artikel: control.article }))),
    bevindingen,
    verantwoordelijkheid: systemen.map(s => ({ useCaseId: txt(s.useCaseId), rol: txt(s.role), risicoklasse: txt(s.riskClass) })),
    transparantie: controls.filter(control => txt(control.article) === 'Article 50'),
    voorbehoud: 'Bewijsgebonden assurance-overzicht, geen juridisch certificaat en geen algemene EU AI Act-complianceverklaring.'
  });
}

export const PASSPORT_VERSION = '2026-09-10-v1';
