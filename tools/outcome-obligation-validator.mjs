const HARD_BOUNDARY_STATUS = 'BLOCKED_HARD_BOUNDARY';

function asTime(value, field) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new TypeError(`${field} must be an ISO-8601 date/time`);
  return time;
}

export function evaluateObligation(input) {
  if (!input || typeof input !== 'object') throw new TypeError('obligation input is required');
  if (!input.id || typeof input.id !== 'string') throw new TypeError('obligation id is required');

  const expected = input.expected === true;
  const evidence = Array.isArray(input.evidence) ? input.evidence.filter(Boolean) : [];

  if (!expected) {
    return {
      id: input.id,
      status: 'NOT_DUE',
      green: true,
      recoveryRequired: false,
      evidenceCount: evidence.length,
    };
  }

  if (input.hardBoundary) {
    return {
      id: input.id,
      status: HARD_BOUNDARY_STATUS,
      green: false,
      recoveryRequired: false,
      hardBoundary: input.hardBoundary,
      evidenceCount: evidence.length,
    };
  }

  if (evidence.length > 0) {
    return {
      id: input.id,
      status: 'COMPLETED',
      green: true,
      recoveryRequired: false,
      evidenceCount: evidence.length,
    };
  }

  const now = asTime(input.now, 'now');
  const dueAt = asTime(input.dueAt, 'dueAt');

  if (now >= dueAt) {
    return {
      id: input.id,
      status: 'MISSED_OBLIGATION',
      green: false,
      recoveryRequired: true,
      technicalSuccess: input.technicalSuccess === true,
      evidenceCount: 0,
    };
  }

  return {
    id: input.id,
    status: input.technicalSuccess === true ? 'AWAITING_OUTCOME' : 'PENDING',
    green: false,
    recoveryRequired: false,
    evidenceCount: 0,
  };
}
