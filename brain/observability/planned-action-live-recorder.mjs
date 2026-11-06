import { createHmac } from 'node:crypto';
import { createSupabaseRecordAdapter } from '../operating-loop/supabase-record-adapter.mjs';
import { buildPlannedActionEvidence, appendPlannedActionEvidence } from './planned-action-recall.mjs';

// Extend the EXISTING canonical preflight and BRAIN append route. Never a second guard,
// store, scheduler, or independent-review shortcut. All secrets stay server-side.
const safe = value => String(value ?? '').trim();
const safeId = value => /^[A-Za-z0-9_.:|-]{4,180}$/.test(value);
const sourcePattern = /^github:(?:pr|issue|run):[0-9]+$/;
const idPattern = /^[A-Za-z0-9_.:|-]{4,180}$/;

export function resolvePlannedActionRuntime(env = process.env) {
  const mode = safe(env.POWERHOUSE_ACTION_RECALL_MODE || 'auto').toLowerCase();
  if (!['auto', 'required'].includes(mode)) throw Error('PLANNED_ACTION_CAPTURE_MODE_INVALID');
  const supabaseUrl = safe(env.BG_PORTAL_EU_SUPABASE_URL || env.SUPABASE_URL).replace(/\/$/, '');
  const serviceRoleKey = safe(env.BG_PORTAL_EU_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY);
  const agentId = safe(env.POWERHOUSE_AGENT_ID);
  const sourceRef = safe(env.POWERHOUSE_ACTION_SOURCE_REF) || (env.GITHUB_RUN_ID && /^\d+$/.test(String(env.GITHUB_RUN_ID)) ? 'github:run:' + env.GITHUB_RUN_ID : '');
  const executionId = safe(env.POWERHOUSE_AGENT_EXECUTION_ID) || (env.GITHUB_RUN_ID && /^\d+$/.test(String(env.GITHUB_RUN_ID)) ? 'run-' + env.GITHUB_RUN_ID + '-attempt-' + (safe(env.GITHUB_RUN_ATTEMPT) || '1') : '');
  const tenantId = safe(env.POWERHOUSE_BRAIN_TENANT_ID || 'canonical');
  const sourceRevision = safe(env.GITHUB_SHA || env.SOURCE_SHA) || null;
  let origin;
  try {
    const u = new URL(supabaseUrl);
    if (u.protocol === 'https:' && !u.username && !u.password && !u.search && !u.hash &&
        (u.pathname === '/' || u.pathname === '') && /^[a-z0-9-]+\.supabase\.co$/i.test(u.hostname)) origin = u.origin;
  } catch { /* caller gets an unconfigured state, without echoing secrets or URLs */ }
  // Additional defense-in-depth: never accept privileged capture from a PR run.
  // Agents outside GitHub still use their explicitly authorized connection.
  const githubTrusted = env.GITHUB_ACTIONS !== 'true' || env.GITHUB_REF === 'refs/heads/main';
  const configured = Boolean(githubTrusted && origin && serviceRoleKey && safeId(agentId) && sourcePattern.test(sourceRef) && idPattern.test(executionId) && safeId(tenantId));
  if (!configured && mode === 'required') throw Error('PLANNED_ACTION_CAPTURE_AUTHORITY_OR_IDENTITY_MISSING');
  return configured
    ? Object.freeze({ state: 'CONFIGURED', origin, serviceRoleKey, agentId, sourceRef, executionId, tenantId, sourceRevision })
    : Object.freeze({ state: 'NOT_CONFIGURED' });
}

export function createCanonicalPlannedActionRecorder({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const config = resolvePlannedActionRuntime(env);
  if (config.state !== 'CONFIGURED') return Object.freeze({ status: 'NOT_CONFIGURED', record: null });
  if (typeof fetchImpl !== 'function') throw TypeError('provider fetch is required');
  const headers = {
    apikey: config.serviceRoleKey, Authorization: 'Bearer ' + config.serviceRoleKey,
    'content-type': 'application/json', Accept: 'application/json',
  };
  const request = (url, options = {}) => fetchImpl(url, { ...options, signal: AbortSignal.timeout(12000) });
  const rpcClient = {
    from() { return null; }, // canonical adapter interface; this recorder is append-only
    async rpc(functionName, params) {
      if (functionName !== 'brain_append_record') return { data: null, error: { code: 'UNTRUSTED_RPC' } };
      let response;
      try {
        response = await request(config.origin + '/rest/v1/rpc/brain_append_record', {
          method: 'POST', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify(params),
        });
      } catch { return { data: null, error: { code: 'CANONICAL_BRAIN_NETWORK_FAILED' } }; }
      if (!response.ok) return { data: null, error: { code: 'CANONICAL_BRAIN_APPEND_HTTP_' + response.status } };
      try { return { data: await response.json(), error: null }; }
      catch { return { data: null, error: { code: 'CANONICAL_BRAIN_INVALID_APPEND_RESPONSE' } }; }
    },
  };
  const adapter = createSupabaseRecordAdapter(rpcClient);
  const hmacKey = createHmac('sha256', config.serviceRoleKey)
    .update('bedrijfsgeheugen:planned-action-audit:v1', 'utf8').digest('hex');
  return Object.freeze({
    status: 'CONFIGURED',
    async record({ action, result }) {
      // The exact planned action exists only in memory, never in the remote payload.
      const intentDigest = createHmac('sha256', hmacKey).update(JSON.stringify({ action,
        matchedRuleIds: result?.matches?.map(x => x.ruleId),
        blockedRuleIds: result?.unacknowledged?.map(x => x.ruleId),
      }), 'utf8').digest('hex').slice(0, 20);
      const prepared = buildPlannedActionEvidence({
        tenantId: config.tenantId, action, result, agentId: config.agentId,
        sourceRef: config.sourceRef, executionId: config.executionId + '-' + intentDigest,
        hmacKey, observedAt: new Date().toISOString(),
      });
      await appendPlannedActionEvidence(adapter, prepared, config.sourceRevision);
      const params = new URLSearchParams({
        tenant_id: 'eq.' + config.tenantId, record_id: 'eq.' + prepared.record.id,
        select: 'tenant_id,record_id,status,payload,source_revision',
        limit: '2',
      });
      let read;
      try {
        read = await request(config.origin + '/rest/v1/brain_records?' + params, { headers });
      } catch { throw Error('PLANNED_ACTION_BRAIN_READBACK_UNAVAILABLE'); }
      if (!read.ok) throw Error('PLANNED_ACTION_BRAIN_READBACK_HTTP_' + read.status);
      let rows;
      try { rows = await read.json(); } catch { throw Error('PLANNED_ACTION_BRAIN_READBACK_INVALID'); }
      if (!Array.isArray(rows) || rows.length !== 1 || rows[0].record_id !== prepared.record.id ||
          rows[0].tenant_id !== config.tenantId || rows[0].status !== 'OBSERVED' ||
          rows[0].payload?.actionHmacSha256 !== prepared.record.payload.actionHmacSha256 ||
          rows[0].payload?.sourceRef !== config.sourceRef ||
          rows[0].payload?.agentId !== config.agentId ||
          (config.sourceRevision && rows[0].source_revision !== config.sourceRevision) ||
          JSON.stringify(rows[0].payload?.matchedRuleIds) !== JSON.stringify(prepared.record.payload.matchedRuleIds) ||
          JSON.stringify(rows[0].payload?.blockedRuleIds) !== JSON.stringify(prepared.record.payload.blockedRuleIds)) {
        throw Error('PLANNED_ACTION_BRAIN_READBACK_MISMATCH');
      }
      return Object.freeze({ status: 'PERSISTED_READBACK_VERIFIED', recordId: prepared.record.id, sourceRef: config.sourceRef });
    },
  });
}
