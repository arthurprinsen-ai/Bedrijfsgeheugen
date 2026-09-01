function clean(value) {
  return String(value ?? '').trim();
}

function parseTier(value) {
  const tier = Number(value);
  return Number.isInteger(tier) && tier >= 0 && tier <= 3 ? tier : null;
}

export function decideRawExpiry(record = {}, nowValue = new Date().toISOString()) {
  const tier = parseTier(record.retention_tier);
  if (tier === 3) {
    return Object.freeze({ expire: false, reason: 'TIER3_PERMANENT' });
  }
  if (tier === null) {
    return Object.freeze({ expire: false, reason: 'INVALID_RETENTION_TIER' });
  }

  const payload = clean(record.event_payload_json);
  if (!payload) {
    return Object.freeze({ expire: false, reason: 'RAW_PAYLOAD_ALREADY_EMPTY' });
  }

  const deadline = Date.parse(clean(record.raw_retain_until));
  const now = Date.parse(clean(nowValue));
  if (!Number.isFinite(deadline) || !Number.isFinite(now)) {
    return Object.freeze({ expire: false, reason: 'INVALID_EXPIRY_TIME' });
  }
  if (deadline > now) {
    return Object.freeze({ expire: false, reason: 'NOT_DUE' });
  }

  return Object.freeze({
    expire: true,
    reason: 'RAW_PAYLOAD_DUE',
    page_id: clean(record.page_id),
    clear_fields: Object.freeze(['Event Payload JSON']),
    preserve: Object.freeze({
      event_fingerprint: clean(record.event_fingerprint),
      payload_hash: clean(record.payload_hash),
      evidence_refs: clean(record.evidence_refs),
      graph_object_key: clean(record.graph_object_key),
    }),
  });
}
