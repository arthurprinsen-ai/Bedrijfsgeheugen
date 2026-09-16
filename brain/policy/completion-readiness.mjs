import { evaluateCompletion } from '../../platform/agents/completion-supervisor.mjs';

export function evaluateCompletionReadiness(input = {}) {
  const decision = evaluateCompletion(input);
  return Object.freeze({
    canComplete:decision.success === true,
    canWait:decision.canWait === true,
    state:decision.normalized_state,
    nextAction:decision.next_action,
    openObligations:decision.open_obligations,
    requiredEvidence:decision.required_evidence,
    evidence:input.hardBoundary?.evidence ?? null,
    recoveryPacket:decision.recovery_packet,
    resumeWhen:decision.resume_when,
    idempotencyKey:decision.idempotency_key,
  });
}
