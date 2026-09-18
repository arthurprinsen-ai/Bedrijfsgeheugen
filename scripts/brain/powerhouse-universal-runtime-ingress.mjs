import crypto from 'node:crypto';
import { compileChatLearningPreflight } from './chat-learning-preflight.mjs';
import { assertUniversalCompletion } from './powerhouse-universal-completion-gate.mjs';

export const UNIVERSAL_INGRESS_VERSION = 'POWERHOUSE-UNIVERSAL-INGRESS-v1';

const SUPPORTED_ACTOR_KINDS = new Set([
  'chat',
  'agent',
  'workflow',
  'scheduled',
  'portal',
  'cockpit',
  'edge_function',
  'runtime',
]);

function requiredString(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`UNIVERSAL_INGRESS_INVALID ${name} is required`);
  return value.trim();
}

function sha256(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function stablePreflightIdentity(preflight) {
  const { telemetry: _telemetry, totalBytes: _totalBytes, ...stable } = preflight;
  return stable;
}

function stableReceiptFields(receipt) {
  return {
    version: receipt.version,
    status: receipt.status,
    runId: receipt.runId,
    actorKind: receipt.actorKind,
    actorId: receipt.actorId,
    candidateId: receipt.candidateId,
    preflightVersion: receipt.preflightVersion,
    preflightStatus: receipt.preflightStatus,
    preflightDigest: receipt.preflightDigest,
  };
}

function assertValidReceipt(receipt) {
  if (!receipt || typeof receipt !== 'object') throw new Error('UNIVERSAL_INGRESS_INVALID ingressReceipt is required');
  if (receipt.version !== UNIVERSAL_INGRESS_VERSION) throw new Error('UNIVERSAL_INGRESS_INVALID receipt version');
  if (receipt.status !== 'ADMITTED') throw new Error('UNIVERSAL_INGRESS_INVALID receipt status');
  if (receipt.preflightStatus !== 'READY') throw new Error('UNIVERSAL_INGRESS_INVALID preflight status');
  requiredString(receipt.runId, 'runId');
  requiredString(receipt.actorId, 'actorId');
  requiredString(receipt.candidateId, 'candidateId');
  if (!SUPPORTED_ACTOR_KINDS.has(receipt.actorKind)) throw new Error(`UNIVERSAL_INGRESS_INVALID actorKind ${receipt.actorKind ?? 'missing'}`);
  if (!/^[a-f0-9]{64}$/.test(receipt.preflightDigest ?? '')) throw new Error('UNIVERSAL_INGRESS_INVALID preflightDigest');
  const expected = sha256(stableReceiptFields(receipt));
  if (receipt.receiptDigest !== expected) throw new Error('UNIVERSAL_INGRESS_INVALID receiptDigest mismatch');
  return receipt;
}

export function beginMaterialRun({
  rootDir = process.cwd(),
  runId,
  actorKind,
  actorId,
  candidateId,
  observedAt = new Date().toISOString(),
} = {}) {
  const normalizedRunId = requiredString(runId, 'runId');
  const normalizedActorId = requiredString(actorId, 'actorId');
  const normalizedCandidateId = requiredString(candidateId, 'candidateId');
  if (!SUPPORTED_ACTOR_KINDS.has(actorKind)) throw new Error(`UNIVERSAL_INGRESS_INVALID actorKind ${actorKind ?? 'missing'}`);
  const normalizedObservedAt = requiredString(observedAt, 'observedAt');

  const preflight = compileChatLearningPreflight({ rootDir });
  if (preflight.status !== 'READY') throw new Error(`UNIVERSAL_INGRESS_PREFLIGHT_NOT_READY ${preflight.status ?? 'missing'}`);

  const stable = {
    version: UNIVERSAL_INGRESS_VERSION,
    status: 'ADMITTED',
    runId: normalizedRunId,
    actorKind,
    actorId: normalizedActorId,
    candidateId: normalizedCandidateId,
    preflightVersion: preflight.version,
    preflightStatus: preflight.status,
    preflightDigest: sha256(stablePreflightIdentity(preflight)),
  };

  return Object.freeze({
    ...stable,
    receiptDigest: sha256(stable),
    observedAt: normalizedObservedAt,
  });
}

export function completeMaterialRun({ ingressReceipt, manifest } = {}) {
  const receipt = assertValidReceipt(ingressReceipt);
  if (!manifest || typeof manifest !== 'object') throw new Error('UNIVERSAL_INGRESS_INVALID completion manifest is required');
  if (manifest.runId !== receipt.runId) throw new Error('INGRESS_IDENTITY_MISMATCH runId');
  if (manifest.candidateId !== receipt.candidateId) throw new Error('INGRESS_IDENTITY_MISMATCH candidateId');

  const completion = assertUniversalCompletion(manifest);
  return Object.freeze({
    ...completion,
    ingressReceipt: receipt,
  });
}
