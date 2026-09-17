import { createClient } from 'npm:@supabase/supabase-js@2';

const ORG_ID = '6a7037d2d8fce064ac755ec7';
const PERSONAL = '6a70381699afb44349f0fb35';
const COMPANY = '6a70381699afb44349f0fb36';
const INSTAGRAM = '6a70384d99afb44349f0fba9';
const GATE = 'channel-identity-hard-gate-v3';
const CONTRACT = 'arthur-personal-linkedin-identity-v4';
const channelIds: Record<string,string> = { linkedin_personal: PERSONAL, linkedin_company: COMPANY, instagram_company: INSTAGRAM };
const obligationChannels: Record<string,string> = { linkedin_personal: 'linkedin_personal', linkedin_company: 'linkedin_company', instagram_company: 'instagram' };

const clean = (value: unknown) => String(value ?? '').trim();
const esc = (value: unknown) => String(value ?? '').replaceAll('\\','\\\\').replaceAll('"','\\"').replaceAll('\n','\\n').replaceAll('\r','');
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

async function digest(value: string) {
  const data = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(data)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function bufferRequest(token: string, query: string, variables?: Record<string,unknown>) {
  const response = await fetch('https://api.buffer.com', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(variables ? { query, variables } : { query }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`BUFFER_HTTP_${response.status}`);
  return body;
}
async function getPost(token: string, id: string) {
  if (!clean(id)) return null;
  const body = await bufferRequest(token, `query { post(input:{id:"${esc(id)}"}) { id text status dueAt channelId } }`);
  if (body?.errors?.length) {
    const message = clean(body.errors[0]?.message).toLowerCase();
    if (message.includes('not found') || message.includes('could not find') || message.includes('unknown post')) return null;
    throw new Error(`BUFFER_GQL:${clean(body.errors[0]?.message)}`);
  }
  return body?.data?.post || null;
}
async function createPost(token: string, input: Record<string,unknown>) {
  const body = await bufferRequest(token,
    'mutation($input:CreatePostInput!){createPost(input:$input){__typename ... on PostActionSuccess{post{id text status dueAt channelId}} ... on MutationError{message}}}',
    { input });
  if (body?.errors?.length) throw new Error(`BUFFER_GQL:${clean(body.errors[0]?.message)}`);
  const action = body?.data?.createPost || {};
  return { post: action.post || null, error: action.message || null };
}
async function deletePost(token: string, id: string) {
  const body = await bufferRequest(token, `mutation { deletePost(input:{id:"${esc(id)}"}) { __typename ... on DeletePostSuccess { id } ... on VoidMutationError { message } } }`);
  const result = body?.data?.deletePost || {};
  return { ok: result.__typename === 'DeletePostSuccess' && result.id === id, id: result.id || null, error: result.message || body?.errors?.[0]?.message || null };
}
async function review(url: string, payload: any) {
  const response = await fetch(`${url}/functions/v1/bg-pre-publish-review`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  const body = await response.json().catch(() => ({}));
  return { http: response.status, ...body };
}
async function recordObligation(db: any, runDate: string, channel: string, status: string, externalId: string | null, evidence: any, nextAction: string | null, error: string | null = null) {
  const mapped = obligationChannels[channel];
  if (!mapped) return;
  const { error: rpcError } = await db.rpc('record_content_publication_state', {
    p_tenant_id: 'canonical', p_publication_date: runDate, p_channel: mapped, p_status: status,
    p_content_id: null, p_slug: null, p_external_id: externalId, p_canonical_url: null,
    p_evidence: evidence || {}, p_metrics: {}, p_next_action: nextAction, p_error: error,
  });
  if (rpcError) throw new Error(`OBLIGATION_WRITE:${rpcError.message}`);
}
async function reconcileExistingProviderTruth(db: any, token: string, runDate: string) {
  const [{ data: rows, error }, { data: obligations, error: obligationError }] = await Promise.all([
    db.from('powerhouse_channel_decisions')
      .select('channel,decision,state,delivery_ref,delivery_evidence')
      .eq('run_date', runDate)
      .in('channel', ['linkedin_personal','linkedin_company','instagram_company']),
    db.from('content_publication_obligations')
      .select('channel,external_id,evidence,status')
      .eq('tenant_id', 'canonical')
      .eq('publication_date', runDate)
      .in('channel', ['linkedin_personal','linkedin_company','instagram']),
  ]);
  if (error) throw new Error(`DECISION_RECONCILE_READ:${error.message}`);
  if (obligationError) throw new Error(`OBLIGATION_RECONCILE_READ:${obligationError.message}`);
  const obligationByChannel = new Map((obligations || []).map((item: any) => [item.channel, item]));
  const results: any[] = [];
  for (const row of rows || []) {
    const ref = clean(row.delivery_ref) || clean(obligationByChannel.get(obligationChannels[row.channel])?.external_id);
    if (!ref) continue;
    const lineageRecovered = !clean(row.delivery_ref) && !!ref;
    const provider = await getPost(token, ref);
    if (!provider) {
      const evidence = {
        ...(row.delivery_evidence || {}), provider: 'buffer', provider_truth_verified: false,
        provider_truth_checked_at: new Date().toISOString(), error: 'PROVIDER_RECORD_MISSING',
        stale_delivery_ref: true, stale_delivery_ref_value: ref, lineage_recovered_from_obligation: lineageRecovered,
        recovery_policy: row.channel === 'linkedin_personal' ? 'FAIL_CLOSED_NO_REPLACEMENT_WITHOUT_PERSONAL_TRUTH' : 'REENTER_CANONICAL_LOOP_IDEMPOTENTLY',
      };
      await db.from('powerhouse_channel_decisions').update({ state: 'blocked', delivery_ref: ref, delivery_evidence: evidence, updated_at: new Date().toISOString() }).eq('run_date', runDate).eq('channel', row.channel);
      await recordObligation(db, runDate, row.channel, 'BLOCKED', ref, evidence, 'Provider record ontbreekt. Re-enter de canonieke loop na truth/idempotency preflight; nooit blind dupliceren.', 'PROVIDER_RECORD_MISSING');
      results.push({ channel: row.channel, post_id: ref, state: 'blocked', reason: 'PROVIDER_RECORD_MISSING', lineage_recovered_from_obligation: lineageRecovered });
      continue;
    }
    const status = clean(provider.status).toLowerCase();
    const providerTruth = provider.id === ref && provider.channelId === channelIds[row.channel];
    const evidence = {
      ...(row.delivery_evidence || {}), provider: 'buffer', provider_truth_verified: providerTruth,
      provider_truth_checked_at: new Date().toISOString(), provider_status: status,
      provider_post_id: provider.id, provider_due_at: provider.dueAt || null, stale_delivery_ref: false,
      lineage_recovered_from_obligation: lineageRecovered,
    };
    const nextState = status === 'sent' ? 'published' : ['scheduled','sending'].includes(status) ? 'scheduled' : row.state;
    await db.from('powerhouse_channel_decisions').update({ state: nextState, delivery_ref: ref, delivery_evidence: evidence, updated_at: new Date().toISOString() }).eq('run_date', runDate).eq('channel', row.channel);
    await recordObligation(db, runDate, row.channel, status === 'sent' ? 'PUBLISHED' : 'DISPATCHED', ref, evidence, status === 'sent' ? 'Collect metrics and promote to LIVE_PROVEN only with public/provider outcome proof.' : 'Await provider send and reconcile again.', null);
    results.push({ channel: row.channel, post_id: ref, state: nextState, provider_status: status, provider_truth_verified: providerTruth, lineage_recovered_from_obligation: lineageRecovered });
  }
  return results;
}
function instagramInput(art: any, due: Date, future: boolean) {
  const proof = art?.generation_evidence?.instagram_media_proof || {};
  const mediaType = clean(proof.media_type || proof.buffer_media_type).toLowerCase();
  const mediaUrl = clean(proof.media_url);
  if (!(proof.exact_final_media_proven === true && clean(proof.final_media_sha256) && mediaUrl)) throw new Error('EXACT_FINAL_MEDIA_PROOF_REQUIRED');
  const assetKind = ['reel','video'].includes(mediaType) ? 'video' : 'image';
  return {
    text: clean(art.body), channelId: INSTAGRAM, schedulingType: 'automatic', mode: future ? 'customScheduled' : 'shareNow',
    ...(future ? { dueAt: due.toISOString() } : {}), metadata: { instagram: { type: mediaType || 'post', shouldShareToFeed: true } },
    assets: [{ [assetKind]: { url: mediaUrl } }],
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'POST_ONLY' }, 405);
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !key) return json({ ok: false, error: 'CONFIG' }, 500);
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const tokenExpected = clean((await db.rpc('bg_geheim', { p_naam: 'powerhouse_daily_scheduler_token' })).data);
  if (!tokenExpected || req.headers.get('x-powerhouse-token') !== tokenExpected) return json({ ok: false, error: 'UNAUTHORIZED' }, 401);
  let body: any = {};
  try { body = await req.json(); } catch { /* default */ }
  const runDate = clean(body.runDate) || today();
  const mode = clean(body.mode) || 'run';
  const { data: integration, error: integrationError } = await db.from('bg_integrations').select('token').eq('integration', 'buffer').eq('status', 'actief').single();
  if (integrationError || !integration?.token) return json({ ok: false, error: 'BUFFER_TOKEN_MISSING' }, 503);
  const bufferToken = integration.token;

  const provider_reconciliation = await reconcileExistingProviderTruth(db, bufferToken, runDate);
  if (mode === 'audit_only') return json({ ok: true, runDate, provider_reconciliation });

  const { data: rows, error: rowsError } = await db.from('powerhouse_channel_decisions')
    .select('channel,scheduled_for,delivery_evidence,powerhouse_content_artifacts(body,generation_evidence,status)')
    .eq('run_date', runDate).eq('decision', 'publish').eq('state', 'content_ready')
    .in('channel', ['linkedin_personal','linkedin_company','instagram_company']).order('priority', { ascending: false });
  if (rowsError) throw new Error(`CONTENT_READY_READ:${rowsError.message}`);
  const results: any[] = [];

  for (const row of rows || []) {
    const art = Array.isArray(row.powerhouse_content_artifacts) ? row.powerhouse_content_artifacts[0] : row.powerhouse_content_artifacts;
    if (!art?.body) continue;
    const textHash = await digest(clean(art.body));
    const due = new Date(row.scheduled_for);
    const future = Number.isFinite(due.getTime()) && due.getTime() > Date.now() + 120000;
    let reviewPayload: any = { channel: channelIds[row.channel], post_text: art.body, hook_type: clean(art.generation_evidence?.hook_type) || 'Probleem' };

    if (row.channel === 'linkedin_personal') {
      const evidence = row.delivery_evidence?.identity_gate_evidence || art.generation_evidence?.identity_gate_evidence || {};
      if (evidence.personal_truth_verified !== true) {
        const blocked = { ...(row.delivery_evidence || {}), error: 'PERSONAL_TRUTH_UNVERIFIED', provider_truth_verified: false, personal_truth_verified: false };
        await db.from('powerhouse_channel_decisions').update({ state: 'blocked', delivery_evidence: blocked, updated_at: new Date().toISOString() }).eq('run_date', runDate).eq('channel', row.channel);
        await recordObligation(db, runDate, row.channel, 'BLOCKED', null, blocked, 'Provide an explicitly verified personal truth source; no replacement post is allowed.', 'PERSONAL_TRUTH_UNVERIFIED');
        results.push({ channel: row.channel, status: 'blocked', reason: 'PERSONAL_TRUTH_UNVERIFIED' });
        continue;
      }
      reviewPayload = { ...evidence, personal_truth_verified: true, channel_id: PERSONAL, channel_kind: 'linkedin_personal', identity_contract: CONTRACT, identity_gate_version: GATE, post_text: art.body, final_text_hash: clean(evidence.final_text_hash) };
    } else if (row.channel === 'instagram_company') {
      const proof = row.delivery_evidence?.instagram_media_proof || art.generation_evidence?.instagram_media_proof || {};
      reviewPayload = {
        ...proof, channel_id: INSTAGRAM, channel_kind: 'instagram_company', post_text: art.body,
        mira_gate_passed: proof.mira_gate_passed === true, exact_final_media_proven: proof.exact_final_media_proven === true,
        final_media_sha256: clean(proof.final_media_sha256), media_type: proof.media_type, media_source: proof.media_provider || proof.media_source,
      };
    }

    const gate = await review(url, reviewPayload);
    if (gate.http !== 200 || gate.can_publish !== true || gate.identity_gate_decision !== 'PASS' || gate.final_text_hash !== textHash) {
      const evidence = { ...(row.delivery_evidence || {}), pre_publish_gate: 'blocked', identity_gate_version: GATE, reviewed_text_hash: textHash, violations: gate.violations || [], review_status: gate.http, provider_truth_verified: false };
      await db.from('powerhouse_channel_decisions').update({ state: 'blocked', delivery_evidence: evidence, updated_at: new Date().toISOString() }).eq('run_date', runDate).eq('channel', row.channel);
      await recordObligation(db, runDate, row.channel, 'BLOCKED', null, evidence, 'Repair canonical gate evidence before any dispatch.', 'PRE_PUBLISH_GATE_BLOCKED');
      results.push({ channel: row.channel, status: 'blocked', violations: gate.violations || [] });
      continue;
    }

    let input: Record<string,unknown>;
    if (row.channel === 'instagram_company') input = instagramInput(art, due, future);
    else input = { text: clean(art.body), channelId: channelIds[row.channel], schedulingType: 'automatic', mode: future ? 'customScheduled' : 'shareNow', ...(future ? { dueAt: due.toISOString() } : {}) };

    const created = await createPost(bufferToken, input);
    if (!created.post?.id) {
      const evidence = { ...(row.delivery_evidence || {}), provider: 'buffer', error: created.error || 'BUFFER_CREATE_FAILED', provider_truth_verified: false };
      await db.from('powerhouse_channel_decisions').update({ state: 'failed', delivery_evidence: evidence, updated_at: new Date().toISOString() }).eq('run_date', runDate).eq('channel', row.channel);
      await recordObligation(db, runDate, row.channel, 'FAILED', null, evidence, 'Retry only through canonical loop after provider preflight.', created.error || 'BUFFER_CREATE_FAILED');
      results.push({ channel: row.channel, status: 'failed', error: created.error || 'BUFFER_CREATE_FAILED' });
      continue;
    }

    const readback = await getPost(bufferToken, created.post.id);
    const readbackOk = !!readback && readback.id === created.post.id && readback.channelId === channelIds[row.channel] && clean(readback.text) === clean(art.body) && (!future || new Date(readback.dueAt).getTime() === due.getTime());
    if (!readbackOk) {
      const containment = await deletePost(bufferToken, created.post.id);
      const evidence = { ...(row.delivery_evidence || {}), provider: 'buffer', error: 'PROVIDER_READBACK_MISMATCH', provider_truth_verified: false, stale_delivery_ref: false, provider_readback: readback, containment };
      await db.from('powerhouse_channel_decisions').update({ state: 'blocked', delivery_ref: created.post.id, delivery_evidence: evidence, updated_at: new Date().toISOString() }).eq('run_date', runDate).eq('channel', row.channel);
      await recordObligation(db, runDate, row.channel, 'BLOCKED', created.post.id, evidence, 'Provider readback mismatch contained; inspect before retry.', 'PROVIDER_READBACK_MISMATCH');
      results.push({ channel: row.channel, status: 'blocked_readback_mismatch', post_id: created.post.id, containment });
      continue;
    }

    const providerStatus = clean(readback.status).toLowerCase();
    const evidence = {
      ...(row.delivery_evidence || {}), provider: 'buffer', provider_post_id: readback.id, provider_status: providerStatus,
      provider_due_at: readback.dueAt || null, provider_truth_verified: true, provider_truth_checked_at: new Date().toISOString(),
      stale_delivery_ref: false, pre_publish_gate: 'passed', final_text_hash: textHash,
      personal_truth_verified: row.channel === 'linkedin_personal' ? true : null,
    };
    const decisionState = providerStatus === 'sent' ? 'published' : 'scheduled';
    await db.from('powerhouse_channel_decisions').update({ state: decisionState, delivery_ref: readback.id, delivery_evidence: evidence, updated_at: new Date().toISOString() }).eq('run_date', runDate).eq('channel', row.channel);
    await db.from('powerhouse_content_artifacts').update({ status: decisionState === 'published' ? 'published' : 'scheduled', updated_at: new Date().toISOString() }).eq('run_date', runDate).eq('channel', row.channel);
    await recordObligation(db, runDate, row.channel, providerStatus === 'sent' ? 'PUBLISHED' : 'DISPATCHED', readback.id, evidence, providerStatus === 'sent' ? 'Verify public/outcome proof, then measure and learn.' : 'Await provider send, then reconcile.', null);
    results.push({ channel: row.channel, status: providerStatus, post_id: readback.id, provider_truth_verified: true });
  }

  return json({ ok: true, runDate, provider_reconciliation, results, provider_truth_verified: true });
});
