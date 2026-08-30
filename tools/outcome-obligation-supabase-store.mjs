function requireText(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} must be a non-empty string`);
  return value.trim();
}

function normalizeBaseUrl(url) {
  return requireText(url, 'url').replace(/\/+$/, '');
}

function metadataFromRecord(record) {
  const metadata = {};
  for (const key of ['requestedOutcome', 'triggerFingerprint', 'executionWindow', 'policy']) {
    if (record[key] !== undefined && record[key] !== null) metadata[key] = record[key];
  }
  return metadata;
}

function normalizeDispatchRow(row) {
  if (!row) return null;
  return Object.freeze({
    type:row.record_type,
    idempotencyKey:row.idempotency_key,
    obligationId:row.obligation_id,
    ownerAgent:row.owner_agent,
    traceId:row.trace_id,
    state:row.state,
    ...(row.record && typeof row.record === 'object' ? row.record : {}),
  });
}

function normalizeEvidenceRow(row) {
  return Object.freeze({
    ref:row.evidence_ref,
    type:row.evidence_type,
    independent:row.independent === true,
    accepted:row.accepted === true,
    exactProduction:row.exact_production === true,
    metadata:row.metadata && typeof row.metadata === 'object' ? Object.freeze({ ...row.metadata }) : Object.freeze({}),
  });
}

export function createSupabaseOutcomeObligationStores({
  url = process.env.SUPABASE_URL,
  token = process.env.SUPABASE_SERVICE_ROLE_KEY,
  fetchImpl = fetch,
} = {}) {
  const baseUrl = normalizeBaseUrl(url);
  const serviceToken = requireText(token, 'token');
  if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl must be a function');

  const dispatchEndpoint = `${baseUrl}/rest/v1/brain_outcome_obligation_dispatch`;
  const evidenceEndpoint = `${baseUrl}/rest/v1/brain_outcome_obligation_evidence`;

  function headers(extra = {}) {
    return {
      apikey:serviceToken,
      authorization:`Bearer ${serviceToken}`,
      accept:'application/json',
      ...extra,
    };
  }

  async function request(endpoint, init = {}) {
    const response = await fetchImpl(endpoint, init);
    if (!response?.ok) {
      let detail = '';
      try { detail = await response.text(); } catch {}
      throw new Error(`Supabase outcome obligation store failed: ${response?.status ?? 'unknown'}${detail ? ` ${detail}` : ''}`);
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async function getDispatch(idempotencyKey, recordType) {
    const key = requireText(idempotencyKey, 'idempotencyKey');
    const type = requireText(recordType, 'recordType');
    const endpoint = `${dispatchEndpoint}?idempotency_key=eq.${encodeURIComponent(key)}&record_type=eq.${encodeURIComponent(type)}&select=*`;
    const rows = await request(endpoint, { method:'GET', headers:headers() });
    return normalizeDispatchRow(Array.isArray(rows) ? rows[0] : null);
  }

  function createDispatchStore(recordType) {
    return Object.freeze({
      async get(idempotencyKey) {
        return getDispatch(idempotencyKey, recordType);
      },
      async putIfAbsent(record) {
        if (!record || record.type !== recordType) throw new TypeError(`record.type must be ${recordType}`);
        const idempotencyKey = requireText(record.idempotencyKey, 'record.idempotencyKey');
        const row = {
          idempotency_key:idempotencyKey,
          record_type:recordType,
          obligation_id:requireText(record.obligationId, 'record.obligationId'),
          owner_agent:requireText(record.ownerAgent, 'record.ownerAgent'),
          trace_id:requireText(record.traceId, 'record.traceId'),
          state:requireText(record.state, 'record.state'),
          record:metadataFromRecord(record),
        };
        await request(dispatchEndpoint, {
          method:'POST',
          headers:headers({
            'content-type':'application/json',
            Prefer:'resolution=ignore-duplicates,return=minimal',
          }),
          body:JSON.stringify(row),
        });
        const persisted = await getDispatch(idempotencyKey, recordType);
        if (!persisted) throw new Error('Supabase outcome obligation store failed: persisted dispatch record not found');
        return Object.freeze({ created:true, record:persisted });
      },
    });
  }

  const evidenceStore = Object.freeze({
    async list(idempotencyKey) {
      const key = requireText(idempotencyKey, 'idempotencyKey');
      const endpoint = `${evidenceEndpoint}?idempotency_key=eq.${encodeURIComponent(key)}&select=evidence_ref,evidence_type,independent,accepted,exact_production,metadata&order=created_at.asc`;
      const rows = await request(endpoint, { method:'GET', headers:headers() });
      if (!Array.isArray(rows)) throw new Error('Supabase outcome obligation store failed: evidence response must be an array');
      return Object.freeze(rows.map(normalizeEvidenceRow));
    },
  });

  return Object.freeze({
    workStore:createDispatchStore('AgentWork'),
    recoveryStore:createDispatchStore('RecoveryWork'),
    evidenceStore,
  });
}
