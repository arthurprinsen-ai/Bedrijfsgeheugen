const TERMINAL_EVIDENCE_FIELDS = [
  'exactHeadVerified',
  'protectedMergeVerified',
  'runtimeReadbackVerified',
  'learningWritebackVerified',
];

const RECOVERABLE_STATES = new Set([
  'COMMITTED',
  'PR_OPEN',
  'CI_QUEUED',
  'TIMEOUT',
  'CHAT_STOPPED',
  'WORKER_LOST',
  'LEASE_EXPIRED',
  'RETRYABLE_FAILURE',
  'INTERRUPTED',
  'WAITING_CAPACITY',
  'RECONCILING',
]);

function allTrue(object, fields) {
  return fields.every((field) => object?.[field] === true);
}

export function classifyTerminalState(state, evidence = {}) {
  if (RECOVERABLE_STATES.has(state)) {
    return {
      terminal: false,
      valid: false,
      recoveryRequired: true,
      reason: 'RECOVERABLE_INCOMPLETE_EXECUTION',
    };
  }

  if (state === 'BLOCKED_EXTERNAL') {
    const valid = evidence.externalBlockerVerified === true
      && typeof evidence.recoveryPath === 'string'
      && evidence.recoveryPath.trim().length > 0;
    return {
      terminal: true,
      valid,
      recoveryRequired: !valid,
      reason: valid ? 'EXTERNAL_BLOCKER_PROVEN' : 'EXTERNAL_BLOCKER_EVIDENCE_INCOMPLETE',
    };
  }

  if (state === 'LIVE_PROVEN' || state === 'FULFILLED') {
    const valid = allTrue(evidence, TERMINAL_EVIDENCE_FIELDS);
    return {
      terminal: true,
      valid,
      recoveryRequired: !valid,
      reason: valid ? 'TERMINAL_EVIDENCE_PROVEN' : 'TERMINAL_EVIDENCE_INCOMPLETE',
    };
  }

  return {
    terminal: false,
    valid: false,
    recoveryRequired: false,
    reason: 'NON_TERMINAL_LIFECYCLE_STATE',
  };
}

export function evaluateExecutionLease(run, now = Date.now()) {
  const terminal = classifyTerminalState(run?.state, run?.evidence ?? {});
  if (terminal.terminal && terminal.valid) return 'TERMINAL';

  const leaseExpiresAt = Date.parse(run?.leaseExpiresAt ?? '');
  if (Number.isFinite(leaseExpiresAt) && leaseExpiresAt <= now) return 'RECOVER';
  return 'HEALTHY';
}

export function evaluateFinishingPressure(snapshot = {}) {
  const maxExecutable = Number(snapshot.maxExecutable ?? 0);
  const admittedExecutable = Number(snapshot.admittedExecutable ?? 0);
  const finishing = Number(snapshot.finishing ?? 0);
  const lane = snapshot.candidate?.lane;
  const type = snapshot.candidate?.type;
  const priorityRecovery = lane === 'security' || lane === 'incident' || type === 'security' || type === 'recovery';

  if (priorityRecovery) {
    return { decision: 'ADMIT_PRIORITY_RECOVERY', reason: 'SECURITY_INCIDENT_RECOVERY_PRIORITY' };
  }

  if (finishing > 0) {
    return { decision: 'WAITING_CAPACITY', reason: 'FINISH_EXISTING_WORK_FIRST' };
  }

  if (maxExecutable > 0 && admittedExecutable >= maxExecutable) {
    return { decision: 'WAITING_CAPACITY', reason: 'EXECUTABLE_CAPACITY_EXHAUSTED' };
  }

  return { decision: 'ADMIT', reason: 'CAPACITY_AVAILABLE' };
}

export function reconcileExecution(snapshot = {}) {
  if (snapshot.terminalEvidence === true) return { action: 'NOOP_TERMINAL', reason: 'TERMINAL_ALREADY_PROVEN' };

  const active = Array.isArray(snapshot.activeCandidates) ? [...new Set(snapshot.activeCandidates)] : [];
  if (active.length > 1) {
    return { action: 'REVIEW_REQUIRED', reason: 'MULTIPLE_ACTIVE_CANDIDATES' };
  }

  if (snapshot.sideEffectAlreadyApplied === true) {
    return { action: 'CONTINUE', reason: 'READBACK_PROVES_SIDE_EFFECT_APPLIED' };
  }

  if (RECOVERABLE_STATES.has(snapshot.state)) {
    return { action: 'RECOVER', reason: 'RECOVERABLE_EXECUTION_STATE' };
  }

  return { action: 'CONTINUE', reason: 'NON_TERMINAL_EXECUTION' };
}
