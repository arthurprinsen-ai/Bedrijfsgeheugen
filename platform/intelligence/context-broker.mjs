import { ACTIONS, DECISIONS, evaluatePolicy } from '../policy/policy-engine.mjs';

export function minimizeContext({ fields, allowedFields, pseudonymizeFields = [] }) {
  const allowed = new Set(allowedFields ?? []);
  const pseudo = new Set(pseudonymizeFields);
  const result = {};
  for (const [key, value] of Object.entries(fields ?? {})) {
    if (!allowed.has(key)) continue;
    result[key] = pseudo.has(key) && value != null ? `PSEUDO-${String(value).length}` : value;
  }
  return Object.freeze(result);
}

export function authorizeAIRequest({ request, policies, providerRegistry, contextPolicy }) {
  for (const key of ['tenantId','requesterId','aiUseCaseId','purpose','resourceType','providerModelId','dataClass']) {
    if (!request?.[key]) throw new TypeError(`${key} is required for AI processing`);
  }
  const permission = evaluatePolicy({
    subjectId: request.requesterId,
    role: request.role ?? null,
    action: ACTIONS.AI_PROCESS,
    resourceType: request.resourceType,
    resourceId: request.resourceId ?? '*',
    purpose: request.purpose,
    dataClass: request.dataClass,
    tenantId: request.tenantId,
  }, policies);
  if (permission.decision !== DECISIONS.ALLOW) throw new Error(`AI processing denied: ${permission.reason}`);
  const provider = providerRegistry.assertAllowed({ id: request.providerModelId, dataClass: request.dataClass, purpose: request.purpose });
  const minimized = minimizeContext({ fields: request.context ?? {}, allowedFields: contextPolicy.allowedFields, pseudonymizeFields: contextPolicy.pseudonymizeFields ?? [] });
  return Object.freeze({
    requestId: request.requestId ?? null,
    tenantId: request.tenantId,
    requesterId: request.requesterId,
    aiUseCaseId: request.aiUseCaseId,
    purpose: request.purpose,
    providerModelId: provider.id,
    context: minimized,
    retention: 'EPHEMERAL',
    providerMemory: false,
  });
}
