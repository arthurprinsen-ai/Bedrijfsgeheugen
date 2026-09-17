const INTERRUPTION_PATTERNS = [
  ['NETWORK_DISCONNECT', /network|netwerk|verbinding|connection|socket|offline|econn|dns/i],
  ['STREAM_INTERRUPTED', /stream|streaming|sse|websocket/i],
  ['REASONING_ABORTED', /stopped thinking|gestopt met nadenken|redeneren mislukt|reasoning|model run|generation aborted/i],
  ['TOOL_ABORTED', /tool.*abort|tool.*timeout|tool.*failed/i],
  ['WORKER_LOST', /worker|process crash|process exited|lease expired/i],
  ['TIMEOUT', /timeout|timed out|deadline exceeded/i],
  ['SESSION_INTERRUPTED', /session|conversation.*interrupted|context lost/i]
];

export const TERMINAL_STATES = new Set(['COMPLETED', 'BLOCKED_HARD_BOUNDARY']);
export const RESUMABLE_STATES = new Set(['PENDING', 'RUNNING', 'RECOVERY_REQUIRED', 'EFFECT_APPLIED', 'VERIFIED']);

export function classifyInterruption(signal) {
  const text = typeof signal === 'string'
    ? signal
    : [signal?.name, signal?.code, signal?.message, signal?.reason].filter(Boolean).join(' ');
  for (const [kind, pattern] of INTERRUPTION_PATTERNS) {
    if (pattern.test(text)) return kind;
  }
  return 'UNKNOWN_INTERRUPTION';
}

export function isTerminalState(state) {
  return TERMINAL_STATES.has(state);
}

export function nextRunState({ state, verifiedOutcome = false, hardBoundary = false, interrupted = false }) {
  if (hardBoundary) return 'BLOCKED_HARD_BOUNDARY';
  if (verifiedOutcome) return 'COMPLETED';
  if (interrupted && !isTerminalState(state)) return 'RECOVERY_REQUIRED';
  return state;
}

export function computeRetryDelay(attempt, policy = {}, random = Math.random) {
  const baseMs = policy.base_delay_ms ?? 1000;
  const maxMs = policy.max_delay_ms ?? 60000;
  const jitterRatio = policy.jitter_ratio ?? 0.2;
  const exponent = Math.max(0, attempt - 1);
  const capped = Math.min(maxMs, baseMs * 2 ** exponent);
  const jitter = capped * jitterRatio * ((random() * 2) - 1);
  return Math.max(0, Math.round(capped + jitter));
}

export function evaluateResumeSafety({ sideEffectState = 'NOT_STARTED', idempotencyKey, externalEvidence = false, dedupeProof = false }) {
  if (sideEffectState === 'VERIFIED') {
    return { action: 'SKIP_EFFECT', reason: 'SIDE_EFFECT_ALREADY_VERIFIED' };
  }
  if (sideEffectState === 'EFFECT_APPLIED' && !externalEvidence) {
    return { action: 'READBACK_REQUIRED', reason: 'EFFECT_APPLIED_BUT_UNVERIFIED' };
  }
  if (!idempotencyKey && !dedupeProof) {
    return { action: 'BLOCK_MUTATION', reason: 'NO_IDEMPOTENCY_OR_DEDUPE_PROOF' };
  }
  return { action: 'RESUME_SAFE', reason: externalEvidence ? 'EXTERNAL_EVIDENCE_PRESENT' : 'IDEMPOTENCY_GUARDED' };
}

export function shouldWatchdogRecover({ state, lastHeartbeatAt, now = Date.now(), heartbeatTimeoutMs = 120000 }) {
  if (isTerminalState(state)) return false;
  if (!lastHeartbeatAt) return true;
  const heartbeatMs = typeof lastHeartbeatAt === 'number' ? lastHeartbeatAt : Date.parse(lastHeartbeatAt);
  if (!Number.isFinite(heartbeatMs)) return true;
  return now - heartbeatMs > heartbeatTimeoutMs;
}

export function buildRecoveryPlan(run, contract = {}) {
  const retryPolicy = contract.retry_policy ?? {};
  const maxAttempts = retryPolicy.max_attempts ?? 5;
  const identicalLimit = retryPolicy.max_identical_retries_without_new_evidence ?? 2;
  const state = nextRunState({
    state: run.state,
    verifiedOutcome: run.verified_outcome === true,
    hardBoundary: run.hard_boundary === true,
    interrupted: run.interrupted === true
  });

  if (isTerminalState(state)) {
    return { state, action: 'STOP', reason: 'TERMINAL_STATE' };
  }
  if ((run.attempt ?? 0) >= maxAttempts) {
    return { state: 'RECOVERY_REQUIRED', action: 'CHANGE_HYPOTHESIS', reason: 'MAX_RETRY_ATTEMPTS_REACHED' };
  }
  if ((run.identical_retry_count ?? 0) >= identicalLimit) {
    return { state: 'RECOVERY_REQUIRED', action: 'CHANGE_HYPOTHESIS', reason: 'IDENTICAL_RETRY_LIMIT_REACHED' };
  }
  const safety = evaluateResumeSafety({
    sideEffectState: run.side_effect_state,
    idempotencyKey: run.idempotency_key,
    externalEvidence: run.external_evidence === true,
    dedupeProof: run.dedupe_proof === true
  });
  if (safety.action === 'BLOCK_MUTATION' || safety.action === 'READBACK_REQUIRED') {
    return { state: 'RECOVERY_REQUIRED', action: safety.action, reason: safety.reason };
  }
  return {
    state: 'RECOVERY_REQUIRED',
    action: 'RESUME_FROM_CHECKPOINT',
    reason: safety.reason,
    checkpoint: run.last_verified_checkpoint ?? null,
    interruption_type: classifyInterruption(run.interruption ?? '')
  };
}
