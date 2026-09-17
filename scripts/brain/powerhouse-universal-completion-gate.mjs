export const UNIVERSAL_COMPLETION_VERSION = 'POWERHOUSE-UNIVERSAL-COMPLETION-v1';

export const REQUIRED_COMPLETION_CATEGORIES = Object.freeze([
  'goal_context',
  'actions',
  'changed_components',
  'decisions',
  'errors_incidents',
  'root_cause',
  'fixes',
  'tests_gates',
  'production_readback',
  'outcome_value',
  'open_obligations',
  'regression_prevention',
  'documentation',
  'learning_writeback',
  'architecture_adr_system_map',
  'ownership_successor',
  'security_privacy_secrets',
  'cost_performance',
  'runtime_identity',
  'interruption_recovery',
  'evidence_lineage'
]);

const MATERIAL_LEARNING_TRIGGERS = new Set([
  'changed_components', 'decisions', 'errors_incidents', 'root_cause', 'fixes',
  'regression_prevention', 'architecture_adr_system_map', 'cost_performance'
]);

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasEvidence(entry) {
  return Array.isArray(entry?.evidence) && entry.evidence.length > 0 && entry.evidence.every(item =>
    item && typeof item === 'object' && nonEmptyString(item.source) && nonEmptyString(item.observedAt));
}

function categoryIsMaterial(manifest, name) {
  const entry = manifest?.categories?.[name];
  return MATERIAL_LEARNING_TRIGGERS.has(name) && entry?.state === 'COMPLETE';
}

export function evaluateUniversalCompletion(manifest = {}) {
  const failures = [];
  if (manifest.version !== 'POWERHOUSE-UNIVERSAL-COMPLETION-MANIFEST-v1') failures.push('manifest version missing or unsupported');
  if (!nonEmptyString(manifest.runId)) failures.push('runId is required');
  if (!['LIVE & BEWEZEN', 'BLOCKED_HARD_BOUNDARY'].includes(manifest.terminalState)) failures.push('terminalState must be LIVE & BEWEZEN or BLOCKED_HARD_BOUNDARY');
  if (!manifest.categories || typeof manifest.categories !== 'object' || Array.isArray(manifest.categories)) failures.push('categories object is required');

  for (const category of REQUIRED_COMPLETION_CATEGORIES) {
    const entry = manifest?.categories?.[category];
    if (!entry) { failures.push(`missing required category: ${category}`); continue; }
    if (!['COMPLETE', 'NOT_APPLICABLE'].includes(entry.state)) {
      failures.push(`${category}: state must be COMPLETE or NOT_APPLICABLE`);
      continue;
    }
    if (entry.state === 'COMPLETE' && !hasEvidence(entry)) failures.push(`${category}: COMPLETE requires evidence with source and observedAt`);
    if (entry.state === 'NOT_APPLICABLE' && !nonEmptyString(entry.reason)) failures.push(`${category}: NOT_APPLICABLE requires reason`);
  }

  const materialLearningExists = REQUIRED_COMPLETION_CATEGORIES.some(name => categoryIsMaterial(manifest, name));
  if (materialLearningExists && manifest?.categories?.learning_writeback?.state !== 'COMPLETE') {
    failures.push('learning_writeback must be COMPLETE when material change/decision/error/fix/prevention/architecture/cost learning exists');
  }

  if (manifest.terminalState === 'LIVE & BEWEZEN') {
    if (!nonEmptyString(manifest.candidateId)) failures.push('LIVE & BEWEZEN requires candidateId');
    if (!Array.isArray(manifest.openObligations)) failures.push('openObligations array is required');
    else if (manifest.openObligations.some(item => !['FULFILLED', 'CLOSED', 'NOT_APPLICABLE'].includes(item?.state))) failures.push('LIVE & BEWEZEN requires zero non-terminal open obligations');
    if (!Array.isArray(manifest.canonicalWriteback) || manifest.canonicalWriteback.length === 0 || !manifest.canonicalWriteback.every(nonEmptyString)) failures.push('LIVE & BEWEZEN requires canonicalWriteback references');
    if (!manifest.productionReadback || manifest.productionReadback.candidateId !== manifest.candidateId) failures.push('LIVE & BEWEZEN requires exact-candidate production readback');
    if (!nonEmptyString(manifest?.productionReadback?.source) || !nonEmptyString(manifest?.productionReadback?.observedAt)) failures.push('LIVE & BEWEZEN productionReadback requires source and observedAt');
  }

  if (manifest.terminalState === 'BLOCKED_HARD_BOUNDARY') {
    const boundary = manifest.hardBoundary;
    if (!nonEmptyString(boundary?.reason)) failures.push('hard boundary requires reason');
    if (!Array.isArray(boundary?.evidence) || boundary.evidence.length === 0) failures.push('hard boundary requires evidence');
    if (!nonEmptyString(boundary?.recoveryPath)) failures.push('hard boundary requires concrete recoveryPath');
  }

  return Object.freeze({ ok: failures.length === 0, version: UNIVERSAL_COMPLETION_VERSION, failures });
}

export function assertUniversalCompletion(manifest) {
  const result = evaluateUniversalCompletion(manifest);
  if (!result.ok) throw new Error(`UNIVERSAL_COMPLETION_BLOCKED: ${result.failures.join('; ')}`);
  return Object.freeze({ ...result, manifest });
}
