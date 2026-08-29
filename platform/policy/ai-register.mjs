export const AI_RISK_CLASSES = Object.freeze({
  PROHIBITED: 'Prohibited',
  POTENTIAL_HIGH_RISK: 'PotentialHighRisk',
  TRANSPARENCY: 'Transparency',
  OTHER: 'Other',
});

export const AI_USE_CASE_STATES = Object.freeze({
  DRAFT: 'Draft', CLASSIFICATION: 'Classification', CONTROLS_REQUIRED: 'ControlsRequired', REVIEW: 'Review',
  APPROVED: 'Approved', ACTIVE: 'Active', REASSESSMENT_REQUIRED: 'ReassessmentRequired', SUSPENDED: 'Suspended', RETIRED: 'Retired', BLOCKED: 'Blocked',
});

export function createAIUseCase(input) {
  for (const field of ['id','tenantId','purpose','ownerId','legalRole','riskClass','providerModelId']) {
    if (!input?.[field]) throw new TypeError(`${field} is required`);
  }
  if (!Array.isArray(input.dataClasses) || !input.dataClasses.length) throw new TypeError('dataClasses are required');
  const state = input.riskClass === AI_RISK_CLASSES.PROHIBITED ? AI_USE_CASE_STATES.BLOCKED : (input.state ?? AI_USE_CASE_STATES.DRAFT);
  return Object.freeze({
    id: input.id, tenantId: input.tenantId, purpose: input.purpose, ownerId: input.ownerId,
    legalRole: input.legalRole, riskClass: input.riskClass, providerModelId: input.providerModelId,
    dataClasses: Object.freeze([...input.dataClasses]), humanOversight: input.humanOversight ?? null,
    transparency: input.transparency ?? null, autonomy: input.autonomy ?? 'L0', controls: Object.freeze([...(input.controls ?? [])]),
    evidence: Object.freeze([...(input.evidence ?? [])]), reviewDate: input.reviewDate ?? null, state,
  });
}

export function canActivateAIUseCase(useCase) {
  if (useCase.riskClass === AI_RISK_CLASSES.PROHIBITED) return Object.freeze({ allowed: false, reason: 'PROHIBITED' });
  if (useCase.riskClass === AI_RISK_CLASSES.POTENTIAL_HIGH_RISK && !useCase.controls.includes('QUALIFIED_REVIEW_COMPLETE')) {
    return Object.freeze({ allowed: false, reason: 'QUALIFIED_REVIEW_REQUIRED' });
  }
  if (!useCase.humanOversight && useCase.autonomy !== 'L0') return Object.freeze({ allowed: false, reason: 'HUMAN_OVERSIGHT_UNDEFINED' });
  return Object.freeze({ allowed: true, reason: 'GATES_SATISFIED' });
}
