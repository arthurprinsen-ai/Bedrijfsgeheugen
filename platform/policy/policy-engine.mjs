export const DECISIONS = Object.freeze({
  ALLOW: 'ALLOW',
  DENY: 'DENY',
  ALLOW_WITH_CONDITIONS: 'ALLOW_WITH_CONDITIONS',
  REQUIRE_APPROVAL: 'REQUIRE_APPROVAL',
  REQUIRE_STEP_UP: 'REQUIRE_STEP_UP',
  REQUIRE_HUMAN_REVIEW: 'REQUIRE_HUMAN_REVIEW',
});

export const ACTIONS = Object.freeze({
  VIEW: 'VIEW', VIEW_SENSITIVE: 'VIEW_SENSITIVE', CREATE: 'CREATE', EDIT_DRAFT: 'EDIT_DRAFT',
  SUBMIT: 'SUBMIT', APPROVE: 'APPROVE', ACTIVATE: 'ACTIVATE', ARCHIVE: 'ARCHIVE',
  EXPORT: 'EXPORT', SHARE: 'SHARE', ASK_AI: 'ASK_AI', AI_PROCESS: 'AI_PROCESS',
  RUN_SCENARIO: 'RUN_SCENARIO', EXECUTE: 'EXECUTE', CHANGE_PERMISSIONS: 'CHANGE_PERMISSIONS', VIEW_AUDIT: 'VIEW_AUDIT',
});

export const DATA_CLASSES = Object.freeze({ PUBLIC: 'Public', INTERNAL: 'Internal', CONFIDENTIAL: 'Confidential', RESTRICTED: 'Restricted' });

const decisionRank = new Map([
  [DECISIONS.ALLOW, 0],
  [DECISIONS.ALLOW_WITH_CONDITIONS, 1],
  [DECISIONS.REQUIRE_STEP_UP, 2],
  [DECISIONS.REQUIRE_HUMAN_REVIEW, 3],
  [DECISIONS.REQUIRE_APPROVAL, 4],
  [DECISIONS.DENY, 5],
]);

function matches(policy, request) {
  const checks = [
    ['subjectId', request.subjectId], ['role', request.role], ['action', request.action],
    ['resourceType', request.resourceType], ['resourceId', request.resourceId], ['purpose', request.purpose],
    ['dataClass', request.dataClass], ['tenantId', request.tenantId],
  ];
  return checks.every(([key, value]) => policy[key] == null || policy[key] === '*' || policy[key] === value);
}

export function evaluatePolicy(request, policies = []) {
  for (const required of ['subjectId','action','resourceType','tenantId']) {
    if (!request?.[required]) throw new TypeError(`${required} is required`);
  }
  const applicable = policies.filter(policy => matches(policy, request));
  if (!applicable.length) return Object.freeze({ decision: DECISIONS.DENY, reason: 'NO_MATCHING_POLICY', policies: [] });
  const strongest = applicable.reduce((best, item) => decisionRank.get(item.decision) > decisionRank.get(best.decision) ? item : best);
  return Object.freeze({ decision: strongest.decision, reason: strongest.reason ?? strongest.id ?? 'POLICY', policies: Object.freeze(applicable.map(p => p.id)) });
}

export function assertAllowed(result) {
  if (!result || result.decision !== DECISIONS.ALLOW) {
    const error = new Error(`policy decision is ${result?.decision ?? 'UNKNOWN'}`);
    error.code = 'POLICY_DENIED';
    throw error;
  }
  return true;
}
