import { readFile } from 'node:fs/promises';
import { createPreflightDecision } from './delivery-learning.mjs';
import { buildGuardRegressionInventory } from './delivery-guard-regression-inventory.mjs';
import { evaluateCompletionReadiness } from '../brain/policy/completion-readiness.mjs';

export { evaluateCompletionReadiness };

function actionableKnowledgeRecord(item, source = 'canonical-learning') {
  if (!item || typeof item !== 'object' || typeof item.fingerprint !== 'string') return null;
  return Object.freeze({
    source: item.source || source,
    fingerprint: item.fingerprint,
    rootCause: item.rootCause || null,
    fix: item.fix || item.requiredAction || null,
    preventionRule: item.preventionRule || null,
    regressionContract: item.regressionContract || null,
    owner: item.owner || null,
    status: item.status || null,
  });
}

export async function loadDeliveryPreflight({
  lessonsPath = new URL('../docs/brain/delivery-failure-lessons.json', import.meta.url),
  chatLessonsPath = new URL('../config/brain-chat-learning-contract.json', import.meta.url),
  continuityPath = new URL('../brain/learning/chat-continuity-2026-08-30.json', import.meta.url),
  executionLessonsPath = new URL('../brain/learning/current-execution-lessons-2026-08-30.json', import.meta.url),
  completenessAddendumPath = new URL('../brain/learning/chat-completeness-addendum-2026-08-30.json', import.meta.url),
  remediationOwnershipPath = new URL('../brain/learning/remediation-ownership-2026-08-30.json', import.meta.url),
  ciEfficiencyPath = new URL('../brain/learning/ci-efficiency-lessons-2026-08-30.json', import.meta.url),
  rulesPath = new URL('../config/delivery-prevention-rules.json', import.meta.url),
  completenessGuardPath = new URL('../config/chat-learning-completeness-guard.json', import.meta.url),
  browserGuardPath = new URL('../config/browser-evidence-guard-contract.json', import.meta.url),
  ownershipGuardPath = new URL('../config/branch-delivery-ownership-guard.json', import.meta.url),
  guardDiscoveryPath = new URL('../config/guard-regression-discovery-guard.json', import.meta.url),
  guardRegistrySchemaPath = new URL('../config/guard-registry-schema-guard.json', import.meta.url),
  component = 'shared',
  stages = ['COMMIT', 'PR', 'MERGE', 'PIPELINE'],
} = {}) {
  const [lessonsDoc, chatLessonsDoc, continuityDoc, executionLessonsDoc, completenessAddendum, remediationOwnership, ciEfficiency, rulesDoc, completenessGuard, browserGuard, ownershipGuard, guardDiscovery, guardRegistrySchema] = await Promise.all([
    readFile(lessonsPath, 'utf8').then(JSON.parse),
    readFile(chatLessonsPath, 'utf8').then(JSON.parse),
    readFile(continuityPath, 'utf8').then(JSON.parse),
    readFile(executionLessonsPath, 'utf8').then(JSON.parse),
    readFile(completenessAddendumPath, 'utf8').then(JSON.parse),
    readFile(remediationOwnershipPath, 'utf8').then(JSON.parse),
    readFile(ciEfficiencyPath, 'utf8').then(JSON.parse),
    readFile(rulesPath, 'utf8').then(JSON.parse),
    readFile(completenessGuardPath, 'utf8').then(JSON.parse),
    readFile(browserGuardPath, 'utf8').then(JSON.parse),
    readFile(ownershipGuardPath, 'utf8').then(JSON.parse),
    readFile(guardDiscoveryPath, 'utf8').then(JSON.parse),
    readFile(guardRegistrySchemaPath, 'utf8').then(JSON.parse),
  ]);
  if (chatLessonsDoc.preflightRequired !== true || chatLessonsDoc.newAgentsMustReadBeforeExecution !== true) throw new Error('chat learning contract must remain mandatory preflight knowledge');
  if (executionLessonsDoc.version !== chatLessonsDoc.version || executionLessonsDoc.appendOnly !== true) throw new Error('current execution lessons must remain an append-only BRAIN-CHAT-LEARNING-v1 shard');
  if (remediationOwnership.version !== chatLessonsDoc.version || remediationOwnership.appendOnly !== true || !Array.isArray(remediationOwnership.lessons)) throw new Error('remediation ownership lessons must remain an append-only BRAIN-CHAT-LEARNING-v1 shard');
  if (ciEfficiency.version !== chatLessonsDoc.version || ciEfficiency.appendOnly !== true || !Array.isArray(ciEfficiency.lessons)) throw new Error('CI efficiency lessons must remain an append-only BRAIN-CHAT-LEARNING-v1 shard');
  if (!Array.isArray(completenessAddendum.failurePatterns)) throw new Error('chat completeness addendum must expose failure patterns');
  const completionPolicy = completenessGuard.completionPolicy || {};
  if (
    completenessGuard.failClosed !== true
    || completionPolicy.blockIfMaterialLearningOnlyInChat !== true
    || completionPolicy.localGreenIsNotCompletion !== true
    || completionPolicy.continueUntilAllMaterialObligationsTerminal !== true
    || completionPolicy.hardBoundaryMustBeExplicitlyProven !== true
  ) throw new Error('chat learning completeness guard must remain fail-closed through terminal obligation enforcement');
  if (browserGuard.failClosed !== true) throw new Error('browser evidence guard must remain fail-closed');
  if (ownershipGuard.failClosed !== true || ownershipGuard.ambiguousSuccessorState !== 'FAIL_CLOSED') throw new Error('branch delivery ownership guard must remain fail-closed');
  if (guardDiscovery.failClosed !== true || guardDiscovery.executionPolicy?.familyDiscoveryRequired !== true) throw new Error('guard regression discovery must remain fail-closed and family-discovered');
  if (guardRegistrySchema.failClosed !== true || guardRegistrySchema.schemaPolicy?.recursiveArbitraryObjectDiscoveryForbidden !== true) throw new Error('guard registry schema must remain explicit and fail-closed');

  const activeRules = (rulesDoc.rules || []).filter(rule => rule?.active === true).map(rule => rule.id);
  const historicalLessons = (lessonsDoc.lessons || []).filter(lesson => lesson?.status === 'PROVEN');
  const chatLessons = [...(chatLessonsDoc.lessons || []), ...(continuityDoc.powerhouse_lessons || []), ...(executionLessonsDoc.lessons || []), ...(remediationOwnership.lessons || []), ...(ciEfficiency.lessons || [])].map(lesson => ({
    fingerprint: lesson.fingerprint, stage: 'PIPELINE', component: 'shared', reason: lesson.symptom, rootCause: lesson.rootCause,
    fix: lesson.requiredAction, preventionRule: lesson.preventionRule || (activeRules.includes(lesson.id) ? lesson.id : null), status: 'PROVEN',
    regressionContract: lesson.regressionContract || null, owner: lesson.owner || null,
  }));
  const addendumLessons = completenessAddendum.failurePatterns.filter(lesson => lesson?.fingerprint).map(lesson => ({
    fingerprint: lesson.fingerprint, stage: 'PIPELINE', component: 'shared', reason: lesson.symptom, rootCause: lesson.rootCause,
    fix: lesson.requiredAction, preventionRule: null, status: 'PROVEN',
  }));
  const provenLessons = [...historicalLessons, ...chatLessons, ...addendumLessons];
  const missingRegistry = provenLessons.filter(lesson => lesson.preventionRule && !activeRules.includes(lesson.preventionRule));
  if (missingRegistry.length) throw new Error(`PROVEN delivery lessons missing active prevention rules: ${missingRegistry.map(lesson => lesson.preventionRule).join(', ')}`);
  const explainedRuleIds = new Set(provenLessons.map(lesson => lesson.preventionRule).filter(Boolean));
  const orphanRules = activeRules.filter(ruleId => !explainedRuleIds.has(ruleId));
  if (orphanRules.length) throw new Error(`active prevention rules missing PROVEN lesson: ${orphanRules.join(', ')}`);

  const guardInventory = await buildGuardRegressionInventory();
  const baseDecision = createPreflightDecision({ component, stages, knownLessons: provenLessons, appliedPreventionRules: activeRules });
  const reusedGuards = [
    ...(completenessGuard.knownFailureFingerprints || []).map(item => typeof item === 'string' ? item : item?.fingerprint),
    ...(browserGuard.knownFailureFingerprints || []),
    ownershipGuard.knownFailure?.fingerprint,
    guardDiscovery.knownFailure?.fingerprint,
    guardRegistrySchema.knownFailure?.fingerprint,
    ...guardInventory.fingerprints,
  ].filter(Boolean);

  const knowledgeCandidates = [
    ...guardInventory.guards,
    ...(completenessGuard.knownFailureFingerprints || []).filter(item => item && typeof item === 'object'),
    ...(browserGuard.actionableFailureKnowledge || []),
    ...provenLessons,
  ];
  const knowledgeByFingerprint = new Map();
  for (const candidate of knowledgeCandidates) {
    const normalized = actionableKnowledgeRecord(candidate, 'delivery-preflight');
    if (!normalized) continue;
    const previous = knowledgeByFingerprint.get(normalized.fingerprint);
    knowledgeByFingerprint.set(normalized.fingerprint, Object.freeze({
      ...(previous || {}),
      ...Object.fromEntries(Object.entries(normalized).filter(([, value]) => value !== null && value !== undefined)),
    }));
  }
  const guardKnowledge = [...knowledgeByFingerprint.values()];

  return Object.freeze({
    ...baseDecision,
    reusedGuards: Object.freeze([...new Set(reusedGuards)]),
    guardKnowledge: Object.freeze(guardKnowledge),
    completionPolicy: Object.freeze({ ...completionPolicy })
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const component = process.argv[2] || 'shared';
  const decision = await loadDeliveryPreflight({ component });
  process.stdout.write(`${JSON.stringify(decision)}\n`);
}
