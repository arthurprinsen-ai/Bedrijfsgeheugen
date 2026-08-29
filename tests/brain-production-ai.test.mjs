import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createProviderRegistry } from '../platform/intelligence/provider-registry.mjs';
import { ACTIONS, DECISIONS } from '../platform/policy/policy-engine.mjs';
import { createAIUseCase, AI_RISK_CLASSES, AI_USE_CASE_STATES } from '../platform/policy/ai-register.mjs';
import { runGovernedProductionAI } from '../platform/brain/production-ai.mjs';

function setup() {
  const providers = createProviderRegistry([{
    id:'ANTHROPIC-SONNET', provider:'Anthropic', model:'claude-sonnet-5', status:'Approved',
    allowedDataClasses:['Public','Confidential'], allowedPurposes:['website-answer','portal-project-answer'],
    trainingAllowed:false, persistentProviderMemory:false,
  }]);
  const useCases = [
    createAIUseCase({ id:'AI-WEBSITE-QA', tenantId:'PUBLIC', purpose:'website-answer', ownerId:'Bedrijfsgeheugen', legalRole:'Deployer', riskClass:AI_RISK_CLASSES.TRANSPARENCY, providerModelId:'ANTHROPIC-SONNET', dataClasses:['Public'], humanOversight:'Escalate when source does not answer', autonomy:'L1', controls:['SOURCE_ONLY','TRANSPARENCY'], evidence:['SITE-INDEX'], state:AI_USE_CASE_STATES.ACTIVE }),
    createAIUseCase({ id:'AI-PORTAL-QA', tenantId:'REQUEST_SCOPED', purpose:'portal-project-answer', ownerId:'Bedrijfsgeheugen', legalRole:'Deployer', riskClass:AI_RISK_CLASSES.TRANSPARENCY, providerModelId:'ANTHROPIC-SONNET', dataClasses:['Confidential'], humanOversight:'User initiates each request; no autonomous action', autonomy:'L1', controls:['REQUEST_SCOPED_CONTEXT','NO_PERSISTENCE'], evidence:['PORTAL-CONTEXT'], state:AI_USE_CASE_STATES.ACTIVE }),
  ];
  const policies = [
    { id:'PUBLIC-QA', subjectId:'public-visitor', action:ACTIONS.AI_PROCESS, resourceType:'QuestionContext', purpose:'website-answer', dataClass:'Public', tenantId:'PUBLIC', decision:DECISIONS.ALLOW },
    { id:'PORTAL-QA', subjectId:'portal-requester', action:ACTIONS.AI_PROCESS, resourceType:'QuestionContext', purpose:'portal-project-answer', dataClass:'Confidential', tenantId:'REQUEST_SCOPED', decision:DECISIONS.ALLOW },
  ];
  return { providers, useCases, policies };
}

test('production AI executes only registered governed use case with minimized ephemeral context', async () => {
  const { providers, useCases, policies } = setup();
  const calls = [];
  const result = await runGovernedProductionAI({
    request:{ requestId:'REQ-1', tenantId:'REQUEST_SCOPED', requesterId:'portal-requester', aiUseCaseId:'AI-PORTAL-QA', purpose:'portal-project-answer', resourceType:'QuestionContext', resourceId:'REQ-1', providerModelId:'ANTHROPIC-SONNET', dataClass:'Confidential', context:{ question:'Wat kost dit?', projectContext:'offerte 100 euro', secretInternal:'NEVER' } },
    policies, providerRegistry:providers, aiUseCases:useCases,
    contextPolicy:{ allowedFields:['question','projectContext'], pseudonymizeFields:[] },
    invokeModel:async authorized => { calls.push(structuredClone(authorized)); return { type:'Observation', text:'100 euro', provenance:{ source:'request-context' }, confidence:0.99, containsRestrictedData:false, containsUnexpectedPII:false }; },
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].context, { question:'Wat kost dit?', projectContext:'offerte 100 euro' });
  assert.equal(calls[0].retention, 'EPHEMERAL');
  assert.equal(calls[0].providerMemory, false);
  assert.equal(result.validated, true);
  assert.equal(result.persistenceAllowed, false);
  assert.equal(result.truthClass, 'AIInterpretation');
});

test('unregistered/mismatched AI use case fails before provider call', async () => {
  const { providers, useCases, policies } = setup();
  let calls = 0;
  const invokeModel = async () => { calls++; return {}; };
  const base = { requestId:'REQ-2', tenantId:'PUBLIC', requesterId:'public-visitor', purpose:'website-answer', resourceType:'QuestionContext', resourceId:'REQ-2', providerModelId:'ANTHROPIC-SONNET', dataClass:'Public', context:{ question:'test', fragments:'source' } };
  await assert.rejects(() => runGovernedProductionAI({ request:{...base, aiUseCaseId:'UNKNOWN'}, policies, providerRegistry:providers, aiUseCases:useCases, contextPolicy:{allowedFields:['question','fragments']}, invokeModel }), /registered|use case/i);
  await assert.rejects(() => runGovernedProductionAI({ request:{...base, aiUseCaseId:'AI-WEBSITE-QA', purpose:'wrong'}, policies, providerRegistry:providers, aiUseCases:useCases, contextPolicy:{allowedFields:['question','fragments']}, invokeModel }), /purpose/i);
  assert.equal(calls, 0);
});

test('provider errors fail closed and raw request context is never returned as result metadata', async () => {
  const { providers, useCases, policies } = setup();
  await assert.rejects(() => runGovernedProductionAI({
    request:{ requestId:'REQ-3', tenantId:'PUBLIC', requesterId:'public-visitor', aiUseCaseId:'AI-WEBSITE-QA', purpose:'website-answer', resourceType:'QuestionContext', resourceId:'REQ-3', providerModelId:'ANTHROPIC-SONNET', dataClass:'Public', context:{ question:'SECRET QUESTION', fragments:'PUBLIC SOURCE' } },
    policies, providerRegistry:providers, aiUseCases:useCases, contextPolicy:{allowedFields:['question','fragments']}, invokeModel:async () => { throw new Error('outage'); },
  }), /provider|outage|failed/i);
});

test('public AI routes cannot call Anthropic directly and must use the shared Brain adapter', async () => {
  for (const route of ['vraag.mjs', 'portaalvraag.mjs']) {
    const source = await readFile(new URL(`../netlify/functions/${route}`, import.meta.url), 'utf8');
    assert.equal(source.includes('api.anthropic.com'), false, `${route} bypasses Brain governance`);
    assert.match(source, /_brain-ai\.mjs/);
  }
});
