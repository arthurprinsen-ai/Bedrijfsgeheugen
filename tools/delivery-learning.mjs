import { createHash } from 'node:crypto';

const DELIVERY_STAGES = new Set(['COMMIT', 'PR', 'MERGE', 'PIPELINE', 'DEPLOY', 'PRODUCTION']);

export function normalizeFailureReason(value) {
  return String(value ?? '').trim().toLowerCase().replace(/#\d+/g, '#').replace(/\s+/g, ' ');
}

export function createFailureLesson({ stage, reason, rootCause, fix, preventionRule, component = 'shared', headSha = '' }) {
  const normalizedStage = String(stage ?? '').trim().toUpperCase();
  if (!DELIVERY_STAGES.has(normalizedStage)) throw new TypeError(`unsupported delivery stage: ${normalizedStage}`);
  const normalizedReason = normalizeFailureReason(reason);
  if (!normalizedReason) throw new TypeError('failure reason is required');
  if (!String(rootCause ?? '').trim()) throw new TypeError('rootCause is required');
  if (!String(fix ?? '').trim()) throw new TypeError('fix is required');
  if (!String(preventionRule ?? '').trim()) throw new TypeError('preventionRule is required');
  const normalizedComponent = String(component ?? 'shared').trim().toLowerCase() || 'shared';
  const digest = createHash('sha256').update(`${normalizedStage}|${normalizedComponent}|${normalizedReason}`).digest('hex').slice(0, 16);
  return Object.freeze({ type: 'DELIVERY_FAILURE_LESSON', fingerprint: `delivery-failure|${normalizedStage.toLowerCase()}|${normalizedComponent}|${digest}`, stage: normalizedStage, component: normalizedComponent, reason: String(reason).trim(), normalizedReason, rootCause: String(rootCause).trim(), fix: String(fix).trim(), preventionRule: String(preventionRule).trim(), headSha: String(headSha ?? '').trim(), status: 'PROVEN', brainContractVersion: 'brain.v1', outcomeWritebackRequired: true, reuseBeforeSimilarChange: true });
}

export function createPreflightDecision({ component = 'shared', stages = ['COMMIT', 'PR', 'MERGE', 'PIPELINE'], knownLessons = [], appliedPreventionRules = [] }) {
  const normalizedComponent = String(component).trim().toLowerCase();
  const stageSet = new Set(stages.map(stage => String(stage).trim().toUpperCase()));
  const applied = new Set(appliedPreventionRules.map(rule => String(rule).trim()).filter(Boolean));
  const relevant = knownLessons.filter(lesson => {
    const lessonComponent = String(lesson?.component ?? '').trim().toLowerCase();
    return lesson?.status === 'PROVEN' && (lessonComponent === normalizedComponent || lessonComponent === 'shared') && stageSet.has(String(lesson.stage ?? '').trim().toUpperCase());
  });
  const missing = relevant.filter(lesson => lesson.preventionRule && !applied.has(lesson.preventionRule));
  if (missing.length) throw new Error(`known delivery failure prevention missing: ${missing.map(lesson => lesson.preventionRule).join(', ')}`);
  return Object.freeze({ ok: true, component: normalizedComponent, checkedStages: Object.freeze([...stageSet]), reusedLessons: Object.freeze(relevant.map(lesson => lesson.fingerprint)), appliedPreventionRules: Object.freeze([...applied]) });
}

export function createObservedFailure({ stage, reason, component = 'shared', headSha = '', evidenceRef = '' }) {
  const normalizedStage = String(stage ?? '').trim().toUpperCase();
  if (!DELIVERY_STAGES.has(normalizedStage)) throw new TypeError(`unsupported delivery stage: ${normalizedStage}`);
  const normalizedReason = normalizeFailureReason(reason);
  if (!normalizedReason) throw new TypeError('failure reason is required');
  const normalizedComponent = String(component ?? 'shared').trim().toLowerCase() || 'shared';
  const digest = createHash('sha256').update(`${normalizedStage}|${normalizedComponent}|${normalizedReason}`).digest('hex').slice(0, 16);
  return Object.freeze({ type: 'DELIVERY_FAILURE_OBSERVED', fingerprint: `delivery-failure|${normalizedStage.toLowerCase()}|${normalizedComponent}|${digest}`, stage: normalizedStage, component: normalizedComponent, reason: String(reason).trim(), normalizedReason, headSha: String(headSha ?? '').trim(), evidenceRef: String(evidenceRef ?? '').trim(), status: 'OBSERVED', brainContractVersion: 'brain.v1', outcomeWritebackRequired: true, requiresRootCauseResolution: true, reuseBeforeSimilarChange: false });
}
