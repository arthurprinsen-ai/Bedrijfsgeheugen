import { createHash } from 'node:crypto';

const REQUIRED_EVIDENCE = Object.freeze([
  'CANDIDATE_TESTS',
  'PROTECTED_DELIVERY',
  'PRODUCTION_IDENTITY',
  'FUNCTIONAL_READBACK',
  'OBLIGATIONS_COMPLETE',
  'CAPABILITY_HANDOFF',
  'LEARNING_WRITEBACK',
  'CHANNEL_POLICY_AUTHORIZATION',
]);

const TRUSTED_PRODUCERS = Object.freeze({
  CANDIDATE_TESTS:new Set(['BRAIN_DELIVERY']),
  PROTECTED_DELIVERY:new Set(['BG169','PRODUCTION_READBACK']),
  PRODUCTION_IDENTITY:new Set(['BG169','PRODUCTION_READBACK']),
  FUNCTIONAL_READBACK:new Set(['PRODUCTION_READBACK']),
  OBLIGATIONS_COMPLETE:new Set(['OUTCOME_OBLIGATION_RUNTIME']),
  CAPABILITY_HANDOFF:new Set(['BG167']),
  LEARNING_WRITEBACK:new Set(['BG168_BG166']),
  CHANNEL_POLICY_AUTHORIZATION:new Set(['SOCIAL_PUBLICATION_AUTHORITY']),
});

const TERMINAL_OBLIGATION_STATUSES = new Set(['COMPLETED','VERIFIED','PRODUCTION_GREEN','LIVE_VERIFIED','ROLLED_BACK_GREEN']);
const RECOVERY_PACKET_FIELDS = Object.freeze([
  'blocker',
  'root_cause',
  'evidence_refs',
  'attempted_repairs',
  'safe_remaining_actions',
  'minimum_human_action',
  'fix_agent_handoff',
  'boundary_fingerprint',
  'resume_when',
]);

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function populated(value) {
  if (Array.isArray(value)) return value.length > 0 && value.every(item => text(item));
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return text(value).length > 0;
}

function freezeList(values) {
  return Object.freeze([...values]);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
}

function decisionKey(input) {
  return `completion-supervisor|${createHash('sha256').update(JSON.stringify(stable(input))).digest('hex')}`;
}

function freezePacket(packet) {
  if (!packet || typeof packet !== 'object') return null;
  return Object.freeze(Object.fromEntries(Object.entries(packet).map(([key, value]) => [
    key,
    Array.isArray(value) ? freezeList(value) : value && typeof value === 'object' ? Object.freeze({ ...value }) : value,
  ])));
}

export function validateRecoveryPacket(packet) {
  const source = packet && typeof packet === 'object' ? packet : {};
  const missing = RECOVERY_PACKET_FIELDS.filter(field => !populated(source[field]));
  return Object.freeze({ valid:missing.length === 0, missing:freezeList(missing) });
}

function openObligations(materialObligations) {
  const obligations = Array.isArray(materialObligations) ? materialObligations : [];
  return obligations
    .filter(obligation => !TERMINAL_OBLIGATION_STATUSES.has(text(obligation?.status).toUpperCase()))
    .map((obligation, index) => text(obligation?.id) || `obligation-${index + 1}`)
    .sort();
}

function acceptedEvidence(evidence, obligationId, candidateIdentity, productionIdentity) {
  const accepted = new Map();
  let identityMismatch = false;
  for (const item of Array.isArray(evidence) ? evidence : []) {
    const type = text(item?.type).toUpperCase();
    const trusted = TRUSTED_PRODUCERS[type];
    if (!trusted || !trusted.has(text(item?.producer).toUpperCase())) continue;
    if (item?.accepted !== true || item?.independent !== true) continue;
    if (text(item?.taskIdentity) !== obligationId || text(item?.candidateIdentity) !== candidateIdentity) {
      identityMismatch = true;
      continue;
    }
    if (['PROTECTED_DELIVERY','PRODUCTION_IDENTITY','FUNCTIONAL_READBACK','OBLIGATIONS_COMPLETE','CAPABILITY_HANDOFF','LEARNING_WRITEBACK','CHANNEL_POLICY_AUTHORIZATION'].includes(type)
      && text(item?.productionIdentity) !== productionIdentity) {
      identityMismatch = true;
      continue;
    }
    accepted.set(type, item);
  }
  return { accepted, identityMismatch };
}

function nextAction(required) {
  if (required.includes('IDENTITY_MATCH')) return 'READBACK';
  if (required.includes('NEW_HYPOTHESIS_OR_FALLBACK') || required.includes('RECOVERY_PACKET') || required.includes('CANDIDATE_TESTS') || required.includes('OBLIGATIONS_COMPLETE')) return 'RECOVER';
  if (required.includes('PROTECTED_DELIVERY')) return 'PROMOTE';
  if (required.includes('PRODUCTION_IDENTITY') || required.includes('FUNCTIONAL_READBACK')) return 'READBACK';
  if (required.includes('CHANNEL_POLICY_AUTHORIZATION')) return 'RECOVER';
  if (required.includes('CAPABILITY_HANDOFF') || required.includes('LEARNING_WRITEBACK')) return 'WRITEBACK';
  return 'CONTINUE';
}

function normalizedState(action) {
  return Object.freeze({
    CONTINUE:'ACTIVE',
    RECOVER:'RECOVERING',
    PROMOTE:'PROMOTION_REQUIRED',
    READBACK:'READBACK_REQUIRED',
    WRITEBACK:'WRITEBACK_REQUIRED',
  })[action] ?? 'ACTIVE';
}

export function evaluateCompletion(input = {}) {
  const obligationId = text(input.obligationId);
  const workId = text(input.workId);
  const candidateIdentity = text(input.candidateIdentity);
  const productionIdentity = text(input.productionIdentity);
  const open = openObligations(input.materialObligations);
  const packet = input.hardBoundary?.recovery_packet;
  const packetValidation = validateRecoveryPacket(packet);
  const boundaryProven = input.hardBoundary?.present === true
    && input.hardBoundary?.proven === true
    && populated(input.hardBoundary?.evidence);

  const baseKeyInput = {
    obligationId,
    workId,
    claim:text(input.claim).toUpperCase(),
    candidateIdentity,
    productionIdentity,
    evidence:(Array.isArray(input.evidence) ? input.evidence : []).filter(item => text(item?.type).toUpperCase() !== 'SUPERVISOR_DECISION'),
    materialObligations:input.materialObligations ?? [],
    hardBoundary:input.hardBoundary ?? null,
    retry:input.retry ?? null,
  };

  if (boundaryProven && packetValidation.valid) {
    return Object.freeze({
      success:false,
      candidateIdentity,
      productionIdentity,
      normalized_state:'WAIT_EXTERNAL',
      next_action:'WAIT_EXTERNAL',
      open_obligations:freezeList(open.length ? open : [obligationId || 'completion-obligation']),
      required_evidence:freezeList([]),
      recovery_packet:freezePacket(packet),
      idempotency_key:decisionKey(baseKeyInput),
      resume_when:Object.freeze({ ...packet.resume_when }),
      canWait:true,
    });
  }

  const { accepted, identityMismatch } = acceptedEvidence(input.evidence, obligationId, candidateIdentity, productionIdentity);
  const required = REQUIRED_EVIDENCE.filter(type => !accepted.has(type));
  if (!obligationId || !workId || !candidateIdentity) required.unshift('IDENTITY');
  if (!productionIdentity && required.some(type => !['IDENTITY','CANDIDATE_TESTS','PROTECTED_DELIVERY'].includes(type))) required.push('PRODUCTION_IDENTITY');
  if (identityMismatch) required.push('IDENTITY_MATCH');
  if (open.length > 0 && !required.includes('OBLIGATIONS_COMPLETE')) required.push('OBLIGATIONS_COMPLETE');
  if (boundaryProven && !packetValidation.valid) required.push('RECOVERY_PACKET');
  if (Number(input.retry?.attemptCount) >= 2 && input.retry?.newEvidence !== true) required.push('NEW_HYPOTHESIS_OR_FALLBACK');
  const uniqueRequired = [...new Set(required)];

  if (uniqueRequired.length === 0 && open.length === 0) {
    return Object.freeze({
      success:true,
      candidateIdentity,
      productionIdentity,
      normalized_state:'LIVE_VERIFIED',
      next_action:'NONE',
      open_obligations:freezeList([]),
      required_evidence:freezeList([]),
      recovery_packet:null,
      idempotency_key:decisionKey(baseKeyInput),
      resume_when:null,
      canWait:false,
    });
  }

  const action = nextAction(uniqueRequired);
  return Object.freeze({
    success:false,
    candidateIdentity,
    productionIdentity,
    normalized_state:normalizedState(action),
    next_action:action,
    open_obligations:freezeList(open.length ? open : [obligationId || 'completion-obligation']),
    required_evidence:freezeList(uniqueRequired),
    recovery_packet:boundaryProven ? freezePacket(packet) : null,
    idempotency_key:decisionKey(baseKeyInput),
    resume_when:null,
    canWait:false,
  });
}
