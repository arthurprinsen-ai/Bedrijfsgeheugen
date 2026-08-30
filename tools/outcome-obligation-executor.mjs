import { createHash } from 'node:crypto';

const SUPPORTED_TRIGGERS = new Set(['scheduled-sweep', 'event-trigger']);

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) freeze(nested);
    Object.freeze(value);
  }
  return value;
}

function requireText(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} must be a non-empty string`);
  return value.trim();
}

function normalizeDate(now) {
  const date = now instanceof Date ? new Date(now.getTime()) : new Date(now);
  if (Number.isNaN(date.getTime())) throw new TypeError('now must be a valid date/time');
  return date;
}

export function businessDate(now, timeZone = 'Europe/Amsterdam') {
  const date = normalizeDate(now);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function normalizeTrigger(trigger) {
  if (!trigger || !SUPPORTED_TRIGGERS.has(trigger.type)) {
    throw new TypeError(`unsupported trigger type: ${trigger?.type ?? 'missing'}`);
  }
  const fingerprint = trigger.type === 'scheduled-sweep'
    ? String(trigger.fingerprint || 'scheduled')
    : requireText(trigger.fingerprint, 'trigger.fingerprint');
  return freeze({ type:trigger.type, fingerprint });
}

function stableDigest(value) {
  return createHash('sha256').update(value).digest('hex').slice(0, 20);
}

export function computeExecutionIdentity({
  obligation,
  now,
  trigger,
  coalesceKey = null,
  timeZone = 'Europe/Amsterdam',
}) {
  if (!obligation || typeof obligation !== 'object') throw new TypeError('obligation is required');
  const obligationId = requireText(obligation.id, 'obligation.id');
  const normalizedTrigger = normalizeTrigger(trigger);
  const localDate = businessDate(now, timeZone);

  const executionWindow = obligation.dueAt?.includes('daily') ? localDate : localDate;
  const effectiveTriggerIdentity = coalesceKey
    ? `coalesce:${requireText(coalesceKey, 'coalesceKey')}`
    : normalizedTrigger.type === 'scheduled-sweep'
      ? `scheduled:${executionWindow}`
      : `event:${normalizedTrigger.fingerprint}`;
  const canonical = `${obligationId}|${executionWindow}|${effectiveTriggerIdentity}`;
  const idempotencyKey = `obligation|${stableDigest(canonical)}|${canonical}`;
  const traceId = `obligation-trace|${stableDigest(idempotencyKey)}`;

  return freeze({
    obligationId,
    executionWindow,
    triggerType:normalizedTrigger.type,
    triggerFingerprint:normalizedTrigger.fingerprint,
    idempotencyKey,
    traceId,
  });
}

function acceptedEvidence(evidence = []) {
  return evidence.filter(item => item && item.independent === true && item.accepted === true && typeof item.ref === 'string' && item.ref.length > 0);
}

function productionEvidence(evidence = []) {
  return acceptedEvidence(evidence).filter(item => item.exactProduction === true || item.type === 'production' && item.exactProduction === true);
}

function validOwner(obligation, agent) {
  return Boolean(agent && agent.id === obligation.ownerAgent && agent.enabled !== false);
}

export function evaluateOutcomeObligation({
  obligation,
  now,
  trigger,
  agent,
  due = true,
  priorWork = null,
  priorRecovery = null,
  evidence = [],
  hardBoundary = null,
  evidenceDeadline = null,
  productionProofRequired = false,
  coalesceKey = null,
  timeZone = 'Europe/Amsterdam',
}) {
  const identity = computeExecutionIdentity({ obligation, now, trigger, coalesceKey, timeZone });
  const ownerAgent = requireText(obligation.ownerAgent, 'obligation.ownerAgent');
  const accepted = acceptedEvidence(evidence);
  const exactProduction = productionEvidence(evidence);

  const base = {
    obligationId:identity.obligationId,
    ownerAgent,
    traceId:identity.traceId,
    executionWindow:identity.executionWindow,
    triggerFingerprint:identity.triggerFingerprint,
    idempotencyKey:identity.idempotencyKey,
    dispatch:null,
    recovery:null,
    acceptedEvidenceRefs:accepted.map(item => item.ref),
    hardBoundary:null,
  };

  if (!validOwner(obligation, agent)) {
    return freeze({ ...base, status:'BLOCKED_HARD_BOUNDARY', hardBoundary:'unknown_or_disabled_owner_agent' });
  }
  if (due !== true) return freeze({ ...base, status:'NOT_DUE' });
  if (hardBoundary) return freeze({ ...base, status:'BLOCKED_HARD_BOUNDARY', hardBoundary:String(hardBoundary) });

  if (productionProofRequired ? exactProduction.length > 0 : accepted.length > 0) {
    const refs = productionProofRequired ? exactProduction.map(item => item.ref) : accepted.map(item => item.ref);
    return freeze({ ...base, status:'COMPLETED', acceptedEvidenceRefs:refs });
  }

  const deadline = evidenceDeadline ? normalizeDate(evidenceDeadline) : null;
  const expired = Boolean(deadline && normalizeDate(now).getTime() > deadline.getTime());

  if (priorRecovery && expired) return freeze({ ...base, status:'RECOVERING' });

  if (priorWork && expired) {
    return freeze({
      ...base,
      status:'MISSED_OBLIGATION',
      recovery:{
        type:'RecoveryWork',
        ownerAgent,
        obligationId:identity.obligationId,
        idempotencyKey:`recovery|${identity.idempotencyKey}`,
        policy:obligation.recoveryPolicy ?? null,
      },
    });
  }

  if (priorWork) return freeze({ ...base, status:'AWAITING_OUTCOME' });

  return freeze({
    ...base,
    status:'PENDING',
    dispatch:{
      type:'AgentWork',
      ownerAgent,
      obligationId:identity.obligationId,
      idempotencyKey:identity.idempotencyKey,
      requestedOutcome:obligation.expected ?? null,
    },
  });
}
