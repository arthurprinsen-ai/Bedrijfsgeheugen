import { createCanonicalObject, HEALTH_STATES, LIFECYCLE_STATES, TRUTH_CLASSES, VERIFICATION_STATES } from '../contracts/canonical-object.mjs';

export function adaptMakeScenario({ tenantId, scenarioId, name, enabled, lastSuccessAt = null, lastError = null, operations = null, cost = null, criticality = 'Unknown', version = 1 }) {
  if (!tenantId || !scenarioId || !name) throw new TypeError('make adapter requires tenantId, scenarioId and name');
  const failed = Boolean(lastError);
  return createCanonicalObject({
    id: `INTEGRATION-MAKE-${scenarioId}`,
    type: 'Integration',
    tenantId,
    truthClass: TRUTH_CLASSES.SOURCE_FACT,
    lifecycle: enabled ? LIFECYCLE_STATES.ACTIVE : LIFECYCLE_STATES.SUSPENDED,
    version,
    health: failed ? HEALTH_STATES.ATTENTION : HEALTH_STATES.HEALTHY,
    verification: failed ? VERIFICATION_STATES.FAILED : VERIFICATION_STATES.VERIFIED,
    provenance: { sourceType: 'make', sourceRef: String(scenarioId) },
    data: { name, enabled: Boolean(enabled), lastSuccessAt, lastError, operations, cost, criticality },
  });
}
