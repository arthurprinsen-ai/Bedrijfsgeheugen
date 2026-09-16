import { createHash } from 'node:crypto';
import { evaluateCompletionReadiness } from '../../brain/policy/completion-readiness.mjs';

const PARTIAL_CLAIMS = new Set([
  'COMMITTED',
  'MERGED',
  'PREVIEW_READY',
  'DEPLOYED_UNVERIFIED',
  'NOT_CLAIMED',
  'DEELS LIVE',
  'NIET GEDAAN',
  'FAILED',
  'RED',
  'AWAITING_OUTCOME',
  'MISSED_OBLIGATION',
  'RECOVERING'
]);

const RECOVERY_PACKET_FIELDS = Object.freeze([
  'blocker',
  'rootCause',
  'evidenceRefs',
  'attemptedFixes',
  'safeRemainingActions',
  'minimumHumanAction',
  'fixAgentHandoff',
  'boundaryFingerprint',
  'resumeWhen'
]);

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function nonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function hasCompleteRecoveryPacket(packet) {
  if (!packet || typeof packet !== 'object') return false;
  return RECOVERY_PACKET_FIELDS.every(field => {
    const value = packet[field];
    return Array.isArray(value) ? nonEmptyArray(value) : nonEmptyString(value);
  });
}

function stableIdempotencyKey(identity, action, openObligations, boundaryFingerprint, retryHypothesis = null) {
  const source = JSON.stringify({
    identity:String(identity || 'unknown'),
    action:action || null,
    openObligations:[...(openObligations || [])].sort(),
    boundaryFingerprint:boundaryFingerprint || null,
    retryHypothesis:retryHypothesis || null
  });
  return createHash('sha256').update(source).digest('hex');
}

function chooseNextAction({ claim, openObligations, completionEvidence }) {
  const normalizedClaim = String(claim || '').toUpperCase();

  if (['FAILED','RED','MISSED_OBLIGATION','RECOVERING'].includes(normalizedClaim)) return 'RECOVER';
  if (['COMMITTED','MERGED','PREVIEW_READY'].includes(normalizedClaim)) return 'PROMOTE';
  if (normalizedClaim === 'DEPLOYED_UNVERIFIED') return 'READBACK';
  if (openObligations.some(id => /learning|writeback/i.test(id))) return 'WRITEBACK';
  if (!completionEvidence?.functionalReadback) return 'READBACK';
  return 'CONTINUE';
}

export function evaluateCompletion({
  identity,
  claim,
  materialObligations = [],
  completionEvidence = null,
  hardBoundary = null,
  retryHypothesis = null,
  attemptCount = 0
} = {}) {
  const readiness = evaluateCompletionReadiness({
    materialObligations,
    completionEvidence,
    hardBoundary
  });

  if (readiness.canComplete) {
    return Object.freeze({
      success:true,
      normalized_state:'LIVE_VERIFIED',
      next_action:null,
      open_obligations:Object.freeze([]),
      required_evidence:Object.freeze([]),
      recovery_packet:null,
      idempotency_key:stableIdempotencyKey(identity, null, [], null),
      resume_when:null
    });
  }

  const recoveryPacket = hardBoundary?.recoveryPacket ?? null;
  if (readiness.canWait) {
    if (hasCompleteRecoveryPacket(recoveryPacket)) {
      return Object.freeze({
        success:false,
        normalized_state:'BLOCKED_HARD_BOUNDARY',
        next_action:'WAIT_EXTERNAL',
        open_obligations:Object.freeze([...readiness.openObligations]),
        required_evidence:Object.freeze([]),
        recovery_packet:Object.freeze({ ...recoveryPacket }),
        idempotency_key:stableIdempotencyKey(identity, 'WAIT_EXTERNAL', readiness.openObligations, recoveryPacket.boundaryFingerprint),
        resume_when:recoveryPacket.resumeWhen
      });
    }

    return Object.freeze({
      success:false,
      normalized_state:'RECOVERING',
      next_action:'RECOVER',
      open_obligations:Object.freeze([...readiness.openObligations]),
      required_evidence:Object.freeze(['completeRecoveryPacket']),
      recovery_packet:recoveryPacket,
      idempotency_key:stableIdempotencyKey(identity, 'RECOVER', readiness.openObligations, recoveryPacket?.boundaryFingerprint, retryHypothesis),
      resume_when:recoveryPacket?.resumeWhen ?? null
    });
  }

  const normalizedClaim = String(claim || '').toUpperCase();
  const nextAction = chooseNextAction({
    claim:normalizedClaim,
    openObligations:readiness.openObligations,
    completionEvidence
  });
  const retryExhausted = nextAction === 'RECOVER'
    && nonEmptyString(retryHypothesis)
    && Number.isInteger(attemptCount)
    && attemptCount >= 2;
  const requiredEvidence = new Set(readiness.requiredEvidence);
  if (retryExhausted) requiredEvidence.add('newRetryHypothesisOrFallback');

  return Object.freeze({
    success:false,
    normalized_state:PARTIAL_CLAIMS.has(normalizedClaim) ? normalizedClaim : 'RECOVERING',
    next_action:nextAction,
    open_obligations:Object.freeze([...readiness.openObligations]),
    required_evidence:Object.freeze([...requiredEvidence]),
    recovery_packet:null,
    idempotency_key:stableIdempotencyKey(identity, nextAction, readiness.openObligations, null, retryHypothesis),
    resume_when:null
  });
}
