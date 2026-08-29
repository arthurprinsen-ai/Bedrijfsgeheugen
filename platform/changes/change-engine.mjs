export const CHANGE_STATES = Object.freeze(['Working','ImpactAnalysis','Review','Approved','Active','Verified','Rejected','RolledBack']);

export function createChange(input) {
  for (const field of ['id','tenantId','objectId','ownerId','reason','fromVersion','toVersion','status']) if (input?.[field] == null || input[field] === '') throw new TypeError(`${field} is required`);
  if (!CHANGE_STATES.includes(input.status)) throw new TypeError('invalid change status');
  return Object.freeze({
    id:input.id, tenantId:input.tenantId, objectId:input.objectId, ownerId:input.ownerId, approverIds:Object.freeze([...(input.approverIds ?? [])]),
    reason:input.reason, fromVersion:input.fromVersion, toVersion:input.toVersion, status:input.status,
    before:Object.freeze({ ...(input.before ?? {}) }), after:Object.freeze({ ...(input.after ?? {}) }),
    directImpact:Object.freeze([...(input.directImpact ?? [])]), dependentImpact:Object.freeze([...(input.dependentImpact ?? [])]), predictedImpact:Object.freeze([...(input.predictedImpact ?? [])]),
    risks:Object.freeze([...(input.risks ?? [])]), evidence:Object.freeze([...(input.evidence ?? [])]), tests:Object.freeze([...(input.tests ?? [])]), rollback:input.rollback ?? null,
  });
}

export function assertChangeTransition(from, to) {
  const allowed = new Map([
    ['Working', ['ImpactAnalysis','Rejected']], ['ImpactAnalysis',['Review','Rejected']], ['Review',['Approved','Rejected']], ['Approved',['Active','Rejected']], ['Active',['Verified','RolledBack']], ['Verified',[]], ['Rejected',[]], ['RolledBack',[]],
  ]);
  if (!allowed.get(from)?.includes(to)) throw new Error(`invalid change transition ${from} -> ${to}`);
  return true;
}

export function verifyImpact({ expected, observed, verified, confidence, attribution }) {
  if (verified == null || typeof confidence !== 'number' || confidence < 0 || confidence > 1) throw new TypeError('verified impact and bounded confidence are required');
  return Object.freeze({ expected, observed, verified, confidence, attribution: attribution ?? 'Unknown' });
}
