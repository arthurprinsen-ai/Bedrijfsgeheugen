import { authorizeAIRequest } from '../intelligence/context-broker.mjs';
import { validateAIResult } from '../intelligence/result-gateway.mjs';
import { AI_USE_CASE_STATES, canActivateAIUseCase } from '../policy/ai-register.mjs';

function getUseCase(aiUseCases, id) {
  const list = aiUseCases instanceof Map ? [...aiUseCases.values()] : (aiUseCases ?? []);
  return list.find(item => item?.id === id) ?? null;
}

function assertUseCase(request, aiUseCases) {
  const useCase = getUseCase(aiUseCases, request.aiUseCaseId);
  if (!useCase) throw new Error('AI use case is not registered');
  if (useCase.state !== AI_USE_CASE_STATES.ACTIVE) throw new Error(`AI use case is not active: ${useCase.state}`);
  const activation = canActivateAIUseCase(useCase);
  if (!activation.allowed) throw new Error(`AI use case governance denied: ${activation.reason}`);
  if (useCase.tenantId !== request.tenantId) throw new Error('AI use case tenant mismatch');
  if (useCase.purpose !== request.purpose) throw new Error('AI use case purpose mismatch');
  if (useCase.providerModelId !== request.providerModelId) throw new Error('AI use case provider/model mismatch');
  if (!useCase.dataClasses.includes(request.dataClass)) throw new Error('AI use case data class mismatch');
  return useCase;
}

export async function runGovernedProductionAI({ request, policies, providerRegistry, aiUseCases, contextPolicy, invokeModel }) {
  if (typeof invokeModel !== 'function') throw new TypeError('invokeModel is required');
  assertUseCase(request, aiUseCases);
  const authorized = authorizeAIRequest({ request, policies, providerRegistry, contextPolicy });
  let raw;
  try {
    raw = await invokeModel(authorized);
  } catch (error) {
    throw new Error(`AI provider failed safely: ${error?.message ?? 'unknown error'}`);
  }
  return validateAIResult({ result:raw, allowPersistence:false });
}
