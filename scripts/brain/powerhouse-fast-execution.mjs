import crypto from 'node:crypto';

export const FAST_EXECUTION_VERSION = 'POWERHOUSE-FAST-EXECUTION-v1';

const FAST_HINTS = /\b(status|readback|lookup|check|controle|inspect|health|current|huidig|samenvat|summary)\b/i;
const STANDARD_HINTS = /\b(fix|bug|feature|deploy|update|wijzig|change|publish|publiceer|test)\b/i;
const DEEP_HINTS = /\b(security|architect|migration|incident|root cause|schema|permissions?|destructive|rollback|data loss|auth|iam|rbac)\b/i;

export function classifyTask({ task = '', risk = 'normal', explicitClass = null } = {}) {
  if (['FAST', 'STANDARD', 'DEEP'].includes(explicitClass)) return explicitClass;
  const text = String(task);
  if (risk === 'high' || DEEP_HINTS.test(text)) return 'DEEP';
  if (STANDARD_HINTS.test(text)) return 'STANDARD';
  if (FAST_HINTS.test(text) || text.trim().length <= 80) return 'FAST';
  return 'STANDARD';
}

export function buildStablePolicyPrefix() {
  return Object.freeze({
    version: FAST_EXECUTION_VERSION,
    defaultEnabled: true,
    existingStateFirst: true,
    reuseFirst: true,
    canonicalIntegration: true,
    closedLoop: true,
    hotStateFirst: true,
    deltaFirst: true,
    lazyTools: true,
    parallelReadOnlyRetrieval: true,
    deterministicBeforeModel: true,
    boundedToolOutput: true,
    evidenceReuseWithFreshness: true,
    terminalState: 'LIVE & BEWEZEN'
  });
}

function stringifyToolOutput(value) {
  if (typeof value === 'string') return value;
  if (value === undefined) return 'undefined';
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? String(value) : serialized;
  } catch (error) {
    return `[Unserializable tool output: ${error.message}]`;
  }
}

export function compactToolOutput(value, { maxChars = 12_000, maxLines = 300 } = {}) {
  if (!Number.isInteger(maxChars) || maxChars < 1) throw new Error('maxChars must be a positive integer');
  if (!Number.isInteger(maxLines) || maxLines < 1) throw new Error('maxLines must be a positive integer');
  const text = stringifyToolOutput(value);
  const lines = text.split('\n');
  let compacted = lines.slice(0, maxLines).join('\n');
  let truncated = lines.length > maxLines;
  if (compacted.length > maxChars) {
    compacted = compacted.slice(0, maxChars);
    truncated = true;
  }
  return truncated ? `${compacted}\n[TRUNCATED: bounded by Powerhouse fast-execution policy]` : compacted;
}

export class EvidenceCache {
  constructor({ now = () => Date.now() } = {}) {
    this.now = now;
    this.items = new Map();
  }
  put(key, value, { ttlMs = 60_000, source = null, candidateId = null } = {}) {
    if (!key) throw new Error('evidence key is required');
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) throw new Error('ttlMs must be positive');
    const observedAt = this.now();
    this.items.set(key, { value, observedAt, expiresAt: observedAt + ttlMs, source, candidateId });
    return value;
  }
  get(key, { candidateId = null } = {}) {
    const item = this.items.get(key);
    if (!item || item.expiresAt < this.now()) return null;
    if (candidateId && item.candidateId !== candidateId) return null;
    return item.value;
  }
  invalidate(key) {
    return this.items.delete(key);
  }
  clear() {
    this.items.clear();
  }
  metadata(key) {
    const item = this.items.get(key);
    return item ? { observedAt: item.observedAt, expiresAt: item.expiresAt, source: item.source, candidateId: item.candidateId } : null;
  }
}

export async function runParallelStateRetrieval(adapters = {}) {
  const entries = Object.entries(adapters).filter(([, fn]) => typeof fn === 'function');
  const values = await Promise.all(entries.map(async ([name, fn]) => [name, await fn()]));
  return Object.fromEntries(values);
}

function boundedClone(value, maxChars) {
  if (value == null) return value;
  const compacted = compactToolOutput(value, { maxChars: Math.max(1, maxChars), maxLines: 160 });
  try { return JSON.parse(compacted); } catch { return compacted; }
}

export function buildMinimalContextPack({ task, executionClass, hotState = {}, delta = [], evidence = [], maxChars = 24_000 } = {}) {
  if (!Number.isInteger(maxChars) || maxChars < 512) throw new Error('maxChars must be an integer >= 512');
  const base = {
    version: FAST_EXECUTION_VERSION,
    task: String(task ?? ''),
    executionClass: executionClass ?? classifyTask({ task }),
    policy: buildStablePolicyPrefix(),
    hotState: boundedClone(hotState, Math.floor(maxChars * 0.38)),
    delta: boundedClone(delta, Math.floor(maxChars * 0.24)),
    evidence: boundedClone(evidence, Math.floor(maxChars * 0.24))
  };
  const serialized = JSON.stringify(base);
  if (serialized.length <= maxChars) return base;

  const digest = crypto.createHash('sha256').update(serialized).digest('hex');
  const fallback = {
    version: base.version,
    task: base.task.slice(0, Math.max(0, Math.min(1000, Math.floor(maxChars * 0.18)))),
    executionClass: base.executionClass,
    contextDigest: digest,
    hotState: boundedClone(hotState, Math.max(1, Math.floor(maxChars * 0.16))),
    delta: boundedClone(delta, Math.max(1, Math.floor(maxChars * 0.1))),
    evidence: boundedClone(evidence, Math.max(1, Math.floor(maxChars * 0.1))),
    bounded: true
  };
  if (JSON.stringify(fallback).length <= maxChars) return fallback;

  const minimal = {
    version: base.version,
    executionClass: base.executionClass,
    contextDigest: digest,
    bounded: true,
    context: '[BOUNDED: retrieve canonical state by digest on demand]'
  };
  if (JSON.stringify(minimal).length > maxChars) throw new Error('maxChars is too small for the mandatory context envelope');
  return minimal;
}

const SLI_MAP = {
  context: 'context-build-ms',
  reasoning: 'reasoning-ms',
  toolWait: 'tool-wait-ms',
  test: 'test-ms',
  deploy: 'deploy-ms',
  readback: 'readback-ms'
};

export class LatencyTrace {
  constructor({ now = () => Date.now() } = {}) {
    this.now = now;
    this.createdAt = now();
    this.starts = new Map();
    this.durations = Object.fromEntries(Object.values(SLI_MAP).map(key => [key, 0]));
  }
  markStart(name) { this.starts.set(name, this.now()); }
  markEnd(name) {
    if (!this.starts.has(name)) return 0;
    const duration = Math.max(0, this.now() - this.starts.get(name));
    this.starts.delete(name);
    if (SLI_MAP[name]) this.durations[SLI_MAP[name]] += duration;
    return duration;
  }
  snapshot() {
    return { ...this.durations, 'total-ms': Math.max(0, this.now() - this.createdAt) };
  }
}

export function createFastExecutionEnvelope({ task, risk = 'normal', hotState = {}, delta = [], evidence = [] } = {}) {
  const executionClass = classifyTask({ task, risk });
  return {
    version: FAST_EXECUTION_VERSION,
    executionClass,
    stablePolicyPrefix: buildStablePolicyPrefix(),
    context: buildMinimalContextPack({ task, executionClass, hotState, delta, evidence })
  };
}
