import { createHash } from 'node:crypto';
import { createAgentWork } from './agent-work.mjs';
import { createLearningMemory } from './learning-memory.mjs';

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
const NOOP_EVENT_SINK = Object.freeze({ append:event => event });

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

function boundedMetric(value, name, { min = 1, max = 5 } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new TypeError(`${name} must be between ${min} and ${max}`);
  return number;
}

function opportunityPriority(signal) {
  const materiality = boundedMetric(signal.materiality, 'materiality');
  const urgency = boundedMetric(signal.urgency, 'urgency');
  const expectedValue = boundedMetric(signal.expectedValue, 'expectedValue');
  const risk = boundedMetric(signal.risk, 'risk');
  const confidence = boundedMetric(signal.confidence, 'confidence', { min:0, max:1 });
  const score = materiality + urgency + expectedValue + (confidence * 5) - (risk * 0.5);
  if (score >= 12) return 'P1';
  if (score >= 8) return 'P2';
  return 'P3';
}

export function createAgentFabric({ registry, learningMemory = createLearningMemory(), eventSink = NOOP_EVENT_SINK, now = () => new Date().toISOString() } = {}) {
  if (!registry?.route) throw new TypeError('registry is required');
  if (!learningMemory?.findMatches || !learningMemory?.recordVerified) throw new TypeError('learningMemory is invalid');
  if (!eventSink?.append) throw new TypeError('eventSink.append is required');
  const workById = new Map();
  const activeByFingerprint = new Map();
  const metadata = new Map();
  let sequence = 0;

  function emit(type, work, info, extra = {}) {
    return eventSink.append(Object.freeze({
      type,
      tenantId:work.tenantId,
      workId:work.id,
      fingerprint:info.fingerprint,
      primaryAgentId:work.primaryAgentId,
      supportAgentIds:Object.freeze([...work.supportAgentIds]),
      status:work.status,
      occurredAt:now(),
      ...extra,
    }));
  }

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
    const info = Object.freeze({
      fingerprint:key,
      kind:signal.kind ?? 'Failure',
      problemClass:signal.problemClass,
      domains:Object.freeze(normalize(signal.domains)),
      capabilities:Object.freeze(normalize(signal.capabilities)),
      createdAt:now(),
    });
    workById.set(id, work);
    activeByFingerprint.set(key, id);
    metadata.set(id, info);
    emit('AGENT_WORK_ASSIGNED', work, info, { kind:info.kind });
    if (info.kind === 'Opportunity') emit('OPPORTUNITY_QUEUED', work, info, { priority:work.priority });
    return work;
  }

  function intakeOpportunity(signal) {
    return intake({ ...signal, kind:'Opportunity', priority:opportunityPriority(signal) });
  }

  function transition({ workId, status, ...patch }) {
    const current = workById.get(workId);
    if (!current) throw new Error('AgentWork not found');
    const allowed = TRANSITIONS[current.status] ?? new Set();
    if (!allowed.has(status)) throw new Error(`invalid AgentWork transition: ${current.status} -> ${status}`);
    const next = createAgentWork({ ...current, ...patch, status });
    workById.set(workId, next);
    const info = metadata.get(workId);
    emit('AGENT_WORK_TRANSITIONED', next, info, { fromStatus:current.status, toStatus:status });
    if (TERMINAL.has(status) && info) activeByFingerprint.delete(info.fingerprint);
    return next;
  }

  function suggestLearning({ workId, requesterAgentId } = {}) {
    const work = workById.get(workId);
    const info = metadata.get(workId);
    if (!work || !info) throw new Error('AgentWork not found');
    const matches = learningMemory.findMatches({ tenantId:work.tenantId, domains:info.domains, fingerprint:info.problemClass });
    const consumer = requesterAgentId ?? work.primaryAgentId;
    for (const match of matches) {
      learningMemory.markReused(match.id, { agentId:consumer });
      emit('LEARNING_REUSED', work, info, { learningId:match.id, requesterAgentId:consumer });
    }
    return matches;
  }

  function recordLearning({ workId, actionFingerprint, evidence, impact, confidence } = {}) {
    const work = workById.get(workId);
    const info = metadata.get(workId);
    if (!work || !info) throw new Error('AgentWork not found');
    if (!TERMINAL.has(work.status)) throw new Error('learning requires resolved AgentWork');
    const record = learningMemory.recordVerified({
      tenantId:work.tenantId,
      fingerprint:info.problemClass,
      domains:info.domains,
      sourceAgentId:work.primaryAgentId,
      actionFingerprint,
      verified:true,
      evidence,
      impact,
      confidence,
    });
    emit('LEARNING_RECORDED', work, info, { learningId:record.id, actionFingerprint:record.actionFingerprint });
    return record;
  }

  function getWork(id) { return workById.get(id) ?? null; }
  function listWork({ tenantId } = {}) { return Object.freeze([...workById.values()].filter(work => !tenantId || work.tenantId === tenantId)); }
  function getMetadata(id) { return metadata.get(id) ?? null; }

  return Object.freeze({ intake, intakeOpportunity, transition, getWork, listWork, getMetadata, suggestLearning, recordLearning });
}
