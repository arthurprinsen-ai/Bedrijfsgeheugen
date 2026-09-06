import { normalizePortalFlowState } from './portal-flow-state.js';

export function mapRecoveryObligation(raw = {}) {
  if (!raw?.open) return null;
  return { open: true, owner: raw.owner ?? raw.recoveryOwner ?? null, reason: raw.reason ?? raw.errorCode ?? null };
}

export function mapAgentRuntime(agent = {}) {
  const evidence = Array.isArray(agent.evidence) ? agent.evidence.filter(Boolean) : [];
  let status = agent.status ?? 'idle';
  if (['success','completed'].includes(status) && evidence.length === 0) status = 'waiting';
  if (['paused','disabled'].includes(status) && (agent.recoveryOpen || agent.recoveryObligation?.open)) status = 'blocked';
  if (agent.selfHealRunning) status = 'recovering';
  if (evidence.length > 0 && ['success','completed','verified'].includes(agent.status)) status = 'verified';
  return {
    id: agent.id ?? 'unknown-agent',
    name: agent.name ?? agent.id ?? 'Onbekende agent',
    category: agent.category ?? 'uitvoering',
    status,
    evidence,
    error: agent.errorCode ?? agent.error ?? null,
    recoveryObligation: (agent.recoveryOpen || agent.recoveryObligation?.open) ? { open:true, owner:agent.recoveryOwner ?? agent.recoveryObligation?.owner ?? null, reason:agent.errorCode ?? agent.error ?? null } : null,
    lastRunAt: agent.lastRunAt ?? null,
    triggerReason: agent.triggerReason ?? null,
    learningStatus: agent.learningPending ? 'waiting' : (agent.learningStatus ?? 'idle')
  };
}

export function mapRuntimeSnapshotToPortalFlow(snapshot = {}) {
  const learning = snapshot.learning ?? { status:'idle' };
  if (snapshot.learningPending && !snapshot.learning) learning.status = 'waiting';
  return normalizePortalFlowState({
    source: snapshot.source ?? null,
    datahub: snapshot.datahub ?? { status:'idle' },
    brain: snapshot.brain ?? { status:'idle', capabilities:[] },
    powerhouse: (snapshot.agents ?? []).map(mapAgentRuntime),
    module: snapshot.module ?? null,
    action: snapshot.action ?? null,
    outcome: snapshot.outcome ?? null,
    learning,
    updatedAt: snapshot.updatedAt ?? null
  });
}
