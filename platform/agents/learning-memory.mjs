function normalize(values) {
  return [...new Set((values ?? []).map(value => String(value).trim()).filter(Boolean))].sort();
}

function overlap(a, b) {
  const target = new Set(b);
  return a.some(value => target.has(value));
}

export function createLearningMemory() {
  const records = new Map();
  let sequence = 0;

  function recordVerified(input) {
    if (!input?.tenantId || !input?.fingerprint) throw new TypeError('tenantId and fingerprint are required');
    if (input.verified !== true || !Array.isArray(input.evidence) || input.evidence.length === 0) {
      throw new Error('verified learning requires verification evidence');
    }
    const record = Object.freeze({
      id:`LRN-${++sequence}`,
      tenantId:input.tenantId,
      fingerprint:input.fingerprint,
      domains:Object.freeze(normalize(input.domains)),
      sourceAgentId:input.sourceAgentId ?? null,
      actionFingerprint:input.actionFingerprint ?? null,
      evidence:Object.freeze([...input.evidence]),
      impact:input.impact ?? null,
      confidence:Number(input.confidence ?? 0),
      verified:true,
      reuseCount:0,
      reusedByAgentIds:Object.freeze([]),
    });
    records.set(record.id, record);
    return record;
  }

  function findMatches({ tenantId, domains = [], fingerprint }) {
    const requestedDomains = normalize(domains);
    return Object.freeze([...records.values()].filter(record =>
      record.tenantId === tenantId &&
      record.fingerprint === fingerprint &&
      (requestedDomains.length === 0 || overlap(record.domains, requestedDomains))
    ));
  }

  function markReused(id, { agentId } = {}) {
    const current = records.get(id);
    if (!current) throw new Error('learning record not found');
    const reusedBy = agentId ? normalize([...current.reusedByAgentIds, agentId]) : [...current.reusedByAgentIds];
    const updated = Object.freeze({ ...current, reuseCount:current.reuseCount + 1, reusedByAgentIds:Object.freeze(reusedBy) });
    records.set(id, updated);
    return updated;
  }

  function get(id) { return records.get(id) ?? null; }
  return Object.freeze({ recordVerified, findMatches, markReused, get });
}
