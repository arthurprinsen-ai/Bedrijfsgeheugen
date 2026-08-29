export const RELATION_KINDS = Object.freeze({
  PART_OF: 'PART_OF', CONTAINS: 'CONTAINS', BELONGS_TO: 'BELONGS_TO',
  OWNED_BY: 'OWNED_BY', RESPONSIBLE_BY: 'RESPONSIBLE_BY', APPROVED_BY: 'APPROVED_BY',
  SUPPORTS: 'SUPPORTS', MEASURES: 'MEASURES', ALIGNS_WITH: 'ALIGNS_WITH', CONTRADICTS: 'CONTRADICTS',
  IMPLEMENTS: 'IMPLEMENTS', DEPENDS_ON: 'DEPENDS_ON', BLOCKS: 'BLOCKS', DELIVERS: 'DELIVERS',
  REQUIRES: 'REQUIRES', USES: 'USES', PRODUCES: 'PRODUCES', SUPPORTED_BY: 'SUPPORTED_BY',
  DOCUMENTS: 'DOCUMENTS', EXPLAINS: 'EXPLAINS', EVIDENCES: 'EVIDENCES', SUPERSEDES: 'SUPERSEDES',
  TARGETS: 'TARGETS', ADDRESSES: 'ADDRESSES', OFFERS: 'OFFERS', PRICED_BY: 'PRICED_BY', CONVERTED_FROM: 'CONVERTED_FROM',
  EXPOSES: 'EXPOSES', MITIGATED_BY: 'MITIGATED_BY', CONTROLLED_BY: 'CONTROLLED_BY',
  CHANGES: 'CHANGES', AFFECTS: 'AFFECTS', VERIFIES: 'VERIFIES',
  CONTRIBUTES_TO: 'CONTRIBUTES_TO', CAUSED_BY: 'CAUSED_BY', VALIDATES: 'VALIDATES',
});

export const RELATION_ORIGINS = Object.freeze({ EXPLICIT: 'Explicit', DERIVED: 'Derived', INFERRED: 'Inferred' });
export const CAUSALITY_LEVELS = Object.freeze({ CORRELATES: 'Correlates', MAY_INFLUENCE: 'MayInfluence', LIKELY_CAUSES: 'LikelyCauses', CAUSES: 'Causes' });

const kinds = new Set(Object.values(RELATION_KINDS));
const origins = new Set(Object.values(RELATION_ORIGINS));
const causalities = new Set(Object.values(CAUSALITY_LEVELS));

function requiredString(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} is required`);
}

export function assertRelationship(rel) {
  if (!rel || typeof rel !== 'object') throw new TypeError('relationship is required');
  requiredString(rel.id, 'id');
  requiredString(rel.tenantId, 'tenantId');
  requiredString(rel.fromId, 'fromId');
  requiredString(rel.toId, 'toId');
  if (!kinds.has(rel.kind)) throw new TypeError('kind is invalid');
  if (!origins.has(rel.origin)) throw new TypeError('origin is invalid');
  if (typeof rel.confidence !== 'number' || rel.confidence < 0 || rel.confidence > 1) throw new TypeError('confidence must be between 0 and 1');
  if (rel.causality !== null && !causalities.has(rel.causality)) throw new TypeError('causality is invalid');
  if (!rel.provenance || typeof rel.provenance !== 'object') throw new TypeError('provenance is required');
  requiredString(rel.provenance.sourceType, 'provenance.sourceType');
  requiredString(rel.provenance.sourceRef, 'provenance.sourceRef');
  return true;
}

export function createRelationship(input) {
  const rel = {
    id: input.id, tenantId: input.tenantId, fromId: input.fromId, toId: input.toId,
    kind: input.kind, origin: input.origin ?? RELATION_ORIGINS.EXPLICIT,
    confidence: input.confidence ?? 1, causality: input.causality ?? null,
    criticality: input.criticality ?? null,
    validFrom: input.validFrom ?? null, validUntil: input.validUntil ?? null,
    lastVerifiedAt: input.lastVerifiedAt ?? null,
    provenance: input.provenance ? Object.freeze({ ...input.provenance }) : null,
  };
  assertRelationship(rel);
  return Object.freeze(rel);
}
