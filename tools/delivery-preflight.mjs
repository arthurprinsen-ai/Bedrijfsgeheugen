import { readFile } from 'node:fs/promises';
import { createPreflightDecision } from './delivery-learning.mjs';

function asPreflightLesson(lesson) {
  return {
    fingerprint: lesson.fingerprint,
    stage: 'PIPELINE',
    component: 'shared',
    reason: lesson.symptom,
    rootCause: lesson.rootCause,
    fix: lesson.requiredAction,
    preventionRule: lesson.id,
    status: 'PROVEN',
  };
}

export async function loadDeliveryPreflight({
  lessonsPath = new URL('../docs/brain/delivery-failure-lessons.json', import.meta.url),
  chatLessonsPath = new URL('../config/brain-chat-learning-contract.json', import.meta.url),
  continuityPath = new URL('../brain/learning/chat-continuity-2026-08-30.json', import.meta.url),
  rulesPath = new URL('../config/delivery-prevention-rules.json', import.meta.url),
  component = 'shared',
  stages = ['COMMIT', 'PR', 'MERGE', 'PIPELINE'],
} = {}) {
  const [lessonsDoc, chatLessonsDoc, continuityDoc, rulesDoc] = await Promise.all([
    readFile(lessonsPath, 'utf8').then(JSON.parse),
    readFile(chatLessonsPath, 'utf8').then(JSON.parse),
    readFile(continuityPath, 'utf8').then(JSON.parse),
    readFile(rulesPath, 'utf8').then(JSON.parse),
  ]);

  if (chatLessonsDoc.preflightRequired !== true || chatLessonsDoc.newAgentsMustReadBeforeExecution !== true) {
    throw new Error('chat learning contract must remain mandatory preflight knowledge');
  }

  const activeRules = (rulesDoc.rules || []).filter(rule => rule?.active === true).map(rule => rule.id);
  const historicalLessons = (lessonsDoc.lessons || []).filter(lesson => lesson?.status === 'PROVEN');
  const canonicalChatLessons = [
    ...(Array.isArray(chatLessonsDoc.lessons) ? chatLessonsDoc.lessons : []),
    ...(Array.isArray(continuityDoc.powerhouse_lessons) ? continuityDoc.powerhouse_lessons : []),
  ].map(asPreflightLesson);

  const byFingerprint = new Map();
  for (const lesson of [...historicalLessons, ...canonicalChatLessons]) {
    if (!lesson?.fingerprint) continue;
    byFingerprint.set(lesson.fingerprint, lesson);
  }
  const provenLessons = [...byFingerprint.values()];

  const missingRegistry = provenLessons.filter(lesson => lesson.preventionRule && !activeRules.includes(lesson.preventionRule));
  if (missingRegistry.length) {
    throw new Error(`PROVEN delivery lessons missing active prevention rules: ${missingRegistry.map(lesson => lesson.preventionRule).join(', ')}`);
  }

  return createPreflightDecision({ component, stages, knownLessons: provenLessons, appliedPreventionRules: activeRules });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const component = process.argv[2] || 'shared';
  const decision = await loadDeliveryPreflight({ component });
  process.stdout.write(`${JSON.stringify(decision)}\n`);
}
