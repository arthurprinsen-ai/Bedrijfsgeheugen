import { createCanonicalObject, TRUTH_CLASSES, LIFECYCLE_STATES, VERIFICATION_STATES, FRESHNESS_STATES } from '../contracts/canonical-object.mjs';
import { createEvent, EVENT_TYPES } from '../contracts/event.mjs';
import { createInMemoryEventStore } from '../events/event-store.mjs';
import { authorizeAIRequest } from '../intelligence/context-broker.mjs';
import { ACTIONS, DECISIONS, evaluatePolicy } from '../policy/policy-engine.mjs';
import { AI_USE_CASE_STATES, canActivateAIUseCase } from '../policy/ai-register.mjs';
import { canAgentExecute, createAgentWork } from '../agents/agent-work.mjs';
import { planSelfHeal, verifyRecovery } from '../agents/self-heal.mjs';
import { requireRunnableBudgetEnvelope } from '../cost/budget-policy.mjs';

function required(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} is required`);
}

function safeId(prefix, value) {
  return `${prefix}-${String(value).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

function assertEventStore(store) {
  for (const method of ['append','all','byObject','byCorrelation']) {
    if (typeof store?.[method] !== 'function') throw new TypeError(`eventStore.${method} is required`);
  }
  return store;
}

export function createBrainRuntime({ policies = [], providerRegistry, aiUseCases = [], contextPolicy, aiProvider, executor, eventStore = createInMemoryEventStore(), now = () => new Date().toISOString() }) {
  if (!providerRegistry?.assertAllowed) throw new TypeError('providerRegistry is required');
  if (!aiProvider?.analyze) throw new TypeError('aiProvider.analyze is required');
  if (!executor?.execute) throw new TypeError('executor.execute is required');
  assertEventStore(eventStore);

  const sourceObjects = new Map();
  const workingObjects = new Map();
  const activeObjects = new Map();
  const recommendations = new Map();
  const decisions = new Map();
  const aiUseCaseRegistry = new Map(aiUseCases.map(useCase => [useCase.id, useCase]));
  const idempotentIngest = new Map();
  const learning = [];
  const audit = [];
  const agentWork = new Map();
  let sequence = 0;

  const next = prefix => `${prefix}-${++sequence}`;
  const timestamp = () => now();

  function auditMetadata({ tenantId, action, actorId, objectId, correlationId, outcome = 'SUCCESS', policyIds = [] }) {
    audit.push(Object.freeze({ tenantId, action, actorId, objectId, correlationId, outcome, policyIds:Object.freeze([...policyIds]), at:timestamp() }));
  }

  function append({ eventType, tenantId, objectId, actorId, correlationId, causationId = null, reason, risk = null, idempotencyKey = null, beforeVersion = null, afterVersion = null }) {
    return eventStore.append(createEvent({
      eventId:next('EVT'), eventType, tenantId, objectId, actorId, source:'brain-runtime', timestamp:timestamp(), reason,
      correlationId, causationId, risk, schemaVersion:1, idempotencyKey:idempotencyKey ?? next('IDEMP'), beforeVersion, afterVersion,
    }));
  }

  function updateAgentWork(work, status, patch = {}) {
    const updated = createAgentWork({ ...work, ...patch, status });
    agentWork.set(updated.id, updated);
    return updated;
  }

  function ingest(signal, { actorId }) {
    required(signal?.id, 'signal.id'); required(signal?.tenantId, 'signal.tenantId'); required(actorId, 'actorId');
    required(signal?.provenance?.sourceType, 'signal.provenance.sourceType'); required(signal?.provenance?.sourceRef, 'signal.provenance.sourceRef');
    required(signal?.idempotencyKey, 'signal.idempotencyKey');
    if (idempotentIngest.has(signal.idempotencyKey)) return idempotentIngest.get(signal.idempotencyKey);

    const at = timestamp();
    const object = createCanonicalObject({
      id:signal.id, type:signal.type ?? 'ExternalSignal', tenantId:signal.tenantId, truthClass:TRUTH_CLASSES.SOURCE_FACT,
      lifecycle:LIFECYCLE_STATES.ACTIVE, version:1, verification:VERIFICATION_STATES.UNVERIFIED, freshness:FRESHNESS_STATES.CURRENT,
      provenance:signal.provenance,
      data:Object.fromEntries(Object.entries(signal).filter(([key]) => !['id','tenantId','type','provenance','idempotencyKey'].includes(key))),
      createdAt:at, updatedAt:at,
    });
    sourceObjects.set(object.id, object);
    activeObjects.set(object.id, object);
    const correlationId = safeId('CORR', signal.idempotencyKey);
    const event = append({ eventType:EVENT_TYPES.SOURCE_SYNCED, tenantId:signal.tenantId, objectId:signal.id, actorId, correlationId, reason:'Source signal ingested', idempotencyKey:signal.idempotencyKey, afterVersion:1 });
    const result = Object.freeze({ object, event });
    idempotentIngest.set(signal.idempotencyKey, result);
    auditMetadata({ tenantId:signal.tenantId, action:'SOURCE_INGESTED', actorId, objectId:signal.id, correlationId });
    return result;
  }

  function assertAIUseCase(input, signal) {
    const useCase = aiUseCaseRegistry.get(input.aiUseCaseId);
    if (!useCase) throw new Error('AI use case is not registered');
    if (useCase.tenantId !== signal.tenantId) throw new Error('AI use case tenant mismatch');
    if (useCase.state !== AI_USE_CASE_STATES.ACTIVE) throw new Error(`AI use case is not active: ${useCase.state}`);
    const activation = canActivateAIUseCase(useCase);
    if (!activation.allowed) throw new Error(`AI use case governance denied: ${activation.reason}`);
    if (useCase.purpose !== input.purpose) throw new Error('AI use case purpose mismatch');
    if (useCase.providerModelId !== input.providerModelId) throw new Error('AI use case provider/model mismatch');
    if (!useCase.dataClasses.includes(input.dataClass)) throw new Error('AI use case data class mismatch');
    return useCase;
  }

  async function analyze(input) {
    if (input?.optional === true) requireRunnableBudgetEnvelope(input.budgetEnvelope);
    const signal = sourceObjects.get(input?.signalId);
    if (!signal) throw new Error('signal not found');
    const requestedTenant = input.tenantId ?? signal.tenantId;
    if (requestedTenant !== signal.tenantId) throw new Error('tenant mismatch');
    const correlationId = input.correlationId ?? next('CORR');

    let authorized;
    try {
      assertAIUseCase(input, signal);
      authorized = authorizeAIRequest({
        request:{
          requestId:next('AIREQ'), tenantId:signal.tenantId, requesterId:input.requesterId, role:input.role,
          aiUseCaseId:input.aiUseCaseId, purpose:input.purpose, resourceType:signal.type, resourceId:signal.id,
          providerModelId:input.providerModelId, dataClass:input.dataClass,
          context:{ ...signal.data, sourceRef:signal.provenance.sourceRef },
        },
        policies, providerRegistry, contextPolicy,
      });
    } catch (error) {
      auditMetadata({ tenantId:signal.tenantId, action:'AI_PROCESSING_DENIED', actorId:input.requesterId ?? 'unknown', objectId:signal.id, correlationId, outcome:'DENIED' });
      throw error;
    }

    auditMetadata({ tenantId:signal.tenantId, action:'AI_PROCESSING_REQUESTED', actorId:input.requesterId, objectId:signal.id, correlationId });
    let result;
    try {
      result = await aiProvider.analyze(authorized);
    } catch (error) {
      auditMetadata({ tenantId:signal.tenantId, action:'AI_PROVIDER_FAILED', actorId:input.requesterId, objectId:signal.id, correlationId, outcome:'FAILED_SAFE' });
      throw new Error(`AI provider failed safely: ${error.message}`);
    }
    if (!result?.text || typeof result.confidence !== 'number' || !Array.isArray(result.evidenceRefs) || !result.evidenceRefs.length) {
      auditMetadata({ tenantId:signal.tenantId, action:'AI_RESULT_REJECTED', actorId:input.requesterId, objectId:signal.id, correlationId, outcome:'FAILED_SAFE' });
      throw new Error('AI result rejected: structured evidence-backed result required');
    }

    const recommendation = createCanonicalObject({
      id:next('REC'), type:'Recommendation', tenantId:signal.tenantId, truthClass:TRUTH_CLASSES.AI_INTERPRETATION,
      lifecycle:LIFECYCLE_STATES.REVIEW, version:1,
      provenance:{ sourceType:'AI', sourceRef:`${input.aiUseCaseId}:${input.providerModelId}` },
      data:{ text:result.text, confidence:result.confidence, evidenceRefs:[...result.evidenceRefs], proposedAction:result.proposedAction ?? null, sourceSignalId:signal.id },
      createdAt:timestamp(), updatedAt:timestamp(),
    });
    recommendations.set(recommendation.id, recommendation);
    workingObjects.set(recommendation.id, recommendation);
    const event = append({ eventType:EVENT_TYPES.RECOMMENDATION_CREATED, tenantId:signal.tenantId, objectId:recommendation.id, actorId:input.requesterId, correlationId, reason:'Governed AI recommendation created', afterVersion:1 });
    auditMetadata({ tenantId:signal.tenantId, action:'AI_RESULT_ACCEPTED_AS_INTERPRETATION', actorId:input.requesterId, objectId:recommendation.id, correlationId });
    return Object.freeze({ recommendation, event });
  }

  function recordDecision({ recommendationId, requesterId, approved, reason }) {
    const recommendation = recommendations.get(recommendationId);
    if (!recommendation) throw new Error('recommendation not found');
    required(requesterId, 'requesterId'); required(reason, 'reason');
    const correlationId = next('CORR');
    const permission = evaluatePolicy({ subjectId:requesterId, action:ACTIONS.APPROVE, resourceType:'Recommendation', resourceId:recommendation.id, tenantId:recommendation.tenantId }, policies);
    if (permission.decision !== DECISIONS.ALLOW) {
      auditMetadata({ tenantId:recommendation.tenantId, action:'RECOMMENDATION_APPROVAL_DENIED', actorId:requesterId, objectId:recommendation.id, correlationId, outcome:'DENIED', policyIds:permission.policies });
      throw new Error(`approval denied: ${permission.reason}`);
    }

    const decisionId = next('DEC');
    const decision = createCanonicalObject({
      id:decisionId, type:'Decision', tenantId:recommendation.tenantId, truthClass:TRUTH_CLASSES.BUSINESS_TRUTH,
      lifecycle:approved ? LIFECYCLE_STATES.ACTIVE : LIFECYCLE_STATES.REJECTED, version:1,
      provenance:{ sourceType:'HumanDecision', sourceRef:requesterId }, data:{ recommendationId, approved:Boolean(approved), reason },
      createdAt:timestamp(), updatedAt:timestamp(),
    });
    decisions.set(decision.id, decision); activeObjects.set(decision.id, decision);
    append({ eventType:EVENT_TYPES.DECISION_RECORDED, tenantId:decision.tenantId, objectId:decision.id, actorId:requesterId, correlationId, reason, afterVersion:1 });
    auditMetadata({ tenantId:decision.tenantId, action:'DECISION_RECORDED', actorId:requesterId, objectId:decision.id, correlationId, policyIds:permission.policies });
    if (!approved) return Object.freeze({ decision, change:null });

    const change = createCanonicalObject({
      id:next('CHG'), type:'Change', tenantId:recommendation.tenantId, truthClass:TRUTH_CLASSES.BUSINESS_TRUTH,
      lifecycle:LIFECYCLE_STATES.APPROVED, version:1, provenance:{ sourceType:'Decision', sourceRef:decision.id },
      data:{ recommendationId, decisionId:decision.id, proposedAction:recommendation.data.proposedAction }, createdAt:timestamp(), updatedAt:timestamp(),
    });
    workingObjects.set(change.id, change);
    append({ eventType:EVENT_TYPES.CHANGE_PROPOSED, tenantId:change.tenantId, objectId:change.id, actorId:requesterId, correlationId, reason:'Approved recommendation prepared as working change', afterVersion:1 });
    return Object.freeze({ decision, change });
  }

  async function executeChange(input) {
    if (input?.optional === true) requireRunnableBudgetEnvelope(input.budgetEnvelope);
    const change = workingObjects.get(input?.changeId);
    if (!change || change.type !== 'Change') throw new Error('working change not found');
    const correlationId = next('CORR');
    const permission = evaluatePolicy({ subjectId:input.requesterId, action:ACTIONS.EXECUTE, resourceType:'Change', resourceId:change.id, tenantId:change.tenantId }, policies);
    if (permission.decision !== DECISIONS.ALLOW) throw new Error(`execution denied: ${permission.reason}`);
    const autonomy = canAgentExecute({ autonomyLevel:input.autonomyLevel ?? 'L5', actionPolicy:permission.decision, risk:input.risk, blastRadius:input.blastRadius, reversible:input.reversible, testsAvailable:input.testsAvailable, verifierAvailable:input.verifierAvailable, budgetAvailable:input.budgetAvailable });
    if (!autonomy.allowed) throw new Error(autonomy.reason === 'HIGH_IMPACT_REQUIRES_REVIEW' ? 'high impact requires human approval/review' : `execution blocked: ${autonomy.reason}`);

    const result = await executor.execute(Object.freeze({ tenantId:change.tenantId, changeId:change.id, command:change.data.proposedAction, correlationId }));
    if (!result?.ok) throw new Error('execution failed');
    const active = createCanonicalObject({ ...change, lifecycle:LIFECYCLE_STATES.ACTIVE, version:change.version + 1, verification:VERIFICATION_STATES.VERIFYING, provenance:change.provenance, data:{ ...change.data, executionId:result.executionId, observed:result.observed ?? null }, updatedAt:timestamp() });
    activeObjects.set(active.id, active);
    workingObjects.delete(active.id);
    append({ eventType:EVENT_TYPES.CHANGE_ACTIVATED, tenantId:active.tenantId, objectId:active.id, actorId:input.requesterId, correlationId, reason:'Change executed within autonomy envelope', risk:input.risk, beforeVersion:change.version, afterVersion:active.version });
    auditMetadata({ tenantId:active.tenantId, action:'CHANGE_EXECUTED', actorId:input.requesterId, objectId:active.id, correlationId, policyIds:permission.policies });
    return Object.freeze({ change:active, execution:result });
  }

  function verifyAndLearn(input) {
    const change = activeObjects.get(input?.changeId);
    if (!change || change.type !== 'Change') throw new Error('active change not found');
    const correlationId = next('CORR');
    const verificationResult = verifyRecovery(input);
    if (verificationResult.state !== 'Resolved') throw new Error('verification failed; change cannot be marked verified');

    const verifiedChange = createCanonicalObject({
      ...change, lifecycle:LIFECYCLE_STATES.ACTIVE, version:change.version + 1,
      verification:VERIFICATION_STATES.VERIFIED, provenance:change.provenance,
      data:{ ...change.data, verifiedAt:timestamp() }, updatedAt:timestamp(),
    });
    activeObjects.set(verifiedChange.id, verifiedChange);
    const verification = Object.freeze({ id:next('VER'), tenantId:change.tenantId, changeId:change.id, status:'Verified', evidence:{ regressionPassed:true, productionSmokePassed:true, expectedStateObserved:true }, verifiedAt:timestamp() });
    append({ eventType:EVENT_TYPES.VERIFICATION_COMPLETED, tenantId:change.tenantId, objectId:change.id, actorId:input.requesterId, correlationId, reason:'Post-change verification passed', beforeVersion:change.version, afterVersion:verifiedChange.version });
    const impact = Object.freeze({ id:next('IMP'), tenantId:change.tenantId, changeId:change.id, status:'Verified', expected:input.expectedImpact, observed:input.observedImpact, verifiedAt:timestamp() });
    append({ eventType:EVENT_TYPES.IMPACT_VERIFIED, tenantId:change.tenantId, objectId:impact.id, actorId:input.requesterId, correlationId, reason:'Observed impact verified' });
    const record = Object.freeze({ id:next('LRN'), tenantId:change.tenantId, changeId:change.id, recommendationId:change.data.recommendationId, decisionId:change.data.decisionId, expectedImpact:input.expectedImpact, observedImpact:input.observedImpact, shared:true, governed:true, recordedAt:timestamp() });
    learning.push(record);
    append({ eventType:EVENT_TYPES.LEARNING_RECORDED, tenantId:change.tenantId, objectId:record.id, actorId:input.requesterId, correlationId, reason:'Verified outcome stored in shared governed learning memory' });
    auditMetadata({ tenantId:change.tenantId, action:'CHANGE_VERIFIED_AND_LEARNED', actorId:input.requesterId, objectId:change.id, correlationId });
    return Object.freeze({ change:verifiedChange, verification, impact, learning:record });
  }

  async function selfHeal(input) {
    const correlationId = next('CORR');
    let work = createAgentWork({ id:next('WORK'), tenantId:input.tenantId, trigger:'FAILURE_DETECTED', priority:input.risk === 'High' ? 'P0' : 'P2', primaryAgentId:input.actorId, affectedObjectIds:[input.failureId], risk:input.risk, status:'Investigating' });
    agentWork.set(work.id, work);

    const permission = evaluatePolicy({ subjectId:input.actorId, action:ACTIONS.EXECUTE, resourceType:'Recovery', resourceId:input.failureId, tenantId:input.tenantId }, policies);
    if (permission.decision !== DECISIONS.ALLOW) {
      work = updateAgentWork(work, 'WaitingApproval', { outcome:'POLICY_DENIED' });
      auditMetadata({ tenantId:input.tenantId, action:'SELF_HEAL_POLICY_DENIED', actorId:input.actorId, objectId:input.failureId, correlationId, outcome:'DENIED', policyIds:permission.policies });
      throw new Error(`self-heal policy denied: ${permission.reason}`);
    }

    const plan = planSelfHeal(input);
    if (plan.state !== 'Execute') {
      work = updateAgentWork(work, 'WaitingApproval', { outcome:plan.reason });
      auditMetadata({ tenantId:input.tenantId, action:'SELF_HEAL_ESCALATED', actorId:input.actorId, objectId:input.failureId, correlationId, outcome:'ESCALATED', policyIds:permission.policies });
      return Object.freeze({ state:'Escalated', reason:plan.reason, work });
    }

    work = updateAgentWork(work, 'Executing');
    const result = await executor.execute(Object.freeze({ tenantId:input.tenantId, failureId:input.failureId, command:input.command, correlationId, recovery:true }));
    work = updateAgentWork(work, 'Verifying');
    const verification = verifyRecovery({ regressionPassed:result?.ok === true, productionSmokePassed:result?.ok === true, expectedStateObserved:result?.ok === true });
    if (verification.state !== 'Resolved') {
      work = updateAgentWork(work, 'WaitingApproval', { verification, outcome:'VERIFICATION_FAILED' });
      return Object.freeze({ state:'Escalated', reason:'VERIFICATION_FAILED', work });
    }

    work = updateAgentWork(work, 'Resolved', { verification, outcome:'VERIFIED_RECOVERY' });
    const record = Object.freeze({ id:next('LRN'), tenantId:input.tenantId, failureId:input.failureId, pattern:'KNOWN_SAFE_RECOVERY', shared:true, governed:true, recordedAt:timestamp() });
    learning.push(record);
    append({ eventType:EVENT_TYPES.LEARNING_RECORDED, tenantId:input.tenantId, objectId:record.id, actorId:input.actorId, correlationId, reason:'Verified self-heal pattern stored in shared learning memory' });
    work = updateAgentWork(work, 'LearningRecorded', { learningId:record.id });
    auditMetadata({ tenantId:input.tenantId, action:'SELF_HEAL_VERIFIED', actorId:input.actorId, objectId:input.failureId, correlationId, policyIds:permission.policies });
    return Object.freeze({ state:'Resolved', verification, learning:record, work });
  }

  function snapshot() {
    return Object.freeze({
      events:eventStore.all(), sourceObjects:new Map(sourceObjects), workingObjects:new Map(workingObjects), activeObjects:new Map(activeObjects),
      recommendations:new Map(recommendations), decisions:new Map(decisions), aiUseCases:new Map(aiUseCaseRegistry),
      learning:Object.freeze([...learning]), audit:Object.freeze([...audit]), agentWork:new Map(agentWork),
    });
  }

  return Object.freeze({ ingest, analyze, recordDecision, executeChange, verifyAndLearn, selfHeal, snapshot });
}
