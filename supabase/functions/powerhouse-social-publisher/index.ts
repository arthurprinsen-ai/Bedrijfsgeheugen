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

async function digest(value: string) { const data = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return [...new Uint8Array(data)].map((b) => b.toString(16).padStart(2, '0')).join(''); }
class BufferHttpError extends Error {
  status: number;
  retryAfter: string | null;
  constructor(status: number, retryAfter: string | null) {
    super(`BUFFER_HTTP_${status}`);
    this.name = 'BufferHttpError';
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

const COMPOSIO_BASE='https://backend.composio.dev/api/v3.1';
async function secret(db:any,name:string){const env=Deno.env.get(name);if(env)return clean(env);const {data}=await db.rpc('bg_geheim',{p_naam:name});return clean(data)||null;}
async function composioExecute(apiKey:string,connectedAccountId:string,toolSlug:string,text:string){
  const response=await fetch(`${COMPOSIO_BASE}/tools/execute/${toolSlug}`,{
    method:'POST',
    headers:{'content-type':'application/json','x-api-key':apiKey},
    body:JSON.stringify({connected_account_id:connectedAccountId,version:'latest',text})
  });
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok||body?.successful!==true){
    throw new Error(`COMPOSIO_${toolSlug}_${response.status}:${clean(body?.error||body?.message||JSON.stringify(body)).slice(0,240)}`);
  }
  return body;
}
function deepPickId(value:any,preferred:string[]=[]):string{
  if(!value||typeof value!=='object')return'';
  for(const key of preferred){const v=value?.[key];if(typeof v==='string'&&v.trim())return v.trim();}
  for(const [k,v] of Object.entries(value)){
    if(/(^|_)(id|media_id|creation_id|container_id|ig_media_id)$/i.test(k)&&typeof v==='string'&&v.trim())return v.trim();
  }
  for(const v of Object.values(value)){const found=deepPickId(v,preferred);if(found)return found;}
  return'';
}
function deepPickString(value:any,keys:string[]):string{
  if(!value||typeof value!=='object')return'';
  for(const key of keys){const v=value?.[key];if(typeof v==='string'&&v.trim())return v.trim();}
  for(const v of Object.values(value)){const found=deepPickString(v,keys);if(found)return found;}
  return'';
}
async function publishInstagramViaComposio(db:any,art:any,runDate:string){
  const proof=art?.generation_evidence?.instagram_media_proof||{};
  if(!instagramIdentityProven(proof))throw new Error('MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED');
  const mediaType=clean(proof.media_type).toLowerCase();
  if(!['reel','video'].includes(mediaType))throw new Error('COMPOSIO_ROUTE_REEL_ONLY_V1');
  const mediaUrl=clean(proof.media_url);if(!mediaUrl)throw new Error('FINAL_MEDIA_URL_REQUIRED');
  const apiKey=await secret(db,'COMPOSIO_API_KEY');
  const accountId=await secret(db,'COMPOSIO_INSTAGRAM_CONNECTED_ACCOUNT_ID');
  if(!apiKey||!accountId)throw new Error('COMPOSIO_INSTAGRAM_AUTH_REQUIRED');
  const caption=clean(art.body);
  const created=await composioExecute(apiKey,accountId,'INSTAGRAM_POST_IG_USER_MEDIA',
    `Create an Instagram Reel media container using this exact public video URL: ${mediaUrl}. Use this exact caption, preserving wording and line breaks: ${caption}`);
  const containerId=deepPickId(created?.data||created,['creation_id','container_id','id']);
  if(!containerId)throw new Error('COMPOSIO_MEDIA_CONTAINER_ID_MISSING');
  const published=await composioExecute(apiKey,accountId,'INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH',
    `Publish the Instagram media container with creation/container id ${containerId} now.`);
  const mediaId=deepPickId(published?.data||published,['ig_media_id','media_id','id']);
  if(!mediaId)throw new Error('COMPOSIO_PUBLISHED_MEDIA_ID_MISSING');
  const readback=await composioExecute(apiKey,accountId,'INSTAGRAM_GET_IG_MEDIA',
    `Get Instagram media with id ${mediaId} and return its id, permalink, media type, caption, timestamp and media URL.`);
  const rb=readback?.data||readback;
  const readbackId=deepPickId(rb,['ig_media_id','media_id','id']);
  if(readbackId!==mediaId)throw new Error('COMPOSIO_INSTAGRAM_READBACK_ID_MISMATCH');
  const permalink=deepPickString(rb,['permalink','permalink_url','url']);
  return {provider:'composio',provider_post_id:mediaId,container_id:containerId,permalink:permalink||null,provider_truth_verified:true,provider_truth_checked_at:new Date().toISOString(),media_url:mediaUrl,final_media_sha256:clean(proof.final_media_sha256)};
}

async function bufferRequest(token: string, query: string, variables?: Record<string,unknown>) {
  const response = await fetch('https://api.buffer.com', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(variables ? { query, variables } : { query }) });
  const body = await response.json().catch(() => ({}));
  const retryAfter = clean(response.headers.get('retry-after')) || clean(response.headers.get('ratelimit-reset')) || clean(response.headers.get('x-ratelimit-reset')) || null;
  if (!response.ok) throw new BufferHttpError(response.status, retryAfter);
  return body;
}
async function getPost(token: string, id: string) { if (!clean(id)) return null; const body = await bufferRequest(token, `query { post(input:{id:"${esc(id)}"}) { id text status dueAt channelId } }`); if (body?.errors?.length) { const message = clean(body.errors[0]?.message).toLowerCase(); if (message.includes('not found') || message.includes('could not find') || message.includes('unknown post')) return null; throw new Error(`BUFFER_GQL:${clean(body.errors[0]?.message)}`); } return body?.data?.post || null; }
async function createPost(token: string, input: Record<string,unknown>) { const body = await bufferRequest(token, 'mutation($input:CreatePostInput!){createPost(input:$input){__typename ... on PostActionSuccess{post{id text status dueAt channelId}} ... on MutationError{message}}}', { input }); if (body?.errors?.length) throw new Error(`BUFFER_GQL:${clean(body.errors[0]?.message)}`); const action = body?.data?.createPost || {}; return { post: action.post || null, error: action.message || null }; }
async function deletePost(token: string, id: string) { const body = await bufferRequest(token, `mutation { deletePost(input:{id:"${esc(id)}"}) { __typename ... on DeletePostSuccess { id } ... on VoidMutationError { message } } }`); const result = body?.data?.deletePost || {}; return { ok: result.__typename === 'DeletePostSuccess' && result.id === id, id: result.id || null, error: result.message || body?.errors?.[0]?.message || null }; }
async function review(url: string, payload: any) { const response = await fetch(`${url}/functions/v1/bg-pre-publish-review`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }); const body = await response.json().catch(() => ({})); return { http: response.status, ...body }; }
async function recordObligation(db: any, runDate: string, channel: string, status: string, externalId: string | null, evidence: any, nextAction: string | null, error: string | null = null) { const mapped = obligationChannels[channel]; if (!mapped) return; const { error: rpcError } = await db.rpc('record_content_publication_state', { p_tenant_id: 'canonical', p_publication_date: runDate, p_channel: mapped, p_status: status, p_content_id: null, p_slug: null, p_external_id: externalId, p_canonical_url: null, p_evidence: evidence || {}, p_metrics: {}, p_next_action: nextAction, p_error: error }); if (rpcError) throw new Error(`OBLIGATION_WRITE:${rpcError.message}`); }

function instagramIdentityProven(evidence: any) {
  const proof = evidence?.instagram_media_proof || evidence || {};
  const mediaType = clean(proof?.media_type || evidence?.media_type).toLowerCase();
  if (mediaType === 'carousel') {
    const slides = Array.isArray(proof?.carousel_manifest?.slides) ? proof.carousel_manifest.slides : [];
    return proof?.exact_final_media_proven === true && !!clean(proof?.final_media_sha256)
      && clean(proof?.mira_gate_result) === 'PASS' && slides.length >= 2
      && slides.every((slide:any) => {
        const p=slide?.proof||{},v=p?.visual||slide?.visual||{},refs=Array.isArray(v?.evidence_refs)?v.evidence_refs.map(clean):[];
        const provider=clean(slide?.provider).toLowerCase(),kind=clean(slide?.kind||'image').toLowerCase();
        const providerOk=kind==='video'?provider==='openart':['openart','placid'].includes(provider);
        return providerOk && !!clean(slide?.asset_url) && !!clean(slide?.sha256) && p?.identity_gate_result==='PASS'
          && v?.verified===true && v?.semantic_verified===true && v?.mira_present===true
          && clean(v?.identity_class)==='mira_daily_life' && clean(v?.evidence_method).toLowerCase()==='vision'
          && refs.some((ref:string)=>/^vision:/i.test(ref));
      });
  }
  const visual = proof?.instagram_visual || {};
  const width=Number(visual?.width),height=Number(visual?.height);
  const refs=Array.isArray(visual?.evidence_refs)?visual.evidence_refs.map(clean):[];
  const visible=visual?.verified===true&&visual?.semantic_verified===true&&visual?.mira_present===true
    &&clean(visual?.identity_class)==='mira_daily_life'&&clean(visual?.evidence_method).toLowerCase()==='vision'
    &&refs.some((ref:string)=>/^vision:/i.test(ref));
  const dims=['reel','video'].includes(mediaType)?width===1080&&height===1920:width===1080&&height===1350;
  const provider=clean(proof?.media_provider||proof?.media_source).toLowerCase();
  const providerOk=['reel','video'].includes(mediaType)?provider==='openart':['openart','placid'].includes(provider);
  return proof?.exact_final_media_proven===true&&!!clean(proof?.final_media_sha256)
    &&clean(proof?.mira_gate_result)==='PASS'&&visible&&dims&&providerOk;
}

async function reconcileExistingProviderTruth(db: any, token: string, runDate: string) {
  const [{ data: rows, error }, { data: obligations, error: obligationError }] = await Promise.all([
    db.from('powerhouse_channel_decisions').select('channel,decision,state,delivery_ref,delivery_evidence').eq('run_date', runDate).in('channel', ['linkedin_personal','linkedin_company','instagram_company']),
    db.from('content_publication_obligations').select('channel,external_id,evidence,status').eq('tenant_id', 'canonical').eq('publication_date', runDate).in('channel', ['linkedin_personal','linkedin_company','instagram']),
  ]);
  if (error) throw new Error(`DECISION_RECONCILE_READ:${error.message}`);
  if (obligationError) throw new Error(`OBLIGATION_RECONCILE_READ:${obligationError.message}`);
  const obligationByChannel = new Map((obligations || []).map((item: any) => [item.channel, item]));
  const results: any[] = [];
  for (const row of rows || []) {
    const obligation: any = obligationByChannel.get(obligationChannels[row.channel]) || null;
    const ref = clean(row.delivery_ref) || clean(obligation?.external_id);
    if (!ref) continue;
    const lineageRecovered = !clean(row.delivery_ref) && !!ref;
    const provider = await getPost(token, ref);
    if (!provider) {
      const evidence = { ...(obligation?.evidence || {}), ...(row.delivery_evidence || {}), provider: 'buffer', provider_truth_verified: false, provider_truth_checked_at: new Date().toISOString(), error: 'PROVIDER_RECORD_MISSING', stale_delivery_ref: true, stale_delivery_ref_value: ref, lineage_recovered_from_obligation: lineageRecovered, recovery_policy: row.channel === 'linkedin_personal' ? 'FAIL_CLOSED_NO_REPLACEMENT_WITHOUT_PERSONAL_TRUTH' : 'REENTER_CANONICAL_LOOP_IDEMPOTENTLY' };
      await db.from('powerhouse_channel_decisions').update({ state: 'blocked', delivery_ref: ref, delivery_evidence: evidence, updated_at: new Date().toISOString() }).eq('run_date', runDate).eq('channel', row.channel);
      await recordObligation(db, runDate, row.channel, 'BLOCKED', ref, evidence, 'Provider record ontbreekt. Re-enter de canonieke loop na truth/idempotency preflight; nooit blind dupliceren.', 'PROVIDER_RECORD_MISSING');
      results.push({ channel: row.channel, post_id: ref, state: 'blocked', reason: 'PROVIDER_RECORD_MISSING', lineage_recovered_from_obligation: lineageRecovered });
      continue;
    }
    const status = clean(provider.status).toLowerCase();
    const providerTruth = provider.id === ref && provider.channelId === channelIds[row.channel];
    const evidence = { ...(obligation?.evidence || {}), ...(row.delivery_evidence || {}), provider: 'buffer', provider_truth_verified: providerTruth, provider_truth_checked_at: new Date().toISOString(), provider_status: status, provider_post_id: provider.id, provider_due_at: provider.dueAt || null, stale_delivery_ref: false, lineage_recovered_from_obligation: lineageRecovered };

    if (row.channel === 'instagram_company' && !instagramIdentityProven(evidence)) {
      const blockedEvidence = { ...evidence, error: 'EXACT_FINAL_MEDIA_PROOF_REQUIRED', transport_verified_identity_unproven: true, republish_forbidden: true };
      await db.from('powerhouse_channel_decisions').update({ state: 'blocked', delivery_ref: ref, delivery_evidence: blockedEvidence, updated_at: new Date().toISOString() }).eq('run_date', runDate).eq('channel', row.channel);
      await recordObligation(db, runDate, row.channel, 'BLOCKED', ref, blockedEvidence, 'Bewijs immutable exact-final-media digest/frames + Mira PASS; transport sent alleen is onvoldoende.', 'EXACT_FINAL_MEDIA_PROOF_REQUIRED');
      results.push({ channel: row.channel, post_id: ref, state: 'blocked', provider_status: status, provider_truth_verified: providerTruth, reason: 'EXACT_FINAL_MEDIA_PROOF_REQUIRED', transport_verified_identity_unproven: true });
      continue;
    }

    const nextState = status === 'sent' ? 'published' : ['scheduled','sending'].includes(status) ? 'scheduled' : row.state;
    await db.from('powerhouse_channel_decisions').update({ state: nextState, delivery_ref: ref, delivery_evidence: evidence, updated_at: new Date().toISOString() }).eq('run_date', runDate).eq('channel', row.channel);
    await recordObligation(db, runDate, row.channel, status === 'sent' ? 'PUBLISHED' : 'DISPATCHED', ref, evidence, status === 'sent' ? 'Collect metrics and promote to LIVE_PROVEN only with public/provider outcome proof.' : 'Await provider send and reconcile again.', null);
    results.push({ channel: row.channel, post_id: ref, state: nextState, provider_status: status, provider_truth_verified: providerTruth, lineage_recovered_from_obligation: lineageRecovered });
  }
  return results;
}
function instagramInput(art:any,due:Date,future:boolean){
  const proof=art?.generation_evidence?.instagram_media_proof||{};
  const mediaType=clean(proof.media_type||proof.buffer_media_type).toLowerCase();
  if(!instagramIdentityProven(proof)) throw new Error('MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED');
  if(mediaType==='carousel'){
    const slides=proof.carousel_manifest.slides;
    const assets=slides.map((slide:any)=>slide.kind==='video'?{video:{url:slide.asset_url}}:{image:{url:slide.asset_url}});
    return {text:clean(art.body),channelId:INSTAGRAM,schedulingType:'automatic',mode:future?'customScheduled':'shareNow',...(future?{dueAt:due.toISOString()}:{}),
      metadata:{instagram:{type:'carousel',shouldShareToFeed:true}},assets};
  }
  const mediaUrl=clean(proof.media_url);if(!mediaUrl)throw new Error('FINAL_MEDIA_URL_REQUIRED');
  const assetKind=['reel','video'].includes(mediaType)?'video':'image';
  const postType=['reel','video'].includes(mediaType)?'reel':'post';
  return {text:clean(art.body),channelId:INSTAGRAM,schedulingType:'automatic',mode:future?'customScheduled':'shareNow',...(future?{dueAt:due.toISOString()}:{}),
    metadata:{instagram:{type:postType,shouldShareToFeed:true}},assets:[{[assetKind]:{url:mediaUrl}}]};
}

Deno.serve(async (req) => {
  try {
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

  const channels = ['linkedin_personal','linkedin_company','instagram_company'];
  const [{ data: rows, error: rowsError }, { data: artifacts, error: artifactsError }] = await Promise.all([
    db.from('powerhouse_channel_decisions')
      .select('channel,scheduled_for,delivery_evidence,priority')
      .eq('run_date', runDate)
      .eq('decision', 'publish')
      .eq('state', 'content_ready')
      .in('channel', channels)
      .order('priority', { ascending: false }),
    db.from('powerhouse_content_artifacts')
      .select('channel,body,generation_evidence,status')
      .eq('run_date', runDate)
      .in('channel', channels),
  ]);
  if (rowsError) throw new Error(`CONTENT_READY_DECISION_READ:${rowsError.message}`);
  if (artifactsError) throw new Error(`CONTENT_READY_ARTIFACT_READ:${artifactsError.message}`);
  const artifactByChannel = new Map((artifacts || []).map((artifact: any) => [artifact.channel, artifact]));
  const results: any[] = [];

  for (const row of rows || []) {
    const art: any = artifactByChannel.get(row.channel) || null;
    if (!art?.body) {
      results.push({ channel: row.channel, status: 'skipped', reason: 'CONTENT_ARTIFACT_MISSING' });
      continue;
    }
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
        results.push({ channel: row.channel, status: 'blocked', reason: 'PERSONAL_TRUTH_UNVERIFIED' }); continue;
      }
      reviewPayload = { ...evidence, personal_truth_verified: true, channel_id: PERSONAL, channel_kind: 'linkedin_personal', identity_contract: CONTRACT, identity_gate_version: GATE, post_text: art.body, final_text_hash: clean(evidence.final_text_hash) };
    } else if (row.channel === 'instagram_company') {
      const proof = row.delivery_evidence?.instagram_media_proof || art.generation_evidence?.instagram_media_proof || {};
      reviewPayload = { ...proof, channel_id: INSTAGRAM, channel_kind: 'instagram_company', post_text: art.body, hook_type: clean(art.generation_evidence?.hook_type) || 'Probleem', mira_gate_passed: proof.mira_gate_passed === true, exact_final_media_proven: proof.exact_final_media_proven === true, final_media_sha256: clean(proof.final_media_sha256), final_asset_url: clean(proof.media_url), media_type: proof.media_type, media_source: proof.media_provider || proof.media_source };
    }
    const gate = await review(url, reviewPayload);
    if (gate.http !== 200 || gate.can_publish !== true || gate.identity_gate_decision !== 'PASS' || gate.final_text_hash !== textHash) {
      const evidence = { ...(row.delivery_evidence || {}), pre_publish_gate: 'blocked', identity_gate_version: GATE, reviewed_text_hash: textHash, violations: gate.violations || [], review_status: gate.http, provider_truth_verified: false };
      await db.from('powerhouse_channel_decisions').update({ state: 'blocked', delivery_evidence: evidence, updated_at: new Date().toISOString() }).eq('run_date', runDate).eq('channel', row.channel);
      await recordObligation(db, runDate, row.channel, 'BLOCKED', null, evidence, 'Repair canonical gate evidence before any dispatch.', 'PRE_PUBLISH_GATE_BLOCKED');
      results.push({ channel: row.channel, status: 'blocked', violations: gate.violations || [] }); continue;
    }
    if (row.channel === 'instagram_company') {
      try {
        const direct = await publishInstagramViaComposio(db, art, runDate);
        const evidence = { ...(row.delivery_evidence || {}), ...direct, pre_publish_gate:'passed', final_text_hash:textHash, transport_contract:'instagram-composio-primary-v1', make_dependency:false };
        await db.from('powerhouse_channel_decisions').update({ state:'published', delivery_ref:direct.provider_post_id, delivery_evidence:evidence, updated_at:new Date().toISOString() }).eq('run_date',runDate).eq('channel',row.channel);
        await db.from('powerhouse_content_artifacts').update({ status:'published', updated_at:new Date().toISOString() }).eq('run_date',runDate).eq('channel',row.channel);
        await recordObligation(db,runDate,row.channel,'PUBLISHED',direct.provider_post_id,evidence,'Collect Instagram outcome metrics and feed learning loop.',null);
        results.push({channel:row.channel,status:'published',post_id:direct.provider_post_id,permalink:direct.permalink,provider:'composio',provider_truth_verified:true});
        continue;
      } catch(error){
        const message=error instanceof Error?error.message:String(error);
        const evidence={...(row.delivery_evidence||{}),provider:'composio',provider_truth_verified:false,error:message,transport_contract:'instagram-composio-primary-v1',make_dependency:false};
        const authMissing=message==='COMPOSIO_INSTAGRAM_AUTH_REQUIRED';
        await db.from('powerhouse_channel_decisions').update({state:authMissing?'blocked':'failed',delivery_evidence:evidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel);
        await recordObligation(db,runDate,row.channel,authMissing?'BLOCKED':'FAILED',null,evidence,authMissing?'Connect Composio Instagram credentials; reuse the same proven media without regeneration.':'Retry only after Composio transport diagnosis; never fall back to Make.',message);
        results.push({channel:row.channel,status:authMissing?'blocked':'failed',provider:'composio',error:message});
        continue;
      }
    }
    const input: Record<string,unknown> = { text: clean(art.body), channelId: channelIds[row.channel], schedulingType: 'automatic', mode: future ? 'customScheduled' : 'shareNow', ...(future ? { dueAt: due.toISOString() } : {}) };
    const created = await createPost(bufferToken, input);
    if (!created.post?.id) {
      const evidence = { ...(row.delivery_evidence || {}), provider: 'buffer', error: created.error || 'BUFFER_CREATE_FAILED', provider_truth_verified: false };
      await db.from('powerhouse_channel_decisions').update({ state: 'failed', delivery_evidence: evidence, updated_at: new Date().toISOString() }).eq('run_date', runDate).eq('channel', row.channel);
      await recordObligation(db, runDate, row.channel, 'FAILED', null, evidence, 'Retry only through canonical loop after provider preflight.', created.error || 'BUFFER_CREATE_FAILED'); results.push({ channel: row.channel, status: 'failed', error: created.error || 'BUFFER_CREATE_FAILED' }); continue;
    }
    const readback = await getPost(bufferToken, created.post.id);
    const readbackOk = !!readback && readback.id === created.post.id && readback.channelId === channelIds[row.channel] && clean(readback.text) === clean(art.body) && (!future || new Date(readback.dueAt).getTime() === due.getTime());
    if (!readbackOk) {
      const containment = await deletePost(bufferToken, created.post.id);
      const evidence = { ...(row.delivery_evidence || {}), provider: 'buffer', error: 'PROVIDER_READBACK_MISMATCH', provider_truth_verified: false, stale_delivery_ref: false, provider_readback: readback, containment };
      await db.from('powerhouse_channel_decisions').update({ state: 'blocked', delivery_ref: created.post.id, delivery_evidence: evidence, updated_at: new Date().toISOString() }).eq('run_date', runDate).eq('channel', row.channel);
      await recordObligation(db, runDate, row.channel, 'BLOCKED', created.post.id, evidence, 'Provider readback mismatch contained; inspect before retry.', 'PROVIDER_READBACK_MISMATCH'); results.push({ channel: row.channel, status: 'blocked_readback_mismatch', post_id: created.post.id, containment }); continue;
    }
    const providerStatus = clean(readback.status).toLowerCase();
    const evidence = { ...(row.delivery_evidence || {}), provider: 'buffer', provider_post_id: readback.id, provider_status: providerStatus, provider_due_at: readback.dueAt || null, provider_truth_verified: true, provider_truth_checked_at: new Date().toISOString(), stale_delivery_ref: false, pre_publish_gate: 'passed', final_text_hash: textHash, personal_truth_verified: row.channel === 'linkedin_personal' ? true : null };
    const decisionState = providerStatus === 'sent' ? 'published' : 'scheduled';
    await db.from('powerhouse_channel_decisions').update({ state: decisionState, delivery_ref: readback.id, delivery_evidence: evidence, updated_at: new Date().toISOString() }).eq('run_date', runDate).eq('channel', row.channel);
    await db.from('powerhouse_content_artifacts').update({ status: decisionState === 'published' ? 'published' : 'scheduled', updated_at: new Date().toISOString() }).eq('run_date', runDate).eq('channel', row.channel);
    await recordObligation(db, runDate, row.channel, providerStatus === 'sent' ? 'PUBLISHED' : 'DISPATCHED', readback.id, evidence, providerStatus === 'sent' ? 'Verify public/outcome proof, then measure and learn.' : 'Await provider send, then reconcile.', null);
    results.push({ channel: row.channel, status: providerStatus, post_id: readback.id, provider_truth_verified: true });
  }
  return json({ ok: true, runDate, provider_reconciliation, results, provider_truth_verified: true });
  } catch (error) {
    if (error instanceof BufferHttpError && error.status === 429) {
      return json({ ok: false, error: 'BUFFER_RATE_LIMITED', retryable: true, retry_after: error.retryAfter }, 429);
    }
    throw error;
  }
});