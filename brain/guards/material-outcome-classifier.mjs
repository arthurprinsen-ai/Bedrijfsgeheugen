export const NON_MATERIAL_OUTCOMES = new Set([
  'OK',
  'HEALTHY',
  'NO_ACTION',
  'NO ACTION',
  'NO_CHANGE',
  'NO CHANGE',
  'NO_CHANGES',
  'NO CHANGES',
  'NO MATERIAL CHANGE',
  'NO MATERIAL CHANGES',
  'NOTHING TO DO',
  'GEEN ACTIE',
  'GEEN WIJZIGING',
  'GEEN WIJZIGINGEN'
]);

export function normalizeOutcome(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[.!]+$/g, '')
    .trim();
}

export function classifyMaterialOutcome(value) {
  const answer = String(value ?? '').trim();
  const normalized = normalizeOutcome(answer);
  const isMaterial = !NON_MATERIAL_OUTCOMES.has(normalized);
  return {
    answer,
    normalized,
    isMaterial,
    classification: isMaterial ? 'MATERIAL' : 'NON_MATERIAL'
  };
}

// Contract:
// - false negatives are more dangerous than false positives: uncertain outcomes remain MATERIAL.
// - NON_MATERIAL means BG168 dispatch is skipped, never that the primary agent result is suppressed.
// - primary result delivery must remain independent of optional learning/observability paths.
