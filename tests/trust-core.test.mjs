import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, DATA_CLASSES, DECISIONS } from '../platform/policy/policy-engine.mjs';
import { createTemporaryGrant, effectiveAccess, simulateAccess } from '../platform/policy/access.mjs';
import { createProviderRegistry } from '../platform/intelligence/provider-registry.mjs';
import { authorizeAIRequest } from '../platform/intelligence/context-broker.mjs';
import { validateAIResult } from '../platform/intelligence/result-gateway.mjs';
import { AI_RISK_CLASSES, AI_USE_CASE_STATES, canActivateAIUseCase, createAIUseCase } from '../platform/policy/ai-register.mjs';

const at = '2026-08-29T10:00:00Z';

test('temporary access expires automatically and simulator does not mutate current policy', () => {
  const grant = createTemporaryGrant({ id:'TMP-1', subjectId:'USER-1', action:ACTIONS.VIEW, resourceType:'Finance', tenantId:'T1', validFrom:'2026-08-29T09:00:00Z', validUntil:'2026-08-29T11:00:00Z' });
  const request = { subjectId:'USER-1', action:ACTIONS.VIEW, resourceType:'Finance', resourceId:'*', tenantId:'T1' };
  assert.equal(effectiveAccess(request, [grant], at).decision, DECISIONS.ALLOW);
  assert.equal(effectiveAccess(request, [grant], '2026-08-29T12:00:00Z').decision, DECISIONS.DENY);
  const sim = simulateAccess(request, [], grant, at);
  assert.equal(sim.before.decision, DECISIONS.DENY);
  assert.equal(sim.after.decision, DECISIONS.ALLOW);
});

test('AI context broker requires explicit AI permission, approved provider, purpose and minimizes context', () => {
  const providers = createProviderRegistry([{ id:'MODEL-1', provider:'ApprovedVendor', model:'model-a', status:'Approved', allowedDataClasses:[DATA_CLASSES.CONFIDENTIAL], allowedPurposes:['MANAGEMENT_ANALYSIS'], trainingAllowed:false, persistentProviderMemory:false }]);
  const policies = [{ id:'AI-ALLOW', subjectId:'USER-1', action:ACTIONS.AI_PROCESS, resourceType:'Finance', purpose:'MANAGEMENT_ANALYSIS', dataClass:DATA_CLASSES.CONFIDENTIAL, tenantId:'T1', decision:DECISIONS.ALLOW }];
  const authorized = authorizeAIRequest({
    request:{ requestId:'REQ-1', tenantId:'T1', requesterId:'USER-1', aiUseCaseId:'AIC-1', purpose:'MANAGEMENT_ANALYSIS', resourceType:'Finance', resourceId:'FIN-1', providerModelId:'MODEL-1', dataClass:DATA_CLASSES.CONFIDENTIAL, context:{ revenue:100, employeeName:'Alice', bankAccount:'SECRET' } },
    policies, providerRegistry:providers, contextPolicy:{ allowedFields:['revenue','employeeName'], pseudonymizeFields:['employeeName'] },
  });
  assert.deepEqual(Object.keys(authorized.context).sort(), ['employeeName','revenue']);
  assert.match(authorized.context.employeeName, /^PSEUDO-/);
  assert.equal(authorized.retention, 'EPHEMERAL');
  assert.equal(authorized.providerMemory, false);
});

test('provider registration rejects training or persistent provider memory', () => {
  assert.throws(() => createProviderRegistry([{ id:'BAD', provider:'X', model:'Y', status:'Approved', allowedDataClasses:['Internal'], allowedPurposes:['X'], trainingAllowed:true }]), /training/i);
  assert.throws(() => createProviderRegistry([{ id:'BAD2', provider:'X', model:'Y', status:'Approved', allowedDataClasses:['Internal'], allowedPurposes:['X'], persistentProviderMemory:true }]), /memory/i);
});

test('AI result remains AI interpretation and only approved structured types persist', () => {
  const result = validateAIResult({ allowPersistence:true, result:{ type:'Finding', confidence:.82, provenance:{ model:'MODEL-1', sources:['KPI-1'] } } });
  assert.equal(result.truthClass, 'AIInterpretation');
  assert.equal(result.persistenceAllowed, true);
  assert.throws(() => validateAIResult({ allowPersistence:true, result:{ type:'RawConversation', confidence:.9, provenance:{ model:'MODEL-1' } } }), /cannot persist/i);
});

test('AI Register blocks prohibited and potential high-risk use-cases without qualified review', () => {
  const prohibited = createAIUseCase({ id:'AI-1', tenantId:'T1', purpose:'X', ownerId:'U1', legalRole:'Deployer', riskClass:AI_RISK_CLASSES.PROHIBITED, providerModelId:'M1', dataClasses:['Internal'] });
  assert.equal(prohibited.state, AI_USE_CASE_STATES.BLOCKED);
  assert.equal(canActivateAIUseCase(prohibited).allowed, false);
  const highRisk = createAIUseCase({ id:'AI-2', tenantId:'T1', purpose:'X', ownerId:'U1', legalRole:'Deployer', riskClass:AI_RISK_CLASSES.POTENTIAL_HIGH_RISK, providerModelId:'M1', dataClasses:['Internal'], humanOversight:'Authorized review', autonomy:'L1' });
  assert.equal(canActivateAIUseCase(highRisk).reason, 'QUALIFIED_REVIEW_REQUIRED');
});
