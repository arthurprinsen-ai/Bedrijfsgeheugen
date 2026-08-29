import { authorizeAIRequest } from '../intelligence/context-broker.mjs';
import { validateAIResult } from '../intelligence/result-gateway.mjs';

export function prepareIntelligenceRequest({ request, policies, providerRegistry, contextPolicy }) {
  return authorizeAIRequest({ request, policies, providerRegistry, contextPolicy });
}

export function acceptIntelligenceResult({ result, allowPersistence = false }) {
  return validateAIResult({ result, allowPersistence });
}

export async function runIntelligence({ request, policies, providerRegistry, contextPolicy, invokeModel, allowPersistence = false }) {
  if (typeof invokeModel !== 'function') throw new TypeError('invokeModel must be supplied by the runtime adapter');
  const authorized = prepareIntelligenceRequest({ request, policies, providerRegistry, contextPolicy });
  const raw = await invokeModel(authorized);
  const validated = acceptIntelligenceResult({ result: raw, allowPersistence });
  return Object.freeze({ authorizedRequest:Object.freeze({ ...authorized, context:undefined }), result:validated });
}
