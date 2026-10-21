import { FUNCTIONAL_PARITY_MANIFEST } from './parity-manifest-functional.js';

const required = (record, field) => {
  const value = record?.[field];
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0 && field === 'legacyFields')) {
    if (field === 'legacyFields') return [];
    throw new Error(`PARITY_CERTIFICATE_MISSING_${String(field).toUpperCase()}:${record?.legacyCapability || 'unknown'}`);
  }
  return value;
};

/**
 * Machine-executable source of truth for legacy -> V2 parity certification.
 * A capability is intentionally NOT marked proven here: proof is emitted by
 * Playwright only after the native V2 route has been opened and inspected.
 */
export function buildParityCertificatePlan() {
  return Object.freeze(FUNCTIONAL_PARITY_MANIFEST.map(record => Object.freeze({
    legacyCapability: required(record, 'legacyCapability'),
    pageId: required(record, 'pageId'),
    dataSlice: required(record, 'dataSlice'),
    implementation: required(record, 'implementation'),
    stateProof: required(record, 'stateProof'),
    declaredBrowserSpec: required(record, 'browserProof'),
    legacyFields: Object.freeze([...(record.legacyFields || [])]),
    models: Object.freeze([...(record.models || [])]),
    calculations: Object.freeze([...(record.calculations || [])]),
    actions: Object.freeze([...(record.actions || [])]),
    certification: 'runtime-required'
  }))));
}

export function parityCertificateSummary() {
  const plan = buildParityCertificatePlan();
  return Object.freeze({
    total: plan.length,
    runtimeRequired: plan.filter(item => item.certification === 'runtime-required').length,
    capabilities: Object.freeze(plan.map(item => item.legacyCapability))
  });
}
