function required(value, name) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${name} is required`);
  return value.trim();
}

function normalizeUrl(url) {
  return required(url, 'Supabase URL').replace(/\/+$/, '');
}

export function createSupabaseEvidenceWriter({ url, serviceRoleKey, fetchImpl = globalThis.fetch } = {}) {
  const baseUrl = normalizeUrl(url);
  const key = required(serviceRoleKey, 'Supabase service role key');
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch implementation is required');

  return async function writeSupabaseEvidence(record = {}) {
    required(record.idempotency_key, 'idempotency_key');
    required(record.change_id, 'change_id');
    required(record.component_id, 'component_id');
    required(record.target, 'target');
    required(record.status, 'status');

    const body = {
      idempotency_key: record.idempotency_key,
      change_id: record.change_id,
      component_id: record.component_id,
      target: record.target,
      status: record.status,
      error_class: record.error_class ?? null,
      remote_status: Number.isFinite(Number(record.remote_status)) ? Number(record.remote_status) : null,
      remote_ref: record.remote_ref ?? null,
      candidate_identity: record.candidate_identity ?? null,
      tested_identity: record.tested_identity ?? null,
      payload_sha256: record.payload_sha256 ?? null,
      evidence: {
        contract: record.contract ?? 'BRAIN-DELIVERY-v2',
        ...(record.evidence && typeof record.evidence === 'object' ? record.evidence : {}),
      },
    };

    const response = await fetchImpl(`${baseUrl}/rest/v1/brain_delivery_evidence?on_conflict=idempotency_key`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify(body),
    });

    if (!response?.ok) {
      const detail = typeof response?.text === 'function' ? await response.text() : '';
      const error = new Error(`Supabase evidence write failed (${response?.status ?? 0})${detail ? `: ${detail}` : ''}`);
      error.status = Number(response?.status ?? 0);
      throw error;
    }
  };
}

export function createSupabaseEvidenceWriterFromEnv({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  return createSupabaseEvidenceWriter({
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl,
  });
}
