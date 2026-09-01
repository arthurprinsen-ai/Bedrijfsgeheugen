import { createHash } from 'node:crypto';

const REQUIRED_FIELDS = ['event_id', 'source_system', 'producer_id', 'event_type'];
const SECRET_KEY = /(authorization|password|passwd|token|secret|api[_-]?key)/i;

function slug(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
}

function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

export function redactSecrets(value, key = '') {
  if (SECRET_KEY.test(key)) return '[redacted]';
  if (Array.isArray(value)) return value.map(item => redactSecrets(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, redactSecrets(childValue, childKey)]));
  }
  if (typeof value === 'string') {
    return value
      .replace(/(authorization\s*[:=]\s*bearer\s+)[^\s,;]+/gi, '$1[redacted]')
      .replace(/\bbearer\s+[^\s,;]+/gi, 'bearer [redacted]')
      .replace(/\b(password|passwd|token|secret|api[_-]?key)\s*[:=]\s*([^\s,;]+)/gi, '$1=[redacted]');
  }
  return value;
}

export function fingerprintUniversalEvent(event) {
  const basis = [
    slug(event?.domain || 'unknown'),
    slug(event?.event_type || 'unknown'),
    slug(event?.source_system || 'unknown'),
    slug(event?.producer_id || 'unknown'),
    String(event?.payload_hash || ''),
  ].join('|');
  const digest = sha256(basis).slice(0, 16);
  return `universal-event|${slug(event?.domain || 'unknown')}|${slug(event?.event_type || 'unknown')}|${digest}`;
}

export function validateUniversalEvent(event) {
  const errors = REQUIRED_FIELDS.filter(field => !String(event?.[field] ?? '').trim());
  return { ok: errors.length === 0, errors };
}

export function normalizeUniversalEvent(input, now = new Date().toISOString()) {
  const payload = redactSecrets(input?.payload ?? null);
  const payload_hash = sha256(JSON.stringify(stableValue(payload)));
  const event = {
    event_id: String(input?.event_id ?? '').trim(),
    occurred_at: String(input?.occurred_at || now),
    ingested_at: String(now),
    source_system: slug(input?.source_system),
    producer_id: String(input?.producer_id ?? '').trim(),
    domain: slug(input?.domain || 'unknown'),
    event_type: slug(input?.event_type),
    severity: slug(input?.severity || 'info'),
    entity_keys: Array.isArray(input?.entity_keys) ? [...new Set(input.entity_keys.map(value => String(value).trim()).filter(Boolean))] : [],
    correlation_id: String(input?.correlation_id ?? '').trim(),
    attribution_root_key: String(input?.attribution_root_key ?? '').trim(),
    evidence_refs: Array.isArray(input?.evidence_refs) ? [...new Set(input.evidence_refs.map(value => String(value).trim()).filter(Boolean))] : [],
    payload_hash,
    payload,
    payload_class: slug(input?.payload_class || 'operational'),
    privacy_class: slug(input?.privacy_class || 'internal'),
    retention_tier: input?.retention_tier ?? null,
    cost_units: Number.isFinite(Number(input?.cost_units)) ? Number(input.cost_units) : 0,
    status: String(input?.status || 'OBSERVED').trim().toUpperCase(),
  };
  event.fingerprint = String(input?.fingerprint ?? '').trim() || fingerprintUniversalEvent(event);
  return Object.freeze(event);
}
