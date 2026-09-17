import crypto from 'node:crypto';

export const FAST_EXECUTION_VERSION = 'POWERHOUSE-FAST-DEVELOPMENT-PROTOCOL-v2';

const FAST_HINTS = /\b(status|readback|lookup|check|controle|inspect|health|current|huidig|samenvat|summary|css|copy|spacing)\b/i;
const MUTATION_HINTS = /\b(fix|repair|repareer|update|wijzig|change|publish|publiceer|implementeer|implement|create|maak|delete|verwijder|migrate|migreer|rollback|promote|merge)\b/i;
const STANDARD_HINTS = /\b(fix|bug|feature|deploy|update|wijzig|change|test|refactor)\b/i;
const CRITICAL_HINTS = /\b(security|architect|migration|schema|permissions?|destructive|data loss|auth|iam|rbac|identity|publishing|control[- ]plane|secret|credential)\b/i;
const ALLOWED_CLASSES = new Set(['FAST', 'STANDARD', 'CRITICAL', 'WAITING_EXTERNAL']);
const NON_CACHEABLE_EVIDENCE = new Set(['production-readback', 'security-freshness', 'provider-outcome', 'final-media-proof']);
const PERSISTENT_CACHE_PRODUCER = 'POWERHOUSE_FAST_DEVELOPMENT_V2';
const PERSISTENT_CACHE_ENTRY = 'FAST_PROOF_CACHE_ENTRY';
const PERSISTENT_CACHE_INVALIDATION = 'FAST_PROOF_CACHE_INVALIDATION';

function digest(value) {
  return crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
}

function stableUnique(values = []) {
  return [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b)));
}

export function classifyTask({ task = '', risk = 'normal', explicitClass = null, waitingExternal = false, impactedContracts = [] } = {}) {
  if (explicitClass != null) {
    if (!ALLOWED_CLASSES.has(explicitClass)) throw new Error(`Unsupported execution class: ${explicitClass}`);
    return explicitClass;
  }
  if (waitingExternal) return 'WAITING_EXTERNAL';
  const text = `${String(task)} ${impactedContracts.join(' ')}`;
  if (risk === 'high' || risk === 'unknown' || CRITICAL_HINTS.test(text)) return 'CRITICAL';
  if (FAST_HINTS.test(text) && !MUTATION_HINTS.test(text)) return 'FAST';
  if (STANDARD_HINTS.test(text) || MUTATION_HINTS.test(text)) return 'STANDARD';
  if (!String(task).trim()) return 'CRITICAL';
  return String(task).trim().length <= 80 ? 'FAST' : 'STANDARD';
}

export function buildStablePolicyPrefix() {
  return Object.freeze({
    version: FAST_EXECUTION_VERSION,
    defaultEnabled: true,
    existingStateFirst: true,
    reuseFirst: true,
    canonicalIntegration: true,
    closedLoop: true,
    deltaFirst: true,
    lazyHistory: true,
    noOpBeforeReasoning: true,
    impactBasedTesting: true,
    parallelExecutionDag: true,
    evidenceReuseWithFreshness: true,
    persistentEvidenceAuthority: 'brain_outcome_obligation_evidence',
    fullReleaseGatesAtPromotionBoundary: true,
    productionReadbackCacheable: false,
    terminalState: 'LIVE & BEWEZEN'
  });
}

function stringifyToolOutput(value) {
  if (typeof value === 'string') return value;
  if (value === undefined) return 'undefined';
  try { const serialized = JSON.stringify(value); return serialized === undefined ? String(value) : serialized; }
  catch (error) { return `[Unserializable tool output: ${error.message}]`; }
}

export function compactToolOutput(value, { maxChars = 12_000, maxLines = 300 } = {}) {
  if (!Number.isInteger(maxChars) || maxChars < 1) throw new Error('maxChars must be a positive integer');
  if (!Number.isInteger(maxLines) || maxLines < 1) throw new Error('maxLines must be a positive integer');
  const text = stringifyToolOutput(value);
  const lines = text.split('\n');
  let compacted = lines.slice(0, maxLines).join('\n');
  let truncated = lines.length > maxLines;
  if (compacted.length > maxChars) { compacted = compacted.slice(0, maxChars); truncated = true; }
  return truncated ? `${compacted}\n[TRUNCATED: bounded by Powerhouse fast-development policy]` : compacted;
}

function boundedClone(value, maxChars) {
  if (value == null) return value;
  const compacted = compactToolOutput(value, { maxChars: Math.max(1, maxChars), maxLines: 160 });
  try { return JSON.parse(compacted); } catch { return compacted; }
}

export function computeDeltaContext({ lastVerifiedState, currentState, relevantKeys = null } = {}) {
  if (!lastVerifiedState || !currentState || typeof lastVerifiedState !== 'object' || typeof currentState !== 'object') {
    return Object.freeze({ failClosed: true, fallback: 'FULL_CANONICAL_PREFLIGHT', reason: 'missing-state-identity' });
  }
  const keys = relevantKeys?.length ? relevantKeys : stableUnique([...Object.keys(lastVerifiedState), ...Object.keys(currentState)]);
  const delta = {};
  for (const key of keys) {
    const before = lastVerifiedState[key];
    const after = currentState[key];
    if (JSON.stringify(before) !== JSON.stringify(after)) delta[key] = { before, after };
  }
  return delta;
}

export function buildExecutionPacketV2(input = {}, { maxChars = 12_000 } = {}) {
  const packet = {
    protocol_version: FAST_EXECUTION_VERSION,
    task_id: String(input.taskId ?? ''),
    intent_digest: digest(String(input.intent ?? '')),
    execution_class: input.executionClass ?? classifyTask({ task: input.intent, risk: input.risk, waitingExternal: input.waitingExternal, impactedContracts: input.impactedContracts }),
    main_sha: input.mainSha ?? null,
    last_verified_sha: input.lastVerifiedSha ?? null,
    last_verified_state_id: input.lastVerifiedStateId ?? null,
    current_state_id: input.currentStateId ?? null,
    component_ids: stableUnique(input.componentIds),
    delivery_lanes: stableUnique(input.deliveryLanes),
    changed_paths: stableUnique(input.changedPaths),
    resource_refs: stableUnique(input.resourceRefs),
    open_obligations: input.openObligations ?? [],
    relevant_learning_fingerprints: stableUnique(input.relevantLearningFingerprints),
    known_blockers: input.knownBlockers ?? [],
    required_gates: stableUnique(input.requiredGates),
    config_digest: input.configDigest ?? null,
    schema_digest: input.schemaDigest ?? null,
    dependency_digest: input.dependencyDigest ?? null,
    test_policy_digest: input.testPolicyDigest ?? null,
    freshness: input.freshness ?? {},
    lazy_load_refs: stableUnique(input.lazyLoadRefs)
  };
  const missingIdentity = ['main_sha','last_verified_sha','last_verified_state_id','current_state_id'].filter(k => !packet[k]);
  if (missingIdentity.length) packet.fallback = { fail_closed: true, route: 'FULL_CANONICAL_PREFLIGHT', missing: missingIdentity };
  const serialized = JSON.stringify(packet);
  if (serialized.length <= maxChars) return packet;
  const compact = { ...packet, open_obligations: boundedClone(packet.open_obligations, Math.floor(maxChars * 0.18)), known_blockers: boundedClone(packet.known_blockers, Math.floor(maxChars * 0.12)), freshness: boundedClone(packet.freshness, Math.floor(maxChars * 0.08)), bounded: true };
  if (JSON.stringify(compact).length > maxChars) throw new Error('Execution Packet v2 exceeds bounded context budget');
  return compact;
}

export function detectNoOp({ desiredFingerprint, provenFingerprints = [], runtimeSatisfied = false, obligationFulfilled = false, duplicateOwner = null } = {}) {
  const evidence = [];
  for (const item of provenFingerprints) if (item?.fingerprint === desiredFingerprint && item.valid === true && item.evidenceRef) evidence.push(item.evidenceRef);
  if (runtimeSatisfied) evidence.push('runtime:desired-state');
  if (obligationFulfilled) evidence.push('obligation:fulfilled');
  if (duplicateOwner) evidence.push(`duplicate-owner:${duplicateOwner}`);
  return evidence.length ? { status: 'NO_CHANGE_NEEDED', evidence } : { status: 'CHANGE_REQUIRED', evidence: [] };
}

export function buildEvidenceIdentity({ candidateSha, environment, configDigest, schemaDigest, dependencyDigest, gateVersion, contractDigest } = {}) {
  const fields = { candidateSha, environment, configDigest, schemaDigest, dependencyDigest, gateVersion, contractDigest };
  if (Object.values(fields).some(value => value == null || value === '')) throw new Error('Complete exact evidence identity is required');
  return digest(fields);
}

export class EvidenceCache {
  constructor({ now = () => Date.now() } = {}) { this.now = now; this.items = new Map(); }
  put(key, value, { ttlMs = 60_000, source = null, candidateId = null, identity = null, evidenceType = 'generic', invalidation = [] } = {}) {
    if (!key) throw new Error('evidence key is required');
    if (NON_CACHEABLE_EVIDENCE.has(evidenceType)) return null;
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) throw new Error('ttlMs must be positive');
    const observedAt = this.now();
    const exactIdentity = identity ?? candidateId ?? null;
    this.items.set(key, { value, observedAt, expiresAt: observedAt + ttlMs, source, candidateId, identity: exactIdentity, evidenceType, invalidation: stableUnique(invalidation) });
    return value;
  }
  get(key, { candidateId = null, identity = null, evidenceType = null } = {}) {
    const item = this.items.get(key);
    if (!item || item.expiresAt < this.now()) return null;
    const requestedIdentity = identity ?? candidateId ?? null;
    if (requestedIdentity && item.identity !== requestedIdentity && item.candidateId !== requestedIdentity) return null;
    if (evidenceType && (NON_CACHEABLE_EVIDENCE.has(evidenceType) || item.evidenceType !== evidenceType)) return null;
    return item.value;
  }
  invalidate(key) { return this.items.delete(key); }
  invalidateByDependency(token) { let count = 0; for (const [key, item] of this.items) if (item.invalidation.includes(token)) { this.items.delete(key); count += 1; } return count; }
  clear() { this.items.clear(); }
  metadata(key) { const item = this.items.get(key); return item ? { observedAt: item.observedAt, expiresAt: item.expiresAt, source: item.source, candidateId: item.candidateId, identity: item.identity, evidenceType: item.evidenceType, invalidation: item.invalidation } : null; }
}

function requireEvidenceStore(evidenceStore) {
  if (!evidenceStore || typeof evidenceStore.list !== 'function' || typeof evidenceStore.putIfAbsent !== 'function') throw new TypeError('evidenceStore with list/putIfAbsent is required');
  return evidenceStore;
}

function persistentBucket(key) {
  return `fast-proof-cache|${digest(String(key))}`;
}

function recordMetadata(record) {
  return record?.metadata && typeof record.metadata === 'object' ? record.metadata : {};
}

export class PersistentEvidenceCache {
  constructor({ evidenceStore, now = () => Date.now() } = {}) {
    this.evidenceStore = requireEvidenceStore(evidenceStore);
    this.now = now;
  }

  async put(key, value, { ttlMs = 60_000, source = null, identity, evidenceType = 'generic', invalidation = [] } = {}) {
    if (!key) throw new Error('evidence key is required');
    if (NON_CACHEABLE_EVIDENCE.has(evidenceType)) return null;
    if (!identity) throw new Error('persistent evidence requires exact identity');
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) throw new Error('ttlMs must be positive');
    const observedAt = this.now();
    const metadata = { cacheKey:String(key), value, identity, evidenceType, observedAt, expiresAt:observedAt + ttlMs, source, invalidation:stableUnique(invalidation) };
    const idempotencyKey = persistentBucket(key);
    const ref = `fast-proof:${digest({ idempotencyKey, identity, evidenceType, observedAt, value })}`;
    await this.evidenceStore.putIfAbsent({
      idempotencyKey,
      ref,
      type:PERSISTENT_CACHE_ENTRY,
      producer:PERSISTENT_CACHE_PRODUCER,
      taskIdentity:'powerhouse-fast-development-protocol-v2',
      candidateIdentity:identity,
      productionIdentity:null,
      independent:true,
      accepted:true,
      exactProduction:false,
      metadata,
    });
    return value;
  }

  async get(key, { identity, evidenceType = 'generic' } = {}) {
    if (!key || !identity || NON_CACHEABLE_EVIDENCE.has(evidenceType)) return null;
    const records = await this.evidenceStore.list(persistentBucket(key));
    const invalidatedAt = records
      .filter(record => record.type === PERSISTENT_CACHE_INVALIDATION && recordMetadata(record).cacheKey === String(key))
      .reduce((latest, record) => Math.max(latest, Number(recordMetadata(record).observedAt ?? 0)), 0);
    const matches = records
      .filter(record => record.type === PERSISTENT_CACHE_ENTRY)
      .map(record => ({ record, metadata:recordMetadata(record) }))
      .filter(({ metadata }) => metadata.cacheKey === String(key) && metadata.identity === identity && metadata.evidenceType === evidenceType)
      .filter(({ metadata }) => Number(metadata.expiresAt ?? 0) >= this.now() && Number(metadata.observedAt ?? 0) > invalidatedAt)
      .sort((a, b) => Number(b.metadata.observedAt ?? 0) - Number(a.metadata.observedAt ?? 0));
    return matches.length ? matches[0].metadata.value : null;
  }

  async invalidate(key, { reason = 'explicit-invalidation' } = {}) {
    if (!key) throw new Error('evidence key is required');
    const observedAt = this.now();
    const idempotencyKey = persistentBucket(key);
    const metadata = { cacheKey:String(key), observedAt, reason };
    await this.evidenceStore.putIfAbsent({
      idempotencyKey,
      ref:`fast-proof-invalidation:${digest({ idempotencyKey, observedAt, reason })}`,
      type:PERSISTENT_CACHE_INVALIDATION,
      producer:PERSISTENT_CACHE_PRODUCER,
      taskIdentity:'powerhouse-fast-development-protocol-v2',
      candidateIdentity:null,
      productionIdentity:null,
      independent:true,
      accepted:true,
      exactProduction:false,
      metadata,
    });
    return true;
  }
}

export async function runParallelStateRetrieval(adapters = {}) {
  const entries = Object.entries(adapters).filter(([, fn]) => typeof fn === 'function');
  const values = await Promise.all(entries.map(async ([name, fn]) => [name, await fn()]));
  return Object.fromEntries(values);
}

export function buildMinimalContextPack({ task, executionClass, hotState = {}, delta = [], evidence = [], maxChars = 24_000 } = {}) {
  if (!Number.isInteger(maxChars) || maxChars < 512) throw new Error('maxChars must be an integer >= 512');
  const base = { version: FAST_EXECUTION_VERSION, task: String(task ?? ''), executionClass: executionClass ?? classifyTask({ task }), policy: buildStablePolicyPrefix(), hotState: boundedClone(hotState, Math.floor(maxChars * 0.38)), delta: boundedClone(delta, Math.floor(maxChars * 0.24)), evidence: boundedClone(evidence, Math.floor(maxChars * 0.24)) };
  const serialized = JSON.stringify(base);
  if (serialized.length <= maxChars) return base;
  const contextDigest = digest(serialized);
  const fallback = { version: base.version, task: base.task.slice(0, Math.max(0, Math.min(1000, Math.floor(maxChars * 0.18)))), executionClass: base.executionClass, contextDigest, hotState: boundedClone(hotState, Math.max(1, Math.floor(maxChars * 0.16))), delta: boundedClone(delta, Math.max(1, Math.floor(maxChars * 0.1))), evidence: boundedClone(evidence, Math.max(1, Math.floor(maxChars * 0.1))), bounded: true };
  if (JSON.stringify(fallback).length <= maxChars) return fallback;
  const minimal = { version: base.version, executionClass: base.executionClass, contextDigest, bounded: true, context: '[BOUNDED: retrieve canonical state by digest on demand]' };
  if (JSON.stringify(minimal).length > maxChars) throw new Error('maxChars is too small for the mandatory context envelope');
  return minimal;
}

export function buildDeltaWriteback({ changed = [], evidence = [], outcome = null, learning = [], obligationDelta = [], timing = {}, cacheUsage = {}, openObligations = [] } = {}) {
  return { changed, evidence, outcome, learning, obligation_delta: obligationDelta, timing, cache_usage: cacheUsage, open_obligations: openObligations };
}

const SLI_MAP = {
  contextLoad: 'context_load_ms', classification: 'classification_ms', reasoning: 'reasoning_ms', tool: 'tool_ms',
  targetedTest: 'targeted_test_ms', fullGate: 'full_gate_ms', deploy: 'deploy_ms', proof: 'proof_ms', writeback: 'writeback_ms',
  context: 'context_load_ms', toolWait: 'tool_ms', test: 'targeted_test_ms', readback: 'proof_ms'
};
export class LatencyTrace {
  constructor({ now = () => Date.now() } = {}) { this.now = now; this.createdAt = now(); this.starts = new Map(); this.durations = Object.fromEntries([...new Set(Object.values(SLI_MAP))].map(key => [key, 0])); }
  markStart(name) { this.starts.set(name, this.now()); }
  markEnd(name) { if (!this.starts.has(name)) return 0; const duration = Math.max(0, this.now() - this.starts.get(name)); this.starts.delete(name); if (SLI_MAP[name]) this.durations[SLI_MAP[name]] += duration; return duration; }
  snapshot() { return { ...this.durations, total_lead_time_ms: Math.max(0, this.now() - this.createdAt) }; }
}

export function createFastExecutionEnvelope({ task, risk = 'normal', hotState = {}, delta = [], evidence = [], waitingExternal = false } = {}) {
  const executionClass = classifyTask({ task, risk, waitingExternal });
  return { version: FAST_EXECUTION_VERSION, executionClass, stablePolicyPrefix: buildStablePolicyPrefix(), context: buildMinimalContextPack({ task, executionClass, hotState, delta, evidence }) };
}
