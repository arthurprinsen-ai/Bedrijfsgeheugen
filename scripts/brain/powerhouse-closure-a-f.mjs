const PARITY_STATES = new Set(['native', 'superseded', 'retired']);
const CYCLE_STAGES = Object.freeze([
  'signal','analysis','prediction','decision','execution','provider_readback',
  'outcome','realized_value','calibration','next_decision',
]);
const REALIZED_VALUE_TYPES = new Set(['revenue','cost_saving','hours_saved','risk_reduction','conversion','custom']);

export function validateParityRegistry(registry = {}) {
  const errors = [];
  if (!Array.isArray(registry.capabilities) || registry.capabilities.length === 0) {
    errors.push('capabilities must be a non-empty array');
    return { ok:false, errors };
  }
  const ids = new Set();
  for (const capability of registry.capabilities) {
    const id = capability?.id;
    if (!id) errors.push('capability id is required');
    else if (ids.has(id)) errors.push(`duplicate capability id: ${id}`);
    else ids.add(id);
    if (!PARITY_STATES.has(capability?.status)) errors.push(`${id || '<unknown>'}: invalid parity status`);
    if (!capability?.evidence?.source) errors.push(`${id || '<unknown>'}: source evidence is required`);
    if (capability?.status === 'native') {
      if (!capability?.target?.pageId && !capability?.target?.route) errors.push(`${id || '<unknown>'}: native target is required`);
      if (!Array.isArray(capability?.evidence?.browser?.assertions) || capability.evidence.browser.assertions.length === 0) errors.push(`${id || '<unknown>'}: browser assertions are required`);
    }
    if (capability?.status === 'superseded') {
      if (!capability?.supersededBy) errors.push(`${id || '<unknown>'}: supersededBy is required`);
      if (!Array.isArray(capability?.evidence?.browser?.assertions) || capability.evidence.browser.assertions.length === 0) errors.push(`${id || '<unknown>'}: browser assertions are required for supersession proof`);
    }
    if (capability?.status === 'retired' && !capability?.retirementReason) errors.push(`${id || '<unknown>'}: retirementReason is required`);
  }
  return { ok: errors.length === 0, errors };
}

export function validateCycle(cycle = {}) {
  const errors = [];
  if (!cycle.tenantId) errors.push('tenantId is required');
  if (!cycle.cycleId) errors.push('cycleId is required');
  if (!Array.isArray(cycle.stages)) errors.push('stages must be an array');
  else {
    let previousSequence = 0;
    let previousStageIndex = -1;
    for (const stage of cycle.stages) {
      if (stage.tenantId !== cycle.tenantId) errors.push(`cross-tenant stage rejected: ${stage.stage || '<unknown>'}`);
      const stageIndex = CYCLE_STAGES.indexOf(stage.stage);
      if (stageIndex < 0) errors.push(`unknown stage: ${stage.stage}`);
      if (!Number.isInteger(stage.sequence) || stage.sequence <= previousSequence) errors.push(`stage sequence must be strictly increasing: ${stage.stage}`);
      if (stageIndex >= 0 && stageIndex <= previousStageIndex) errors.push(`stage order invalid: ${stage.stage}`);
      if (!stage.evidenceRef) errors.push(`evidence required: ${stage.stage}`);
      previousSequence = Math.max(previousSequence, Number(stage.sequence) || 0);
      previousStageIndex = Math.max(previousStageIndex, stageIndex);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function validateRealizedValue(observation = {}) {
  const errors = [];
  if (observation.truthClass !== 'realized') errors.push('truthClass must be realized');
  if (!REALIZED_VALUE_TYPES.has(observation.valueType)) errors.push('unsupported realized value type');
  if (!Number.isFinite(Number(observation.value))) errors.push('realized value must be numeric');
  if (!observation.evidenceRef) errors.push('realized value requires evidenceRef');
  if (!observation.observedAt || Number.isNaN(Date.parse(observation.observedAt))) errors.push('realized value requires observedAt');
  return { ok: errors.length === 0, errors };
}

export function reconcileObligation(obligation = {}, evidence = {}) {
  const conditions = Array.isArray(obligation.conditions) ? obligation.conditions : [];
  const remaining = conditions.filter((condition) => evidence[condition] !== true);
  const evidenceSnapshot = Object.fromEntries(conditions.map((condition) => [condition, evidence[condition] === true]));
  if (obligation.status === 'resolved' && remaining.length === 0) return { ...obligation, remaining: [], evidence: { ...(obligation.evidence || {}), ...evidenceSnapshot } };
  return { ...obligation, status: remaining.length === 0 ? 'resolved' : 'open', remaining, evidence: { ...(obligation.evidence || {}), ...evidenceSnapshot } };
}

export function validateLegacyLearningMappings(registry = {}) {
  const errors = [];
  if (!Array.isArray(registry.mappings) || registry.mappings.length === 0) {
    errors.push('mappings must be non-empty');
    return { ok:false, errors };
  }
  for (const mapping of registry.mappings) {
    if (!mapping.fingerprint) errors.push('legacy mapping fingerprint is required');
    if (!mapping.supersededBy) errors.push(`${mapping.fingerprint || '<unknown>'}: supersededBy is required`);
    if (!mapping.canonicalWriter || !/(Powerhouse|Supabase)/.test(mapping.canonicalWriter)) errors.push(`${mapping.fingerprint || '<unknown>'}: canonical writer must be Powerhouse/Supabase`);
    if (/\bMake\b/i.test(mapping.canonicalWriter || '')) errors.push(`${mapping.fingerprint || '<unknown>'}: Make cannot be an active canonical writer`);
    if (!mapping.evidencePreserved) errors.push(`${mapping.fingerprint || '<unknown>'}: evidence preservation is required`);
  }
  return { ok: errors.length === 0, errors };
}

export function evaluateEscapedDefect(defect = {}) {
  if (!defect.fingerprint || !defect.productionEvidence) return { status:'INVALID_DEFECT_RECORD', obligationOpen:true };
  if (!defect.regressionGuard) return { status:'OPEN_QUALITY_OBLIGATION', obligationOpen:true, fingerprint:defect.fingerprint };
  return { status:'GUARDED', obligationOpen:false, fingerprint:defect.fingerprint, regressionGuard:defect.regressionGuard };
}

export const CLOSURE_CYCLE_STAGES = CYCLE_STAGES;
