import { normalizeEvidence } from './evidence.mjs';

export const PASSPORT_STATUSES = Object.freeze([
  'verified',
  'partially_verified',
  'unknown',
  'action_required',
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
  return buildDataAiPassport({
    generatedAt: raw.generatedAt || state?.sourceMeta?.updatedAt || null,
    controls: raw.controls || [],
  });
}
