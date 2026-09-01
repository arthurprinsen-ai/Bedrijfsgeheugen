const SECRET_KEY = /(authorization|password|passwd|token|secret|api[_-]?key)/i;

function redact(value, key = '') {
  if (SECRET_KEY.test(key)) return '[redacted]';
  if (Array.isArray(value)) return value.map(item => redact(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v, k)]));
  }
  if (typeof value === 'string') {
    return value
      .replace(/(authorization\s*[:=]\s*bearer\s+)[^\s,;]+/gi, '$1[redacted]')
      .replace(/\bbearer\s+[^\s,;]+/gi, 'bearer [redacted]')
      .replace(/\b(password|passwd|token|secret|api[_-]?key)\s*[:=]\s*([^\s,;]+)/gi, '$1=[redacted]');
  }
  return value;
}

export function sanitizeEvidence(value) {
  return redact(value);
}

export function classifyRetention(event) {
  const type = String(event?.event_type ?? '').trim().toLowerCase();
  const severity = String(event?.severity ?? '').trim().toLowerCase();
  const payloadClass = String(event?.payload_class ?? '').trim().toLowerCase();
  const privacyClass = String(event?.privacy_class ?? 'internal').trim().toLowerCase() || 'internal';

  const tier3Types = new Set(['root-cause', 'proven-fix', 'prevention-rule', 'regression-contract', 'durable-learning']);
  const tier2Types = new Set(['incident', 'recovery', 'release', 'business-outcome', 'production-outcome', 'publication-proof']);
  const tier1Types = new Set(['warning', 'retry', 'data-quality-anomaly', 'performance-anomaly']);

  let retentionTier = 0;
  let rawRetentionDays = 7;
  let durable = false;

  if (tier3Types.has(type) || payloadClass === 'learning') {
    retentionTier = 3;
    rawRetentionDays = null;
    durable = true;
  } else if (tier2Types.has(type) || severity === 'error' || payloadClass === 'evidence') {
    retentionTier = 2;
    rawRetentionDays = 180;
  } else if (tier1Types.has(type) || severity === 'warning' || payloadClass === 'operational') {
    retentionTier = 1;
    rawRetentionDays = 30;
  }

  if (privacyClass === 'restricted' || privacyClass === 'secret' || privacyClass === 'sensitive') {
    if (rawRetentionDays === null) {
      // Durable knowledge may persist only after redaction; raw sensitive payload does not.
      rawRetentionDays = 0;
    } else {
      rawRetentionDays = Math.min(rawRetentionDays, 30);
    }
  }

  return Object.freeze({
    retentionTier,
    rawRetentionDays,
    durable,
    privacyClass,
  });
}
