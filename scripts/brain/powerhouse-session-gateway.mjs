import crypto from 'node:crypto';

export const SESSION_BINDING_VERSION = 'POWERHOUSE-SESSION-BINDING-v1';
export const RECEIPT_VERSION = 'POWERHOUSE-PREFLIGHT-RECEIPT-v1';

const HARD_BOUNDARY_TYPES = new Set([
  'SECRETS_OR_CREDENTIALS',
  'PERMISSIONS',
  'SECURITY_CONTROL_WEAKENING',
  'DESTRUCTIVE_OR_IRREVERSIBLE_DATA',
  'PAID_EXTERNAL_RESOURCE',
  'LEGAL_OR_FINANCIAL_COMMITMENT',
  'GENUINELY_NEW_UNRESOLVED_CHOICE'
]);

const COVERED_AUTHORITY = new Set([
  'EXISTING_ARCHITECTURE',
  'POWERHOUSE_OPERATING_RULE',
  'LIVE_AND_BEWEZEN_DELIVERY',
  'CANONICAL_WRITEBACK',
  'DOCUMENTATION',
  'SAFE_IMPLEMENTATION_DETAIL',
  'AUTHORIZED_CONTINUATION'
]);

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
}

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
}

function normalizeAuthoritySnapshot(snapshot = {}) {
  return Object.freeze({
    covered: Object.freeze([...(snapshot.covered ?? [])].map(String).filter(Boolean).sort()),
    hardBoundaries: Object.freeze([...(snapshot.hardBoundaries ?? [])].map(String).filter(Boolean).sort()),
    decisions: Object.freeze([...(snapshot.decisions ?? [])].map(String).filter(Boolean).sort()),
  });
}

function normalizeObligations(obligations = []) {
  return Object.freeze((Array.isArray(obligations) ? obligations : []).map(item => Object.freeze({
    id: text(item?.id),
    state: text(item?.state || item?.status).toUpperCase(),
  })).filter(item => item.id).sort((a, b) => a.id.localeCompare(b.id)));
}

export function bindPowerhouseSession({
  sessionId,
  runId,
  observedAt = new Date().toISOString(),
  preflightPacket,
  authoritySnapshot = {},
  openObligations = [],
  executionClass = 'STANDARD',
  candidateId = null,
} = {}) {
  if (!text(sessionId)) throw new Error('SESSION_BINDING_BLOCKED: sessionId is required');
  if (!text(runId)) throw new Error('SESSION_BINDING_BLOCKED: runId is required');
  if (!preflightPacket || preflightPacket.status !== 'READY') throw new Error('SESSION_BINDING_BLOCKED: READY preflight packet is required');
  if (!text(observedAt)) throw new Error('SESSION_BINDING_BLOCKED: observedAt is required');

  const normalizedAuthority = normalizeAuthoritySnapshot(authoritySnapshot);
  const normalizedObligations = normalizeObligations(openObligations);
  const canonicalProjection = {
    sources: preflightPacket.sources ?? [],
    fingerprints: preflightPacket.fingerprints ?? [],
    preventions: preflightPacket.preventions ?? [],
    blockers: preflightPacket.blockers ?? [],
    resume_contracts: preflightPacket.resume_contracts ?? [],
    universalCompletion: preflightPacket.universalCompletion ?? null,
    fastExecution: preflightPacket.fastExecution ?? null,
    sessionBinding: preflightPacket.sessionBinding ?? null,
  };
  const policyVersions = Object.freeze({
    fastExecution: preflightPacket.fastExecution?.version ?? null,
    universalCompletion: preflightPacket.universalCompletion?.version ?? null,
    sessionBinding: preflightPacket.sessionBinding?.version ?? SESSION_BINDING_VERSION,
  });

  const receiptCore = {
    version: RECEIPT_VERSION,
    state: 'POWERHOUSE_BOUND',
    sessionId: text(sessionId),
    runId: text(runId),
    observedAt: text(observedAt),
    canonicalStateDigest: digest(canonicalProjection),
    preflightPacketDigest: digest(preflightPacket),
    policyVersions,
    authoritySnapshot: normalizedAuthority,
    openObligationSnapshot: normalizedObligations,
    executionClass: text(executionClass).toUpperCase() || 'STANDARD',
    candidateId: text(candidateId) || null,
  };
  return Object.freeze({ ...receiptCore, receiptDigest: digest(receiptCore) });
}

export function verifySessionReceipt(receipt, { runId, candidateId = null, expectedCanonicalStateDigest = null } = {}) {
  const failures = [];
  if (!receipt || receipt.version !== RECEIPT_VERSION) failures.push('missing or unsupported session receipt');
  if (receipt?.state !== 'POWERHOUSE_BOUND') failures.push('session is not POWERHOUSE_BOUND');
  if (!text(receipt?.sessionId)) failures.push('sessionId missing');
  if (!text(receipt?.runId)) failures.push('runId missing');
  if (text(runId) && text(receipt?.runId) !== text(runId)) failures.push('runId mismatch');
  if (!text(receipt?.observedAt)) failures.push('observedAt missing');
  if (!text(receipt?.canonicalStateDigest)) failures.push('canonicalStateDigest missing');
  if (!text(receipt?.preflightPacketDigest)) failures.push('preflightPacketDigest missing');
  if (!text(receipt?.receiptDigest)) failures.push('receiptDigest missing');
  if (expectedCanonicalStateDigest && receipt?.canonicalStateDigest !== expectedCanonicalStateDigest) failures.push('canonical state changed; refresh session receipt');
  if (candidateId && receipt?.candidateId && receipt.candidateId !== candidateId) failures.push('candidate identity mismatch');
  if (receipt && text(receipt.receiptDigest)) {
    const { receiptDigest, ...core } = receipt;
    if (digest(core) !== receiptDigest) failures.push('receipt integrity mismatch');
  }
  return Object.freeze({ ok: failures.length === 0, failures });
}

export function resolveApprovalRequest({ decisionClass, authoritySnapshot = {}, reason = '' } = {}) {
  const decision = text(decisionClass).toUpperCase();
  const snapshot = normalizeAuthoritySnapshot(authoritySnapshot);
  const covered = new Set(snapshot.covered.map(value => value.toUpperCase()));
  const hard = new Set(snapshot.hardBoundaries.map(value => value.toUpperCase()));

  if (HARD_BOUNDARY_TYPES.has(decision) || hard.has(decision)) {
    return Object.freeze({ action: 'ASK_USER', allowed: true, reason: text(reason) || decision, decisionClass: decision });
  }
  if (COVERED_AUTHORITY.has(decision) || covered.has(decision)) {
    return Object.freeze({ action: 'CONTINUE_AUTONOMOUSLY', allowed: false, reason: 'existing canonical authority already covers this decision', decisionClass: decision });
  }
  return Object.freeze({ action: 'CONTINUE_AUTONOMOUSLY', allowed: false, reason: 'safe default: do not re-ask unless a hard human-authority boundary is proven', decisionClass: decision || 'UNCLASSIFIED' });
}

export function assertApprovalRequestAllowed(input) {
  const decision = resolveApprovalRequest(input);
  if (!decision.allowed) throw new Error(`APPROVAL_REQUEST_BLOCKED: ${decision.reason}`);
  return decision;
}
