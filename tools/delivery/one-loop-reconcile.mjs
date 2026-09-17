import { classifyTerminalState, evaluateExecutionLease, reconcileExecution } from './one-loop.mjs';

export function reconcileOneLoopRun(snapshot = {}, now = Date.now()) {
  const terminal = classifyTerminalState(snapshot.state, snapshot.evidence ?? {});
  if (terminal.terminal && terminal.valid) {
    return { action: 'NOOP_TERMINAL', terminal, lease: 'TERMINAL' };
  }

  const lease = evaluateExecutionLease(snapshot, now);
  const reconciliation = reconcileExecution({
    state: lease === 'RECOVER' ? 'LEASE_EXPIRED' : snapshot.state,
    activeCandidates: snapshot.activeCandidates,
    candidateSha: snapshot.candidateSha,
    sideEffectAlreadyApplied: snapshot.sideEffectAlreadyApplied,
    terminalEvidence: false,
  });

  return { ...reconciliation, terminal, lease };
}
