export const TRUTH_CLASSES = Object.freeze({
  SOURCE_FACT: 'SourceTruth',
  BUSINESS_TRUTH: 'BusinessTruth',
  DERIVED_TRUTH: 'DerivedTruth',
  AI_INTERPRETATION: 'AIInterpretation',
});

export const LIFECYCLE_STATES = Object.freeze({
  DRAFT: 'Draft', REVIEW: 'Review', APPROVED: 'Approved', ACTIVE: 'Active',
  SUSPENDED: 'Suspended', COMPLETED: 'Completed', RETIRED: 'Retired',
  REJECTED: 'Rejected', ARCHIVED: 'Archived',
});

export const VERIFICATION_STATES = Object.freeze({
  UNVERIFIED: 'Unverified', VERIFYING: 'Verifying', VERIFIED: 'Verified', FAILED: 'Failed',
});

export const FRESHNESS_STATES = Object.freeze({ CURRENT: 'Current', STALE: 'Stale', UNKNOWN: 'Unknown' });
export const HEALTH_STATES = Object.freeze({ HEALTHY: 'Healthy', ATTENTION: 'Attention', CRITICAL: 'Critical', INSUFFICIENT_DATA: 'InsufficientData' });

const truthValues = new Set(Object.values(TRUTH_CLASSES));
const lifecycleValues = new Set(Object.values(LIFECYCLE_STATES));

function requiredString(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} is required`);
}

export function assertCanonicalObject(object) {
  if (!object || typeof object !== 'object') throw new TypeError('canonical object is required');
  requiredString(object.id, 'id');
  requiredString(object.type, 'type');
  requiredString(object.tenantId, 'tenantId');
  if (!truthValues.has(object.truthClass)) throw new TypeError('truthClass is invalid');
  if (!lifecycleValues.has(object.lifecycle)) throw new TypeError('lifecycle is invalid');
  if (!Number.isInteger(object.version) || object.version < 1) throw new TypeError('version must be a positive integer');
  if (!object.provenance || typeof object.provenance !== 'object') throw new TypeError('provenance is required');
  requiredString(object.provenance.sourceType, 'provenance.sourceType');
  requiredString(object.provenance.sourceRef, 'provenance.sourceRef');
  return true;
}

export function createCanonicalObject(input) {
  const object = {
    id: input.id,
    type: input.type,
    tenantId: input.tenantId,
    truthClass: input.truthClass,
    lifecycle: input.lifecycle,
    version: input.version,
    health: input.health ?? HEALTH_STATES.INSUFFICIENT_DATA,
    verification: input.verification ?? VERIFICATION_STATES.UNVERIFIED,
    freshness: input.freshness ?? FRESHNESS_STATES.UNKNOWN,
    ownerId: input.ownerId ?? null,
    provenance: input.provenance ? Object.freeze({ ...input.provenance }) : null,
    data: Object.freeze({ ...(input.data ?? {}) }),
    createdAt: input.createdAt ?? null,
    updatedAt: input.updatedAt ?? null,
  };
  assertCanonicalObject(object);
  return Object.freeze(object);
}
