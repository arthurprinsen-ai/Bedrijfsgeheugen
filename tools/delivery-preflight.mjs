import { readFile } from 'node:fs/promises';
import { createPreflightDecision } from './delivery-learning.mjs';

export async function loadDeliveryPreflight({
  lessonsPath = new URL('../docs/brain/delivery-failure-lessons.json', import.meta.url),
  chatLessonsPath = new URL('../config/brain-chat-learning-contract.json', import.meta.url),
  continuityPath = new URL('../brain/learning/chat-continuity-2026-08-30.json', import.meta.url),
  executionLessonsPath = new URL('../brain/learning/current-execution-lessons-2026-08-30.json', import.meta.url),
  rulesPath = new URL('../config/delivery-prevention-rules.json', import.meta.url),
  completenessGuardPath = new URL('../config/chat-learning-completeness-guard.json', import.meta.url),
  browserGuardPath = new URL('../config/browser-evidence-guard-contract.json', import.meta.url),
  component = 'shared',
  stages = ['COMMIT', 'PR', 'MERGE', 'PIPELINE'],
} = {}) {
  const [lessonsDoc, chatLessonsDoc, continuityDoc, executionLessonsDoc, rulesDoc, completenessGuard, browserGuard] = await Promise.all([
    readFile(lessonsPath, 'utf8').then(JSON.parse),
    readFile(chatLessonsPath, 'utf8').then(JSON.parse),
    readFile(continuityPath, 'utf8').then(JSON.parse),
    readFile(executionLessonsPath, 'utf8').then(JSON.parse),
    readFile(rulesPath, 'utf8').then(JSON.parse),
    readFile(completenessGuardPath, 'utf8').then(JSON.parse),
    readFile(browserGuardPath, 'utf8').then(JSON.parse),
  ]);
  if (chatLessonsDoc.preflightRequired !== true || chatLessonsDoc.newAgentsMustReadBeforeExecution !== true) throw new Error('chat learning contract must remain mandatory preflight knowledge');
  if (executionLessonsDoc.version !== chatLessonsDoc.version || executionLessonsDoc.appendOnly !== true) throw new Error('current execution lessons must remain an append-only BRAIN-CHAT-LEARNING-v1 shard');
  if (completenessGuard.failClosed !== true || completenessGuard.completionPolicy?.blockIfMaterialLearningOnlyInChat !== true) throw new Error('chat learning completeness guard must remain fail-closed');
  if (browserGuard.failClosed !== true) throw new Error('browser evidence guard must remain fail-closed');

  const activeRules = (rulesDoc.rules || []).filter(rule => rule?.active === true).map(rule => rule.id);
  const historicalLessons = (lessonsDoc.lessons || []).filter(lesson => lesson?.status === 'PROVEN');
  const chatLessons = [...(chatLessonsDoc.lessons || []), ...(continuityDoc.powerhouse_lessons || []), ...(executionLessonsDoc.lessons || [])].map(lesson => ({
    fingerprint: lesson.fingerprint, stage: 'PIPELINE', component: 'shared', reason: lesson.symptom, rootCause: lesson.rootCause,
    fix: lesson.requiredAction, preventionRule: lesson.preventionRule || (activeRules.includes(lesson.id) ? lesson.id : null), status: 'PROVEN',
  }));
  const provenLessons = [...historicalLessons, ...chatLessons];
  const missingRegistry = provenLessons.filter(lesson => lesson.preventionRule && !activeRules.includes(lesson.preventionRule));
  if (missingRegistry.length) throw new Error(`PROVEN delivery lessons missing active prevention rules: ${missingRegistry.map(lesson => lesson.preventionRule).join(', ')}`);
  const explainedRuleIds = new Set(provenLessons.map(lesson => lesson.preventionRule).filter(Boolean));
  const orphanRules = activeRules.filter(ruleId => !explainedRuleIds.has(ruleId));
  if (orphanRules.length) throw new Error(`active prevention rules missing PROVEN lesson: ${orphanRules.join(', ')}`);

  const baseDecision = createPreflightDecision({ component, stages, knownLessons: provenLessons, appliedPreventionRules: activeRules });
  const reusedGuards = [
    ...(completenessGuard.knownFailureFingerprints || []).map(item => typeof item === 'string' ? item : item?.fingerprint),
    ...(browserGuard.knownFailureFingerprints || []),
  ].filter(Boolean);
  return Object.freeze({ ...baseDecision, reusedGuards: Object.freeze([...new Set(reusedGuards)]) });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const component = process.argv[2] || 'shared';
  const decision = await loadDeliveryPreflight({ component });
  process.stdout.write(`${JSON.stringify(decision)}\n`);
}
