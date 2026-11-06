import { createHmac } from 'node:crypto';

export const OBSERVATION_CONTRACT = 'PLANNED_ACTION_GUARD_OBSERVATION_V1';
export const REVIEW_CONTRACT = 'PLANNED_ACTION_INDEPENDENT_REVIEW_V1';

const unique = values => [...new Set(values)].sort();
const ruleIds = values => Array.isArray(values) && values.every(v => typeof v === 'string' && /^[A-Z][A-Z0-9_]+$/.test(v))
  ? unique(values) : null;
const objects = value => value && typeof value === 'object' && !Array.isArray(value);
const field = (row, camel, snake) => row?.[camel] ?? row?.[snake];
const validTime = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const safeId = value => typeof value === 'string' && /^[a-zA-Z0-9_.:|-]{4,180}$/.test(value);
const rate = (n, d) => d > 0 ? n / d : null;
const status = record => String(record?.status ?? '');
const kind = record => field(record, 'kind', 'record_kind');
const type = record => field(record, 'type', 'record_type');
const id = record => field(record, 'id', 'record_id');
const time = record => field(record, 'observedAt', 'observed_at');
const tenant = record => field(record, 'tenantId', 'tenant_id');

export function buildPlannedActionEvidence({
  tenantId, action, result, agentId, sourceRef, executionId, hmacKey, observedAt,
} = {}) {
  if (!safeId(tenantId) || !safeId(agentId) || !safeId(executionId)) throw new TypeError('stable tenant, agent and execution IDs required');
  if (!/^github:(?:pr|issue|run):[0-9]+$/.test(sourceRef ?? '')) throw new TypeError('reviewable GitHub source ref required');
  if (typeof action !== 'string' || !action.trim()) throw new TypeError('actual planned action required');
  if (typeof hmacKey !== 'string' || hmacKey.length < 32) throw new TypeError('secure server-side HMAC key required');
  if (!validTime(observedAt)) throw new TypeError('observedAt must be ISO timestamp');
  const matches = ruleIds(result?.matches?.map(x => x.ruleId));
  const blocked = ruleIds(result?.unacknowledged?.map(x => x.ruleId));
  if (!matches || !blocked || typeof result?.ok !== 'boolean') throw new TypeError('canonical guard result required');
  if (result.ok !== (blocked.length === 0) || blocked.some(x => !matches.includes(x))) throw new TypeError('inconsistent canonical guard result');
  const digest = createHmac('sha256', hmacKey).update(action, 'utf8').digest('hex');
  const recordId = 'planned-action-decision:' + executionId;
  const record = {
    schemaVersion: 'brain-record.v1', tenantId, type: 'Evidence', kind: 'evidence',
    id: recordId, subjectId: 'planned-action:' + executionId, correlationId: sourceRef,
    predecessorIds: [], owner: agentId, status: 'OBSERVED', observedAt,
    executed: false, verified: false, result: null, evidenceIds: [],
    provenance: { source: 'REAL_AGENT_PREFLIGHT', sourceRef, observer: agentId },
    payload: {
      contract: OBSERVATION_CONTRACT, sourceKind: 'REAL_AGENT_PREFLIGHT', sourceRef,
      agentId, executionId, actionHmacSha256: digest, matchedRuleIds: matches,
      blockedRuleIds: blocked, blocked: !result.ok, outcome: 'NOT_VERIFIED',
    },
  };
  return Object.freeze({ record, idempotencyKey: 'planned-action-decision:' + tenantId + ':' + executionId });
}

export async function appendPlannedActionEvidence(adapter, prepared, sourceRevision = null) {
  if (typeof adapter?.appendRecord !== 'function' || !prepared?.record || !prepared.idempotencyKey) {
    throw new TypeError('existing BRAIN append adapter and observation required');
  }
  return adapter.appendRecord(prepared.record, { idempotencyKey: prepared.idempotencyKey, sourceRevision });
}

// Observations and independent reviews are separate canonical BRAIN records.
// A self-reported acknowledgment never becomes an independent review or a safe outcome.
export function evaluatePlannedActionRecall(records, {
  from, to, minReviewed = 30, minPositive = 10, minNegative = 10, minAgents = 2,
} = {}) {
  if (!Array.isArray(records)) throw new TypeError('BRAIN records array required');
  if (from !== undefined && !validTime(from)) throw new TypeError('valid from required');
  if (to !== undefined && !validTime(to)) throw new TypeError('valid to required');
  const start = from ? Date.parse(from) : -Infinity;
  const end = to ? Date.parse(to) : Infinity;
  if (end < start) throw new RangeError('time window is reversed');
  if (![minReviewed, minPositive, minNegative, minAgents].every(n => Number.isInteger(n) && n >= 1)) throw new TypeError('positive evidence floors required');

  const decisions = new Map();
  const conflicted = new Set();
  const reviews = new Map();
  for (const record of records) {
    const payload = record?.payload;
    if (!objects(payload) || !validTime(time(record))) continue;
    if (payload.contract === OBSERVATION_CONTRACT) {
      if (type(record) !== 'Evidence' || kind(record) !== 'evidence') continue;
      if (payload.sourceKind !== 'REAL_AGENT_PREFLIGHT' || !/^github:(?:pr|issue|run):[0-9]+$/.test(payload.sourceRef ?? '')) continue;
      if (!safeId(payload.agentId) || !safeId(payload.executionId) || !/^[0-9a-f]{64}$/.test(payload.actionHmacSha256 ?? '')) continue;
      if (typeof payload.blocked !== 'boolean') continue;
      const actual = ruleIds(payload.matchedRuleIds), blocked = ruleIds(payload.blockedRuleIds);
      if (!actual || !blocked || blocked.some(x => !actual.includes(x)) || payload.blocked !== (blocked.length > 0)) continue;
      const key = id(record);
      if (!safeId(key) || !safeId(tenant(record)) || status(record) !== 'OBSERVED') continue;
      if (decisions.has(key)) conflicted.add(key);
      else decisions.set(key, record);
    } else if (payload.contract === REVIEW_CONTRACT) {
      if (type(record) !== 'Verification' || kind(record) !== 'verification') continue;
      if (record.verified !== true || payload.independent !== true || !safeId(payload.reviewerId)) continue;
      if (!safeId(payload.decisionRecordId) || !/^https:\/\/github\.com\/[^/]+\/[^/]+\/(?:issues|pull|actions\/runs)\/[0-9]+(?:$|\/)/.test(payload.evidenceRef ?? '')) continue;
      if (ruleIds(payload.expectedRuleIds) === null) continue;
      const group = payload.decisionRecordId;
      reviews.set(group, [...(reviews.get(group) || []), record]);
    }
  }

  let observations = 0, reviewed = 0, excluded = 0;
  let tp = 0, fp = 0, fn = 0, safe = 0, falseBlocks = 0;
  let positive = 0, negative = 0;
  const agents = new Set(), breakdown = new Map();
  for (const [decisionId, decision] of decisions) {
    const at = Date.parse(time(decision));
    if (at < start || at > end) continue;
    observations++;
    if (conflicted.has(decisionId)) { excluded++; continue; }
    const candidates = reviews.get(decisionId) || [];
    if (candidates.length !== 1) { excluded++; continue; }
    const review = candidates[0], actualPayload = decision.payload, label = review.payload;
    if (tenant(review) !== tenant(decision) || label.reviewerId === actualPayload.agentId || Date.parse(time(review)) < at) { excluded++; continue; }
    const expected = ruleIds(label.expectedRuleIds), observed = ruleIds(actualPayload.matchedRuleIds);
    if (!expected || !observed) { excluded++; continue; }
    reviewed++; agents.add(actualPayload.agentId);
    if (expected.length) positive++;
    else { negative++; safe++; if (actualPayload.blocked) falseBlocks++; }
    for (const rid of unique([...expected, ...observed])) {
      const data = breakdown.get(rid) || { ruleId: rid, tp: 0, fp: 0, fn: 0 };
      const e = expected.includes(rid), o = observed.includes(rid);
      if (e && o) { data.tp++; tp++; }
      else if (!e && o) { data.fp++; fp++; }
      else if (e && !o) { data.fn++; fn++; }
      breakdown.set(rid, data);
    }
  }
  const sampleAdequate = reviewed >= minReviewed && positive >= minPositive && negative >= minNegative && agents.size >= minAgents;
  const verdict = reviewed === 0 ? 'NOT_MEASURED' : sampleAdequate ? 'MEASURED' : 'INSUFFICIENT_EVIDENCE';
  return Object.freeze({
    contract: 'PLANNED_ACTION_RECALL_EVALUATION_V1', verdict,
    sample: { observations, reviewed, excluded, agents: agents.size, positive, negative, floors: { minReviewed, minPositive, minNegative, minAgents } },
    confusion: { tp, fp, fn, falseBlocks, safe },
    metrics: {
      recall: sampleAdequate ? rate(tp, tp + fn) : null,
      precision: sampleAdequate ? rate(tp, tp + fp) : null,
      falseBlockRate: sampleAdequate ? rate(falseBlocks, safe) : null,
    },
    perRule: [...breakdown.values()].sort((a,b)=>a.ruleId.localeCompare(b.ruleId)).map(row => ({
      ...row,
      recall: sampleAdequate ? rate(row.tp, row.tp + row.fn) : null,
      precision: sampleAdequate ? rate(row.tp, row.tp + row.fp) : null,
    })),
    causalPrevention: 'NOT_PROVEN', // guard match ≠ actual prevented incident
  });
}
