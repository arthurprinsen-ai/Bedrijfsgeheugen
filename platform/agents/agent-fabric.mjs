import { createHash } from 'node:crypto';
import { createAgentWork } from './agent-work.mjs';

const TRANSITIONS = Object.freeze({
  Assigned:new Set(['Investigating']),
  Investigating:new Set(['FixPrepared','WaitingApproval']),
  FixPrepared:new Set(['WaitingApproval','Executing']),
  WaitingApproval:new Set(['Executing','Investigating']),
  Executing:new Set(['Verifying']),
  Verifying:new Set(['Resolved','WaitingApproval']),
  Resolved:new Set(['LearningRecorded']),
  LearningRecorded:new Set(),
});

const TERMINAL = new Set(['Resolved','LearningRecorded']);

function normalize(values) {
  return [...new Set((values ?? []).map(value => String(value).trim()).filter(Boolean))].sort();
}

function fingerprint(signal) {
  const source = JSON.stringify({
    tenantId:signal.tenantId,
    kind:signal.kind ?? 'Failure',
    problemClass:signal.problemClass,
    affectedObjectIds:normalize(signal.affectedObjectIds),
  });
  return createHash('sha256').update(source).digest('hex').slice(0, 24);
}

export function createAgentFabric({ registry, now = () => new Date().toISOString() } = {}) {
  if (!registry?.route) throw new TypeError('registry is required');
  const workById = new Map();
  const activeByFingerprint = new Map();
  const metadata = new Map();
  let sequence = 0;

  function intake(signal) {
    if (!signal?.tenantId) throw new TypeError('tenantId is required');
    if (!signal?.problemClass) throw new TypeError('problemClass is required');
    const key = fingerprint(signal);
    const existingId = activeByFingerprint.get(key);
    if (existingId) {
      const existing = workById.get(existingId);
      if (existing && !TERMINAL.has(existing.status)) return existing;
      activeByFingerprint.delete(key);
    }

    const route = registry.route({ domains:signal.domains, capabilities:signal.capabilities });
    const id = `WORK-${++sequence}`;
    const work = createAgentWork({
      id,
      tenantId:signal.tenantId,
      trigger:signal.kind === 'Opportunity' ? 'OPPORTUNITY_DETECTED' : 'SIGNAL_DETECTED',
      problem:signal.problem ?? signal.problemClass,
      priority:signal.priority ?? 'P2',
      primaryAgentId:route.primaryAgentId,
      supportAgentIds:route.supportAgentIds,
      affectedObjectIds:normalize(signal.affectedObjectIds),
      evidence:[...(signal.evidence ?? [])],
      risk:signal.risk ?? null,
      status:'Assigned',
    });
    workById.set(id, work);
    activeByFingerprint.set(key, id);
    metadata.set(id, Object.freeze({
      fingerprint:key,
      kind:signal.kind ?? 'Failure',
      problemClass:signal.problemClass,
      domains:Object.freeze(normalize(signal.domains)),
      capabilities:Object.freeze(normalize(signal.capabilities)),
      createdAt:now(),
    }));
    return work;
  }

  function transition({ workId, status, ...patch }) {
    const current = workById.get(workId);
    if (!current) throw new Error('AgentWork not found');
    const allowed = TRANSITIONS[current.status] ?? new Set();
    if (!allowed.has(status)) throw new Error(`invalid AgentWork transition: ${current.status} -> ${status}`);
    const next = createAgentWork({ ...current, ...patch, status });
    workById.set(workId, next);
    if (TERMINAL.has(status)) {
      const info = metadata.get(workId);
      if (info) activeByFingerprint.delete(info.fingerprint);
    }
    return next;
  }

  function getWork(id) {
    return workById.get(id) ?? null;
  }

  function listWork({ tenantId } = {}) {
    return Object.freeze([...workById.values()].filter(work => !tenantId || work.tenantId === tenantId));
  }

  function getMetadata(id) {
    return metadata.get(id) ?? null;
  }

  return Object.freeze({ intake, transition, getWork, listWork, getMetadata });
}
