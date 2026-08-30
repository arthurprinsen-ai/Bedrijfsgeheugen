import { runGovernedProductionAI } from '../../platform/brain/production-ai.mjs';
import { createProviderRegistry } from '../../platform/intelligence/provider-registry.mjs';
import { ACTIONS, DECISIONS } from '../../platform/policy/policy-engine.mjs';
import { createAIUseCase, AI_RISK_CLASSES, AI_USE_CASE_STATES } from '../../platform/policy/ai-register.mjs';
import { normalizeProviderTokenUsage } from '../../platform/cost/ai-token-usage.mjs';
import { createAiUsageStore } from './_ai-usage-store.mjs';

const MODEL_ID = 'ANTHROPIC-SONNET';
const MODEL = 'claude-sonnet-5';

const providerRegistry = createProviderRegistry([{
  id:MODEL_ID, provider:'Anthropic', model:MODEL, status:'Approved',
  allowedDataClasses:['Public','Confidential'], allowedPurposes:['website-answer','portal-project-answer'],
  trainingAllowed:false, persistentProviderMemory:false,
}]);

const aiUseCases = [
  createAIUseCase({ id:'AI-WEBSITE-QA', tenantId:'PUBLIC', purpose:'website-answer', ownerId:'Bedrijfsgeheugen', legalRole:'Deployer', riskClass:AI_RISK_CLASSES.TRANSPARENCY, providerModelId:MODEL_ID, dataClasses:['Public'], humanOversight:'Escalate when provided sources do not answer', autonomy:'L1', controls:['SOURCE_ONLY','TRANSPARENCY','NO_PERSISTENCE'], evidence:['WEBSITE-INDEX'], state:AI_USE_CASE_STATES.ACTIVE }),
  createAIUseCase({ id:'AI-PORTAL-QA', tenantId:'REQUEST_SCOPED', purpose:'portal-project-answer', ownerId:'Bedrijfsgeheugen', legalRole:'Deployer', riskClass:AI_RISK_CLASSES.TRANSPARENCY, providerModelId:MODEL_ID, dataClasses:['Confidential'], humanOversight:'User initiates every request; no autonomous action', autonomy:'L1', controls:['REQUEST_SCOPED_CONTEXT','NO_PERSISTENCE'], evidence:['PORTAL-REQUEST-CONTEXT'], state:AI_USE_CASE_STATES.ACTIVE }),
];

const policies = [
  { id:'PUBLIC-WEBSITE-QA', subjectId:'public-visitor', action:ACTIONS.AI_PROCESS, resourceType:'QuestionContext', purpose:'website-answer', dataClass:'Public', tenantId:'PUBLIC', decision:DECISIONS.ALLOW },
  { id:'PORTAL-REQUEST-QA', subjectId:'portal-requester', action:ACTIONS.AI_PROCESS, resourceType:'QuestionContext', purpose:'portal-project-answer', dataClass:'Confidential', tenantId:'REQUEST_SCOPED', decision:DECISIONS.ALLOW },
];

async function anthropic({ authorized, apiKey, system, maxTokens, renderUser, provenance, fetchImpl = fetch }) {
  if (!apiKey) throw new Error('Anthropic API key missing');
  const response = await fetchImpl('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{ 'content-type':'application/json', 'x-api-key':apiKey, 'anthropic-version':'2023-06-01' },
    body:JSON.stringify({ model:MODEL, max_tokens:maxTokens, system, messages:[{ role:'user', content:renderUser(authorized.context) }] }),
  });
  if (!response.ok) {
    let detail = '';
    try { const body = await response.json(); detail = [body.error?.type, body.error?.message].filter(Boolean).join(' - ').slice(0,200); } catch { detail = 'geen leesbare melding'; }
    throw new Error(`${response.status} ${detail}`);
  }
  const data = await response.json();
  const text = (data.content || []).filter(block => block.type === 'text').map(block => block.text).join('\n').trim();
  return { type:'Observation', text, provenance, confidence:0.7, containsRestrictedData:false, containsUnexpectedPII:false, providerUsage:data.usage ?? null };
}

async function attachTokenUsage(result, { requestId, componentKey, usageStore, at = new Date().toISOString() }) {
  const { providerUsage, ...safeResult } = result;
  if (!providerUsage) return Object.freeze({ ...safeResult, tokenUsage:null, tokenMetering:'UNAVAILABLE' });
  const tokenUsage = normalizeProviderTokenUsage({
    provider:'Anthropic', providerModelId:MODEL_ID, componentKey, requestId, usage:providerUsage, at,
  });
  try {
    await (usageStore ?? createAiUsageStore()).record(tokenUsage);
    return Object.freeze({ ...safeResult, tokenUsage, tokenMetering:'RECORDED' });
  } catch {
    return Object.freeze({ ...safeResult, tokenUsage, tokenMetering:'UNAVAILABLE' });
  }
}

export async function runWebsiteAnswer({ question, fragments, apiKey, system, fetchImpl = fetch, usageStore, requestId = crypto.randomUUID() }) {
  const result = await runGovernedProductionAI({
    request:{ requestId, tenantId:'PUBLIC', requesterId:'public-visitor', aiUseCaseId:'AI-WEBSITE-QA', purpose:'website-answer', resourceType:'QuestionContext', resourceId:requestId, providerModelId:MODEL_ID, dataClass:'Public', context:{ question, fragments } },
    policies, providerRegistry, aiUseCases, contextPolicy:{ allowedFields:['question','fragments'], pseudonymizeFields:[] },
    invokeModel:authorized => anthropic({ authorized, apiKey, system, maxTokens:600, fetchImpl, provenance:{ source:'website-index', providerModelId:MODEL_ID }, renderUser:ctx => `FRAGMENTEN VAN DE SITE:\n\n${ctx.fragments}\n\n---\n\nVRAAG VAN DE BEZOEKER:\n${ctx.question}` }),
  });
  return attachTokenUsage(result, { requestId, componentKey:'agent:website-qa', usageStore });
}

export async function runPortalAnswer({ question, projectContext, apiKey, system, fetchImpl = fetch, usageStore, requestId = crypto.randomUUID() }) {
  const result = await runGovernedProductionAI({
    request:{ requestId, tenantId:'REQUEST_SCOPED', requesterId:'portal-requester', aiUseCaseId:'AI-PORTAL-QA', purpose:'portal-project-answer', resourceType:'QuestionContext', resourceId:requestId, providerModelId:MODEL_ID, dataClass:'Confidential', context:{ question, projectContext } },
    policies, providerRegistry, aiUseCases, contextPolicy:{ allowedFields:['question','projectContext'], pseudonymizeFields:[] },
    invokeModel:authorized => anthropic({ authorized, apiKey, system, maxTokens:500, fetchImpl, provenance:{ source:'request-scoped-project-context', providerModelId:MODEL_ID }, renderUser:ctx => `PROJECTGEGEVENS (JSON):\n\n${ctx.projectContext}\n\n---\n\nVRAAG VAN DE KLANT:\n${ctx.question}` }),
  });
  return attachTokenUsage(result, { requestId, componentKey:'agent:portal-qa', usageStore });
}
