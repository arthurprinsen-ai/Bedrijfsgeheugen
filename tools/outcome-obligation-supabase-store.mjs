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

const DISPATCH_IDENTITY_FIELDS = Object.freeze(['type','idempotencyKey','obligationId','ownerAgent','traceId','state']);

function normalizeDispatchRow(row) {
  if (!row) return null;
  // The append-only SQL columns are the ONLY identity, owner and lifecycle
  // authority. JSONB record is untrusted supplemental metadata: spreading it
  // last silently allowed a forged owner/state to shadow immutable columns.
  if (row.record !== null && row.record !== undefined
      && (typeof row.record !== 'object' || Array.isArray(row.record))) {
    throw new Error('Supabase outcome obligation store failed: dispatch metadata is not an object');
  }
  const metadata = row.record ?? {};
  const canonical = {
    type:row.record_type,
    idempotencyKey:row.idempotency_key,
    obligationId:row.obligation_id,
    ownerAgent:row.owner_agent,
    traceId:row.trace_id,
    state:row.state,
  };
  for (const key of DISPATCH_IDENTITY_FIELDS) {
    if (Object.hasOwn(metadata,key) && metadata[key] !== canonical[key]) {
      throw new Error(`Supabase outcome obligation store failed: dispatch metadata identity conflict (${key})`);
    }
  }
  return Object.freeze({ ...metadata, ...canonical });
}

function assertCanonicalDispatchIdentity(input, persisted) {
  if (!persisted) throw new Error('Supabase outcome obligation store failed: persisted dispatch record not found');
  // The dispatch ledger is append-only. An identical idempotency key must
  // never silently transfer an existing obligation to a different owner.
  for (const field of ['type','idempotencyKey','obligationId','ownerAgent','traceId','state']) {
    if (persisted[field] !== input[field]) {
      throw new Error(`Supabase outcome obligation store failed: immutable dispatch identity conflict (${field})`);
    }
  }
  return persisted;
}

function normalizeEvidenceRow(row) {
  if (!row) return null;
  const metadata = row.metadata && typeof row.metadata === 'object' ? Object.freeze({ ...row.metadata }) : Object.freeze({});
  return Object.freeze({
    ref:row.evidence_ref,
    type:row.evidence_type,
    producer:metadata.producer ?? null,
    taskIdentity:metadata.taskIdentity ?? null,
    candidateIdentity:metadata.candidateIdentity ?? null,
    productionIdentity:metadata.productionIdentity ?? null,
    independent:row.independent === true,
    accepted:row.accepted === true,
    exactProduction:row.exact_production === true,
    metadata,
  });
}

function assertCanonicalEvidenceIdentity(input, persisted) {
  if (!persisted) throw new Error('Supabase outcome obligation store failed: persisted evidence record not found');
  // An immutable evidence_ref cannot be reused to upgrade or replace the proof
  // type, independent readback, owner or original production identity.
  for (const field of ['ref','type','producer','taskIdentity','candidateIdentity','productionIdentity',
    'independent','accepted','exactProduction']) {
    if (persisted[field] !== input[field]) {
      throw new Error(`Supabase outcome obligation store failed: immutable evidence identity conflict (${field})`);
    }
  }
  return persisted;
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

  async function listDispatch(recordType) {
    const type = requireText(recordType, 'recordType');
    // Append-only source: stable secondary key ensures records sharing a created_at
    // cannot shift between pages. Never mistake the first PostgREST 1000 rows for
    // the complete historical backlog.
    const endpoint = `${dispatchEndpoint}?record_type=eq.${encodeURIComponent(type)}&select=*&order=created_at.asc,idempotency_key.asc`;
    const pageSize = 500;
    const collected = [];
    const seen = new Set();
    let offset = 0;
    let expectedTotal = null;
    for (let page = 0; page < 2048; page += 1) {
      const response = await fetchImpl(endpoint, {
        method:'GET',
        headers:headers({ Prefer:'count=exact', 'Range-Unit':'items', Range:`${offset}-${offset + pageSize - 1}` }),
      });
      if (!response?.ok) {
        let detail = '';
        try { detail = await response.text(); } catch {}
        throw new Error(`Supabase outcome obligation store failed: ${response?.status ?? 'unknown'}${detail ? ` ${detail}` : ''}`);
      }
      let rows;
      try { rows = JSON.parse(await response.text()); }
      catch { throw new Error('Supabase outcome obligation store failed: dispatch page response invalid JSON'); }
      if (!Array.isArray(rows)) throw new Error('Supabase outcome obligation store failed: dispatch page response must be an array');
      const contentRange = response.headers?.get?.('content-range') ?? '';
      const match = /^(\d+)-(\d+)\/(\d+)$/.exec(contentRange);
      const empty = contentRange === '*/0';
      if (!match && !empty) throw new Error('Supabase outcome obligation store failed: dispatch exact Content-Range missing');
      const total = empty ? 0 : Number(match[3]);
      const first = empty ? 0 : Number(match[1]);
      const last = empty ? -1 : Number(match[2]);
      if (!Number.isSafeInteger(total) || total < 0
          || (expectedTotal !== null && total !== expectedTotal)
          || first !== offset || last !== offset + rows.length - 1
          || (total === 0 && rows.length !== 0)
          || (total > 0 && (rows.length === 0 || rows.length > pageSize || offset + rows.length > total))) {
        throw new Error('Supabase outcome obligation store failed: dispatch page incomplete or source changed');
      }
      if (expectedTotal === null) expectedTotal = total;
      for (const row of rows) {
        if (row?.record_type !== type || typeof row.idempotency_key !== 'string'
            || !row.idempotency_key || seen.has(row.idempotency_key)) {
          throw new Error('Supabase outcome obligation store failed: dispatch page identity mismatch or duplicate');
        }
        seen.add(row.idempotency_key);
        collected.push(normalizeDispatchRow(row));
      }
      offset += rows.length;
      if (offset === expectedTotal) return Object.freeze(collected);
    }
    throw new Error('Supabase outcome obligation store failed: dispatch page limit reached without complete evidence');
  }

  function createDispatchStore(recordType) {
    return Object.freeze({
      async get(idempotencyKey) {
        return getDispatch(idempotencyKey, recordType);
      },
      async list() {
        return listDispatch(recordType);
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
        // PostgREST only returns newly inserted rows with return=representation.
        // An ignored duplicate returns [], so a replay is not a new handoff.
        // Keep atomic ignore-duplicates for concurrent original-owner runners.
        const inserted = await request(dispatchEndpoint, {
          method:'POST',
          headers:headers({
            'content-type':'application/json',
            Prefer:'resolution=ignore-duplicates,return=representation',
          }),
          body:JSON.stringify(row),
        });
        if (!Array.isArray(inserted) || inserted.length > 1) {
          throw new Error('Supabase outcome obligation store failed: dispatch insert outcome unverified');
        }
        if (inserted.length === 1 && (
          inserted[0]?.idempotency_key !== idempotencyKey
          || inserted[0]?.record_type !== recordType
        )) {
          throw new Error('Supabase outcome obligation store failed: inserted dispatch identity unverified');
        }
        const persisted = assertCanonicalDispatchIdentity(
          row && { type:recordType, idempotencyKey, obligationId:row.obligation_id,
            ownerAgent:row.owner_agent, traceId:row.trace_id, state:row.state },
          await getDispatch(idempotencyKey, recordType)
        );
        return Object.freeze({ created:inserted.length === 1, record:persisted });
      },
    });
  }

  const evidenceStore = Object.freeze({
    async get(idempotencyKey, evidenceRef) {
      const key = requireText(idempotencyKey, 'idempotencyKey');
      const ref = requireText(evidenceRef, 'evidenceRef');
      const endpoint = `${evidenceEndpoint}?idempotency_key=eq.${encodeURIComponent(key)}&evidence_ref=eq.${encodeURIComponent(ref)}&select=evidence_ref,evidence_type,independent,accepted,exact_production,metadata`;
      const rows = await request(endpoint, { method:'GET', headers:headers() });
      return normalizeEvidenceRow(Array.isArray(rows) ? rows[0] : null);
    },
    async list(idempotencyKey) {
      const key = requireText(idempotencyKey, 'idempotencyKey');
      const endpoint = `${evidenceEndpoint}?idempotency_key=eq.${encodeURIComponent(key)}&select=evidence_ref,evidence_type,independent,accepted,exact_production,metadata&order=created_at.asc`;
      const rows = await request(endpoint, { method:'GET', headers:headers() });
      if (!Array.isArray(rows)) throw new Error('Supabase outcome obligation store failed: evidence response must be an array');
      return Object.freeze(rows.map(normalizeEvidenceRow));
    },
    async putIfAbsent(record) {
      if (!record || typeof record !== 'object') throw new TypeError('evidence record is required');
      const idempotencyKey = requireText(record.idempotencyKey, 'record.idempotencyKey');
      const ref = requireText(record.ref, 'record.ref');
      const row = {
        idempotency_key:idempotencyKey,
        evidence_ref:ref,
        evidence_type:requireText(record.type, 'record.type'),
        independent:record.independent === true,
        accepted:record.accepted === true,
        exact_production:record.exactProduction === true,
        metadata:{
          ...(record.metadata && typeof record.metadata === 'object' ? record.metadata : {}),
          producer:record.producer ?? null,
          taskIdentity:record.taskIdentity ?? null,
          candidateIdentity:record.candidateIdentity ?? null,
          productionIdentity:record.productionIdentity ?? null,
        },
      };
      const expected = {
        ref, type:row.evidence_type, producer:row.metadata.producer,
        taskIdentity:row.metadata.taskIdentity, candidateIdentity:row.metadata.candidateIdentity,
        productionIdentity:row.metadata.productionIdentity,
        independent:row.independent, accepted:row.accepted, exactProduction:row.exact_production,
      };
      const existing = await this.get(idempotencyKey, ref);
      if (existing) {
        return Object.freeze({ created:false, record:assertCanonicalEvidenceIdentity(expected, existing) });
      }
      // The earlier read is only a hint. A concurrent original writer can
      // insert the same composite key between GET and POST. The provider's
      // atomic ignore-duplicates result determines whether it was new.
      const inserted = await request(evidenceEndpoint, {
        method:'POST',
        headers:headers({
          'content-type':'application/json',
          Prefer:'resolution=ignore-duplicates,return=representation',
        }),
        body:JSON.stringify(row),
      });
      if (!Array.isArray(inserted) || inserted.length > 1) {
        throw new Error('Supabase outcome obligation store failed: evidence insert outcome unverified');
      }
      if (inserted.length === 1 && (
          inserted[0]?.idempotency_key !== idempotencyKey
          || inserted[0]?.evidence_ref !== ref
          || inserted[0]?.evidence_type !== row.evidence_type
      )) {
        throw new Error('Supabase outcome obligation store failed: inserted evidence identity unverified');
      }
      const persisted = assertCanonicalEvidenceIdentity(expected, await this.get(idempotencyKey, ref));
      return Object.freeze({ created:inserted.length === 1, record:persisted });
    },
  });

  return Object.freeze({
    workStore:createDispatchStore('AgentWork'),
    recoveryStore:createDispatchStore('RecoveryWork'),
    evidenceStore,
  });
}
