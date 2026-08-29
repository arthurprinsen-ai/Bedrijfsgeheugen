import { evaluatePolicy } from './policy-engine.mjs';

export function createTemporaryGrant({ id, subjectId, action, resourceType, resourceId = '*', tenantId, validFrom, validUntil, purpose = null, decision = 'ALLOW' }) {
  if (!id || !subjectId || !action || !resourceType || !tenantId || !validUntil) throw new TypeError('temporary grant missing required fields');
  return Object.freeze({ id, subjectId, action, resourceType, resourceId, tenantId, validFrom: validFrom ?? null, validUntil, purpose, decision, temporary: true });
}

export function activePoliciesAt(policies, atIso) {
  const at = new Date(atIso).getTime();
  return policies.filter(policy => {
    const from = policy.validFrom ? new Date(policy.validFrom).getTime() : -Infinity;
    const until = policy.validUntil ? new Date(policy.validUntil).getTime() : Infinity;
    return at >= from && at < until;
  });
}

export function effectiveAccess(request, policies, atIso) {
  const active = activePoliciesAt(policies, atIso);
  return evaluatePolicy(request, active);
}

export function explainAccess(request, policies, atIso) {
  const result = effectiveAccess(request, policies, atIso);
  return Object.freeze({ ...result, request: Object.freeze({ ...request }) });
}

export function simulateAccess(request, policies, candidatePolicy, atIso) {
  return Object.freeze({ before: effectiveAccess(request, policies, atIso), after: effectiveAccess(request, [...policies, candidatePolicy], atIso) });
}
