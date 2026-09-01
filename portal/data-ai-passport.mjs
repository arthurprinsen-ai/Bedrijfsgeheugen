import { normalizeEvidence } from './evidence.mjs';

export const PASSPORT_STATUSES = Object.freeze([
  'verified',
  'partially_verified',
  'unknown',
  'action_required',
]);

export const DEFAULT_PASSPORT_CONTROLS = Object.freeze([
  { id:'data-residency', label:'Data residency', category:'Data', description:'Waar bedrijfsdata wordt opgeslagen en verwerkt.' },
  { id:'data-classification', label:'Dataclassificatie', category:'Data', description:'Welke gevoeligheidsklassen en omgangsregels zijn vastgelegd.' },
  { id:'retention', label:'Bewaartermijnen', category:'Data', description:'Of bewaartermijnen aantoonbaar zijn vastgelegd en toegepast.' },
  { id:'access-control', label:'Toegangsbeheer', category:'Security', description:'Wie toegang heeft tot data, modellen en AI-functionaliteit.' },
  { id:'model-register', label:'AI- en modelregister', category:'AI governance', description:'Welke modellen, providers en use-cases aantoonbaar in gebruik zijn.' },
  { id:'ai-risk-classification', label:'AI-risicoclassificatie', category:'AI governance', description:'Of AI-use-cases op risico en toepasselijke verplichtingen zijn geclassificeerd.' },
  { id:'human-oversight', label:'Menselijk toezicht', category:'AI governance', description:'Waar menselijke controle, bevoegdheden en escalatie zijn ingericht.' },
  { id:'privacy-impact', label:'Privacy- en impactbeoordeling', category:'Privacy', description:'Of relevante privacy- en impactbeoordelingen aantoonbaar aanwezig zijn.' },
  { id:'supplier-assurance', label:'Leveranciersbewijs', category:'Third party', description:'Contractuele, security- en governance-evidence van relevante leveranciers.' },
  { id:'monitoring-audit', label:'Monitoring & audit trail', category:'Operations', description:'Of beslissingen, modelgebruik, wijzigingen en incidenten herleidbaar worden vastgelegd.' },
]);

function evidenceList(input) {
  return (Array.isArray(input) ? input : []).map(normalizeEvidence);
}

export function normalizePassportControl(input = {}) {
  const evidence = evidenceList(input.evidence);
  const verifiedEvidence = evidence.filter(item => item.verified === true);
  const unresolvedEvidence = evidence.filter(item => item.verified !== true);
  const issue = String(input.issue || '').trim() || null;
  let status = 'unknown';

  if (issue) status = 'action_required';
  else if (verifiedEvidence.length && unresolvedEvidence.length) status = 'partially_verified';
  else if (verifiedEvidence.length && verifiedEvidence.length === evidence.length) status = 'verified';

  return Object.freeze({
    id: String(input.id || ''),
    label: String(input.label || input.id || ''),
    category: String(input.category || 'Governance'),
    description: String(input.description || ''),
    claim: input.claim == null ? null : String(input.claim),
    owner: input.owner == null ? null : String(input.owner),
    issue,
    status,
    verified: status === 'verified',
    evidence,
    evidenceCount: evidence.length,
    verifiedEvidenceCount: verifiedEvidence.length,
    updatedAt: input.updatedAt || null,
  });
}

export function buildDataAiPassport(input = {}) {
  const controls = (Array.isArray(input.controls) ? input.controls : []).map(normalizePassportControl);
  const count = status => controls.filter(item => item.status === status).length;
  const total = controls.length;
  const verified = count('verified');
  const partiallyVerified = count('partially_verified');
  const unknown = count('unknown');
  const actionRequired = count('action_required');

  return Object.freeze({
    version: 1,
    kind: 'data-ai-passport',
    complianceClaim: 'evidence-status-only',
    generatedAt: input.generatedAt || null,
    controls,
    summary: Object.freeze({
      total,
      verified,
      partiallyVerified,
      unknown,
      actionRequired,
      coveragePct: total ? Math.round((verified / total) * 100) : 0,
    }),
  });
}

export function buildPassportFromState(state = {}) {
  const raw = state?.dataAiPassport || {};
  const supplied = Array.isArray(raw.controls) ? raw.controls : [];
  const suppliedById = new Map(supplied.map(item => [String(item?.id || ''), item]));
  const controls = DEFAULT_PASSPORT_CONTROLS.map(base => ({ ...base, ...(suppliedById.get(base.id) || {}) }));
  for (const item of supplied) {
    if (!controls.some(control => control.id === item?.id)) controls.push(item);
  }
  return buildDataAiPassport({
    generatedAt: raw.generatedAt || state?.sourceMeta?.updatedAt || null,
    controls,
  });
}
