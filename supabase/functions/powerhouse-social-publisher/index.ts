import { createClient } from 'npm:@supabase/supabase-js@2';

const ORG_ID = '6a7037d2d8fce064ac755ec7';
const PERSONAL = '6a70381699afb44349f0fb35';
const COMPANY = '6a70381699afb44349f0fb36';
const INSTAGRAM = '6a70384d99afb44349f0fba9';
const GATE = 'channel-identity-hard-gate-v3';
const CONTRACT = 'arthur-personal-linkedin-identity-v4';
const PUBLICATION_AUTHORITY = 'social-publication-authority-v1';
const INSTAGRAM_POLICY = 'instagram-mira-reel-only-v3';
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

const COMPOSIO_BASE='https://backend.composio.dev/api/v3';
async function secret(db:any,name:string){const env=Deno.env.get(name);if(env)return clean(env);const {data}=await db.rpc('bg_geheim',{p_naam:name});return clean(data)||null;}
async function composioExecute(apiKey:string,connectedAccountId:string,toolSlug:string,text:string){
  const response=await fetch(`${COMPOSIO_BASE}/tools/execute/${toolSlug}`,{
    method:'POST',
    headers:{'content-type':'application/json','x-api-key':apiKey},
    body:JSON.stringify({connected_account_id:connectedAccountId,text})
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

type MetaInstagramConfig={accessToken:string,userId:string,graphVersion:string};
class MetaInstagramHttpError extends Error{
  status:number;body:any;
  constructor(status:number,body:any){super(`META_INSTAGRAM_HTTP_${status}:${clean(body?.error?.message||body?.message||JSON.stringify(body)).slice(0,240)}`);this.name='MetaInstagramHttpError';this.status=status;this.body=body;}
}
async function metaInstagramConfig(db:any):Promise<MetaInstagramConfig|null>{
  const [accessToken,userId,graphVersionRaw]=await Promise.all([
    secret(db,'META_INSTAGRAM_ACCESS_TOKEN'),
    secret(db,'META_INSTAGRAM_USER_ID'),
    secret(db,'META_INSTAGRAM_GRAPH_VERSION')
  ]);
  if(!accessToken||!userId)return null;
  const graphVersion=clean(graphVersionRaw)||'v24.0';
  if(!/^v\d+\.\d+$/.test(graphVersion))throw new Error('META_INSTAGRAM_GRAPH_VERSION_INVALID');
  return {accessToken,userId,graphVersion};
}
async function metaInstagramRequest(config:MetaInstagramConfig,path:string,init:RequestInit={}){
  const sep=path.includes('?')?'&':'?';
  const url=`https://graph.instagram.com/${config.graphVersion}/${path}${sep}access_token=${encodeURIComponent(config.accessToken)}`;
  const response=await fetch(url,init);
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok||body?.error)throw new MetaInstagramHttpError(response.status,body);
  return body;
}
async function readInstagramViaMeta(db:any,mediaId:string){
  const config=await metaInstagramConfig(db);
  if(!config)throw new Error('META_INSTAGRAM_AUTH_REQUIRED');
  const body=await metaInstagramRequest(config,`${encodeURIComponent(mediaId)}?fields=id,media_type,media_url,permalink,caption,timestamp`);
  return {id:clean(body?.id),media_type:clean(body?.media_type),media_url:clean(body?.media_url),permalink:clean(body?.permalink),caption:clean(body?.caption),timestamp:clean(body?.timestamp)};
}
async function publishInstagramViaMeta(db:any,art:any){
  const proof=art?.generation_evidence?.instagram_media_proof||{};
  if(!instagramIdentityProven(proof))throw new Error('MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED');
  if(clean(proof.media_type).toLowerCase()!=='reel')throw new Error('INSTAGRAM_MIRA_REEL_ONLY_V3');
  const mediaUrl=clean(proof.media_url);if(!mediaUrl)throw new Error('FINAL_MEDIA_URL_REQUIRED');
  const config=await metaInstagramConfig(db);if(!config)throw new Error('META_INSTAGRAM_AUTH_REQUIRED');
  const params=new URLSearchParams({media_type:'REELS',video_url:mediaUrl,caption:clean(art.body),share_to_feed:'true'});
  const created=await metaInstagramRequest(config,`${encodeURIComponent(config.userId)}/media`,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:params.toString()});
  const containerId=clean(created?.id);if(!containerId)throw new Error('META_MEDIA_CONTAINER_ID_MISSING');

  let finished=false;let processing:any=null;
  for(let attempt=0;attempt<8;attempt++){
    processing=await metaInstagramRequest(config,`${encodeURIComponent(containerId)}?fields=status_code,status`);
    const code=clean(processing?.status_code).toUpperCase();
    if(code==='FINISHED'){finished=true;break;}
    if(['ERROR','EXPIRED'].includes(code))throw new Error(`META_MEDIA_PROCESSING_${code}`);
    await new Promise(resolve=>setTimeout(resolve,1500));
  }
  if(!finished)throw new Error('META_MEDIA_PROCESSING_PENDING');

  const published=await metaInstagramRequest(config,`${encodeURIComponent(config.userId)}/media_publish`,{
    method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({creation_id:containerId}).toString()
  });
  const mediaId=clean(published?.id);if(!mediaId)throw new Error('META_PUBLISHED_MEDIA_ID_MISSING');

  try{
    const rb=await readInstagramViaMeta(db,mediaId);
    const truth=rb.id===mediaId&&clean(rb.media_type).toUpperCase()==='VIDEO'&&clean(rb.caption)===clean(art.body);
    return {provider:'meta',provider_post_id:mediaId,container_id:containerId,permalink:rb.permalink||null,provider_truth_verified:truth,provider_truth_checked_at:new Date().toISOString(),media_url:mediaUrl,final_media_sha256:clean(proof.final_media_sha256),provider_readback:rb};
  }catch(error){
    return {provider:'meta',provider_post_id:mediaId,container_id:containerId,permalink:null,provider_truth_verified:false,provider_truth_checked_at:new Date().toISOString(),media_url:mediaUrl,final_media_sha256:clean(proof.final_media_sha256),verification_pending:true,readback_error:error instanceof Error?error.message:String(error)};
  }
}
async function publishInstagramViaComposio(db:any,art:any,runDate:string){
  const proof=art?.generation_evidence?.instagram_media_proof||{};
  if(!instagramIdentityProven(proof))throw new Error('MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED');
  const mediaType=clean(proof.media_type).toLowerCase();
  if(mediaType!=='reel')throw new Error('INSTAGRAM_MIRA_REEL_ONLY_V3');
  const mediaUrl=clean(proof.media_url);if(!mediaUrl)throw new Error('FINAL_MEDIA_URL_REQUIRED');
  const apiKey=await secret(db,'COMPOSIO_API_KEY');
  if(!apiKey)throw new Error('COMPOSIO_INSTAGRAM_AUTH_REQUIRED');
  let accountId=await secret(db,'COMPOSIO_INSTAGRAM_CONNECTED_ACCOUNT_ID');
  if(!accountId){
    const accountsResponse=await fetch(`${COMPOSIO_BASE}/connected_accounts?toolkit_slugs=instagram&statuses=ACTIVE`,{headers:{'x-api-key':apiKey}});
    const accountsBody:any=await accountsResponse.json().catch(()=>({}));
    if(!accountsResponse.ok)throw new Error(`COMPOSIO_INSTAGRAM_ACCOUNT_DISCOVERY_${accountsResponse.status}`);
    const items=Array.isArray(accountsBody?.items)?accountsBody.items:Array.isArray(accountsBody?.data?.items)?accountsBody.data.items:Array.isArray(accountsBody?.data)?accountsBody.data:[];
    const active=items.filter((item:any)=>clean(item?.status).toUpperCase()==='ACTIVE'||!clean(item?.status));
    if(active.length!==1)throw new Error(active.length===0?'COMPOSIO_INSTAGRAM_CONNECTION_REQUIRED':'COMPOSIO_INSTAGRAM_CONNECTION_AMBIGUOUS');
    accountId=clean(active[0]?.id||active[0]?.connected_account_id);
  }
  if(!accountId)throw new Error('COMPOSIO_INSTAGRAM_CONNECTION_REQUIRED');
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

const BUFFER_CIRCUIT_RECORD='buffer-rate-limit-circuit-v1';
function parseRetrySeconds(value:unknown){
  const n=Number.parseInt(clean(value),10);
  return Number.isFinite(n)&&n>0?Math.min(n,172800):900;
}
async function readBufferCircuit(db:any){
  const {data,error}=await db.from('brain_records').select('result').eq('tenant_id','canonical').eq('record_id',BUFFER_CIRCUIT_RECORD).maybeSingle();
  if(error) throw new Error(`BUFFER_CIRCUIT_READ:${error.message}`);
  const retryAt=clean(data?.result?.retry_at);
  const active=!!retryAt && Date.parse(retryAt)>Date.now();
  return {active,retry_at:retryAt||null,retry_after_seconds:Number(data?.result?.retry_after_seconds||0)};
}
async function openBufferCircuit(db:any,retryAfter:unknown,source:string){
  const seconds=parseRetrySeconds(retryAfter);
  const retryAt=new Date(Date.now()+seconds*1000).toISOString();
  const now=new Date().toISOString();
  const result={state:'OPEN',provider:'buffer',reason:'HTTP_429',retry_after_seconds:seconds,retry_at:retryAt,source,opened_at:now};
  const {error}=await db.from('brain_records').upsert({
    tenant_id:'canonical',record_id:BUFFER_CIRCUIT_RECORD,record_type:'CurrentState',record_kind:'current_state',subject_id:'buffer',
    status:'IN_PROGRESS',observed_at:now,executed:true,verified:false,result,payload:{provider:'buffer',fingerprint:'buffer-rate-limit-circuit-v1'},
    idempotency_key:BUFFER_CIRCUIT_RECORD,source_revision:'powerhouse-social-publisher',stored_at:now,updated_at:now
  },{onConflict:'tenant_id,record_id'});
  if(error) throw new Error(`BUFFER_CIRCUIT_WRITE:${error.message}`);
  return {active:true,...result};
}
async function markLinkedInRateLimited(db:any,runDate:string,circuit:any){
  const {data:rows,error}=await db.from('powerhouse_channel_decisions')
    .select('channel,delivery_evidence')
    .eq('run_date',runDate)
    .eq('decision','publish')
    .in('channel',['linkedin_personal','linkedin_company'])
    .in('state',['content_ready','dispatching']);
  if(error) throw new Error(`BUFFER_RATE_LIMIT_DECISION_READ:${error.message}`);
  for(const row of rows||[]){
    const evidence={...(row.delivery_evidence||{}),provider:'buffer',buffer_rate_limited:true,buffer_retry_at:circuit.retry_at,
      buffer_retry_after_seconds:circuit.retry_after_seconds,provider_truth_verified:false,error:'BUFFER_RATE_LIMITED'};
    await db.from('powerhouse_channel_decisions').update({state:'content_ready',delivery_evidence:evidence,updated_at:new Date().toISOString()})
      .eq('run_date',runDate).eq('channel',row.channel);
    await recordObligation(db,runDate,row.channel,'APPROVED',null,evidence,
      `Buffer rate limit open until ${circuit.retry_at}; canonical closed loop retries automatically after reset.`,'BUFFER_RATE_LIMITED');
  }
}

async function issuePublishCapability(db:any,runDate:string,channel:string,textHash:string,mediaSha:string){
  const policyVersion=channel==='instagram_company'?PUBLICATION_AUTHORITY+'|'+INSTAGRAM_POLICY:PUBLICATION_AUTHORITY+'|'+GATE;
  const {data,error}=await db.rpc('powerhouse_issue_social_publish_capability_v1',{
    p_run_date:runDate,p_channel:channel,p_channel_id:channelIds[channel],p_final_text_hash:textHash,
    p_final_media_sha256:mediaSha||'',p_policy_version:policyVersion
  });
  if(error)throw new Error('PUBLICATION_AUTHORITY_ISSUE:'+error.message);
  if(data?.authorized!==true||!clean(data?.token))throw new Error('PUBLICATION_AUTHORITY_DENIED:'+(clean(data?.reason)||'UNKNOWN'));
  return {token:clean(data.token),capabilityId:clean(data.capability_id),policyVersion};
}
async function consumePublishCapability(db:any,capability:any,runDate:string,channel:string,textHash:string,mediaSha:string){
  const {data,error}=await db.rpc('powerhouse_consume_social_publish_capability_v1',{
    p_token:capability.token,p_run_date:runDate,p_channel:channel,p_channel_id:channelIds[channel],
    p_final_text_hash:textHash,p_final_media_sha256:mediaSha||'',p_policy_version:capability.policyVersion,p_consumer:'powerhouse-social-publisher'
  });
  if(error)throw new Error('PUBLICATION_AUTHORITY_CONSUME:'+error.message);
  if(data!==true)throw new Error('PUBLICATION_AUTHORITY_CONSUME_DENIED');
}

function instagramIdentityProven(evidence: any) {
  const proof = evidence?.instagram_media_proof || evidence || {};
  const mediaType = clean(proof?.media_type || evidence?.media_type).toLowerCase();
  if (mediaType !== 'reel') return false;
  const visual = proof?.instagram_visual || {};
  const width=Number(visual?.width),height=Number(visual?.height);
  const refs=Array.isArray(visual?.evidence_refs)?visual.evidence_refs.map(clean):[];
  const visible=visual?.verified===true&&visual?.semantic_verified===true&&visual?.mira_present===true
    &&visual?.daily_life_scene===true&&visual?.mira_central_subject===true
    &&visual?.text_dominant===false&&visual?.brand_template_dominant===false
    &&clean(visual?.identity_class)==='mira_daily_life'&&clean(visual?.evidence_method).toLowerCase()==='vision'
    &&refs.some((ref:string)=>/^vision:/i.test(ref));
  const dims=width===1080&&height===1920;
  const provider=clean(proof?.media_provider||proof?.media_source).toLowerCase();
  const providerOk=provider==='openart';
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
    const declaredProvider = clean(row.delivery_evidence?.provider || obligation?.evidence?.provider).toLowerCase();
    if (row.channel === 'instagram_company' && declaredProvider && declaredProvider !== 'buffer') {
      results.push({ channel: row.channel, post_id: clean(row.delivery_ref) || clean(obligation?.external_id), state: row.state, reason: 'NON_BUFFER_INSTAGRAM_PROVIDER_OWNED', provider: declaredProvider, provider_truth_verified: row.delivery_evidence?.provider_truth_verified === true || obligation?.evidence?.provider_truth_verified === true });
      continue;
    }
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
      let containment:any={attempted:false,ok:false,reason:'NOT_CANCELLABLE'};
      if (['scheduled','draft','needs_approval'].includes(status)) {
        const pendingEvidence={...evidence,error:'EXACT_FINAL_MEDIA_PROOF_REQUIRED',transport_verified_identity_unproven:true,republish_forbidden:true,containment_state:'PENDING_PROVIDER_CANCELLATION'};
        await db.from('powerhouse_channel_decisions').update({state:'blocked',delivery_ref:ref,delivery_evidence:pendingEvidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel);
        containment={attempted:true,...await deletePost(token,ref)};
      }
      const contained=containment.ok===true;
      const blockedEvidence = { ...evidence, error: 'EXACT_FINAL_MEDIA_PROOF_REQUIRED', transport_verified_identity_unproven: true, republish_forbidden: true, containment, containment_state:contained?'CONTAINED':'PENDING_PROVIDER_CANCELLATION' };
      await db.from('powerhouse_channel_decisions').update({ state: 'blocked', delivery_ref: ref, delivery_evidence: blockedEvidence, updated_at: new Date().toISOString() }).eq('run_date', runDate).eq('channel', row.channel);
      await recordObligation(db, runDate, row.channel, 'BLOCKED', ref, blockedEvidence, contained?'Provider-publicatie geannuleerd; alleen nieuw exact Mira-asset mag opnieuw de canonieke loop in.':'Provider-cancellation nog niet bewezen; niet veilig of terminal verklaren.', contained?'EXACT_FINAL_MEDIA_PROOF_REQUIRED':'PROVIDER_CANCELLATION_PENDING');
      results.push({ channel: row.channel, post_id: ref, state: 'blocked', provider_status: status, provider_truth_verified: providerTruth, reason: 'EXACT_FINAL_MEDIA_PROOF_REQUIRED', transport_verified_identity_unproven: true, containment });
      continue;
    }

    const nextState = status === 'sent' ? 'published' : ['scheduled','sending'].includes(status) ? 'scheduled' : row.state;
    await db.from('powerhouse_channel_decisions').update({ state: nextState, delivery_ref: ref, delivery_evidence: evidence, updated_at: new Date().toISOString() }).eq('run_date', runDate).eq('channel', row.channel);
    await recordObligation(db, runDate, row.channel, status === 'sent' ? 'PUBLISHED' : 'DISPATCHED', ref, evidence, status === 'sent' ? 'Collect metrics and promote to LIVE_PROVEN only with public/provider outcome proof.' : 'Await provider send and reconcile again.', null);
    results.push({ channel: row.channel, post_id: ref, state: nextState, provider_status: status, provider_truth_verified: providerTruth, lineage_recovered_from_obligation: lineageRecovered });
  }
  return results;
}
async function containmentSweepInstagram(db:any,token:string){
  const {data:rows,error}=await db.from('powerhouse_channel_decisions')
    .select('run_date,channel,state,delivery_ref,delivery_evidence')
    .eq('channel','instagram_company')
    .not('delivery_ref','is',null)
    .in('state',['scheduled','blocked','dispatching']);
  if(error)throw new Error('INSTAGRAM_CONTAINMENT_SWEEP_READ:'+error.message);
  const out:any[]=[];
  for(const row of rows||[]){
    const ref=clean(row.delivery_ref);if(!ref)continue;
    const declaredProvider=clean(row.delivery_evidence?.provider).toLowerCase();
    if(declaredProvider && declaredProvider!=='buffer'){
      out.push({run_date:row.run_date,post_id:ref,containment:'SKIPPED_NON_BUFFER_PROVIDER',provider:declaredProvider});
      continue;
    }
    const provider=await getPost(token,ref);if(!provider)continue;
    const status=clean(provider.status).toLowerCase();
    if(instagramIdentityProven(row.delivery_evidence||{}))continue;
    if(!['scheduled','draft','needs_approval'].includes(status)){
      out.push({run_date:row.run_date,post_id:ref,status,containment:'NOT_CANCELLABLE'});continue;
    }
    const containment=await deletePost(token,ref);
    const evidence={...(row.delivery_evidence||{}),republish_forbidden:true,containment,containment_state:containment.ok?'CONTAINED':'PENDING_PROVIDER_CANCELLATION',error:'INSTAGRAM_POLICY_REVALIDATION_FAILED'};
    await db.from('powerhouse_channel_decisions').update({state:'blocked',delivery_evidence:evidence,updated_at:new Date().toISOString()}).eq('run_date',row.run_date).eq('channel','instagram_company');
    out.push({run_date:row.run_date,post_id:ref,status,containment});
  }
  return out;
}
function instagramInput(art:any,due:Date,future:boolean){
  const proof=art?.generation_evidence?.instagram_media_proof||{};
  const mediaType=clean(proof.media_type||proof.buffer_media_type).toLowerCase();
  if(!['image','reel'].includes(mediaType)) throw new Error('INSTAGRAM_MIRA_VISUAL_OR_REEL_ONLY');
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

  let bufferCircuit = await readBufferCircuit(db);
  let containment_sweep:any = { skipped:false };
  let provider_reconciliation:any[] = [];
  if (!bufferCircuit.active) {
    try {
      containment_sweep = await containmentSweepInstagram(db, bufferToken);
      provider_reconciliation = await reconcileExistingProviderTruth(db, bufferToken, runDate);
    } catch (error) {
      if (error instanceof BufferHttpError && error.status === 429) {
        bufferCircuit = await openBufferCircuit(db,error.retryAfter,'provider-audit');
        await markLinkedInRateLimited(db,runDate,bufferCircuit);
        containment_sweep = { skipped:true, reason:'BUFFER_RATE_LIMITED', retry_at:bufferCircuit.retry_at };
        provider_reconciliation = [];
      } else throw error;
    }
  } else {
    containment_sweep = { skipped:true, reason:'BUFFER_RATE_LIMIT_CIRCUIT_OPEN', retry_at:bufferCircuit.retry_at };
  }
  if (mode === 'audit_only') return json({ ok: true, runDate, containment_sweep, provider_reconciliation, buffer_circuit:bufferCircuit });

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
    if (['linkedin_personal','linkedin_company'].includes(row.channel) && bufferCircuit.active) {
      const evidence={...(row.delivery_evidence||{}),provider:'buffer',buffer_rate_limited:true,buffer_retry_at:bufferCircuit.retry_at,
        buffer_retry_after_seconds:bufferCircuit.retry_after_seconds,provider_truth_verified:false,error:'BUFFER_RATE_LIMITED'};
      await db.from('powerhouse_channel_decisions').update({state:'content_ready',delivery_evidence:evidence,updated_at:new Date().toISOString()})
        .eq('run_date',runDate).eq('channel',row.channel);
      await recordObligation(db,runDate,row.channel,'APPROVED',null,evidence,
        `Buffer rate limit open until ${bufferCircuit.retry_at}; canonical closed loop retries automatically after reset.`,'BUFFER_RATE_LIMITED');
      results.push({channel:row.channel,status:'deferred_rate_limit',retry_at:bufferCircuit.retry_at});
      continue;
    }
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
    const gatePassedEvidence={...(row.delivery_evidence||{}),pre_publish_gate:'passed',identity_gate_version:GATE,final_text_hash:textHash,publication_authority_version:PUBLICATION_AUTHORITY};
    await db.from('powerhouse_channel_decisions').update({delivery_evidence:gatePassedEvidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel).eq('state','content_ready');

    let instagramMetaConfig:MetaInstagramConfig|null=null;
    let instagramComposioApiKey:string|null=null;
    if(row.channel==='instagram_company'){
      instagramMetaConfig=await metaInstagramConfig(db);
      instagramComposioApiKey=await secret(db,'COMPOSIO_API_KEY');
      if(!instagramMetaConfig&&!instagramComposioApiKey&&bufferCircuit.active){
        const evidence={...gatePassedEvidence,provider:'meta',provider_config_ready:false,provider_truth_verified:false,error:'INSTAGRAM_TRANSPORT_DEFERRED',transport_contract:'instagram-meta-primary-composio-buffer-fallback-v1',buffer_retry_at:bufferCircuit.retry_at};
        await db.from('powerhouse_channel_decisions').update({state:'content_ready',delivery_evidence:evidence,updated_at:new Date().toISOString()})
          .eq('run_date',runDate).eq('channel',row.channel).eq('state','content_ready');
        await recordObligation(db,runDate,row.channel,'APPROVED',null,evidence,
          `Meta and Composio Instagram auth unavailable and Buffer cooldown open until ${bufferCircuit.retry_at}; reuse the same proven Mira Reel after reset.`,
          'INSTAGRAM_TRANSPORT_DEFERRED');
        results.push({channel:row.channel,status:'deferred_transport',retry_at:bufferCircuit.retry_at});
        continue;
      }
    }

    // Single-writer idempotency barrier: claim the canonical publication row atomically
    // before touching any external provider. Concurrent scheduler/manual runs may both
    // observe content_ready, but only one is allowed to transition it to dispatching.
    const { data: claimed, error: claimError } = await db.from('powerhouse_channel_decisions')
      .update({ state: 'dispatching', updated_at: new Date().toISOString() })
      .eq('run_date', runDate)
      .eq('channel', row.channel)
      .eq('decision', 'publish')
      .eq('state', 'content_ready')
      .select('channel')
      .maybeSingle();
    if (claimError) throw new Error(`PUBLICATION_CLAIM:${claimError.message}`);
    if (!claimed) {
      results.push({ channel: row.channel, status: 'skipped', reason: 'ALREADY_CLAIMED_OR_DELIVERED' });
      continue;
    }
    const mediaSha=row.channel==='instagram_company'?clean(art?.generation_evidence?.instagram_media_proof?.final_media_sha256):'';
    let capability:any;
    try{
      capability=await issuePublishCapability(db,runDate,row.channel,textHash,mediaSha);
      const authorityEvidence={...gatePassedEvidence,publication_authority:{capability_id:capability.capabilityId,policy_version:capability.policyVersion,issued:true,consumed:false}};
      await db.from('powerhouse_channel_decisions').update({delivery_evidence:authorityEvidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel).eq('state','dispatching');
    }catch(error){
      const message=error instanceof Error?error.message:String(error);
      const evidence={...gatePassedEvidence,error:message,publication_authority:{issued:false,policy_version:row.channel==='instagram_company'?PUBLICATION_AUTHORITY+'|'+INSTAGRAM_POLICY:PUBLICATION_AUTHORITY+'|'+GATE}};
      await db.from('powerhouse_channel_decisions').update({state:'blocked',delivery_evidence:evidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel);
      await recordObligation(db,runDate,row.channel,'BLOCKED',null,evidence,'Repair central publication authority proof; external provider calls are forbidden without a capability.',message);
      results.push({channel:row.channel,status:'blocked',reason:message});continue;
    }

    if (row.channel === 'instagram_company') {
      try {
        await consumePublishCapability(db,capability,runDate,row.channel,textHash,mediaSha);
        if(instagramMetaConfig){
          const direct=await publishInstagramViaMeta(db,art);
          const evidence={...gatePassedEvidence,...direct,pre_publish_gate:'passed',final_text_hash:textHash,transport_contract:'instagram-meta-primary-composio-buffer-fallback-v1',make_dependency:false,publication_authority:{capability_id:capability.capabilityId,policy_version:capability.policyVersion,issued:true,consumed:true}};
          const verified=direct.provider_truth_verified===true;
          await db.from('powerhouse_channel_decisions').update({state:verified?'published':'dispatching',delivery_ref:direct.provider_post_id,delivery_evidence:evidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel);
          await db.from('powerhouse_content_artifacts').update({status:verified?'published':'scheduled',updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel);
          await recordObligation(db,runDate,row.channel,verified?'PUBLISHED':'DISPATCHED',direct.provider_post_id,evidence,verified?'Collect Instagram outcome metrics and feed learning loop.':'Reconcile this exact Meta media_id; never issue another publish.',verified?null:'META_READBACK_PENDING');
          results.push({channel:row.channel,status:verified?'published':'verification_pending',post_id:direct.provider_post_id,permalink:direct.permalink,provider:'meta',provider_truth_verified:verified});
          continue;
        }
        if(instagramComposioApiKey){
          const direct = await publishInstagramViaComposio(db, art, runDate);
          const evidence = { ...gatePassedEvidence, ...direct, pre_publish_gate:'passed', final_text_hash:textHash, transport_contract:'instagram-meta-primary-composio-buffer-fallback-v1', fallback_reason:'META_AUTH_UNAVAILABLE', make_dependency:false, publication_authority:{capability_id:capability.capabilityId,policy_version:capability.policyVersion,issued:true,consumed:true} };
          await db.from('powerhouse_channel_decisions').update({ state:'published', delivery_ref:direct.provider_post_id, delivery_evidence:evidence, updated_at:new Date().toISOString() }).eq('run_date',runDate).eq('channel',row.channel);
          await db.from('powerhouse_content_artifacts').update({ status:'published', updated_at:new Date().toISOString() }).eq('run_date',runDate).eq('channel',row.channel);
          await recordObligation(db,runDate,row.channel,'PUBLISHED',direct.provider_post_id,evidence,'Collect Instagram outcome metrics and feed learning loop.',null);
          results.push({channel:row.channel,status:'published',post_id:direct.provider_post_id,permalink:direct.permalink,provider:'composio',provider_truth_verified:true});
          continue;
        }

        const created=await createPost(bufferToken,instagramInput(art,due,future));
        if(!created.post?.id) throw new Error(created.error||'BUFFER_INSTAGRAM_CREATE_FAILED');
        const readback=await getPost(bufferToken,created.post.id);
        const readbackOk=!!readback&&readback.id===created.post.id&&readback.channelId===INSTAGRAM&&clean(readback.text)===clean(art.body);
        if(!readbackOk){
          const containment=await deletePost(bufferToken,created.post.id);
          throw new Error('BUFFER_INSTAGRAM_READBACK_MISMATCH:'+JSON.stringify({containment}));
        }
        const evidence={...gatePassedEvidence,provider:'buffer',provider_post_id:readback.id,provider_status:clean(readback.status).toLowerCase(),provider_due_at:readback.dueAt||null,provider_truth_verified:true,provider_truth_checked_at:new Date().toISOString(),pre_publish_gate:'passed',final_text_hash:textHash,transport_contract:'instagram-meta-primary-composio-buffer-fallback-v1',fallback_reason:'COMPOSIO_AUTH_UNAVAILABLE',make_dependency:false,publication_authority:{capability_id:capability.capabilityId,policy_version:capability.policyVersion,issued:true,consumed:true}};
        const decisionState=clean(readback.status).toLowerCase()==='sent'?'published':'scheduled';
        await db.from('powerhouse_channel_decisions').update({state:decisionState,delivery_ref:readback.id,delivery_evidence:evidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel);
        await db.from('powerhouse_content_artifacts').update({status:decisionState==='published'?'published':'scheduled',updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel);
        await recordObligation(db,runDate,row.channel,decisionState==='published'?'PUBLISHED':'DISPATCHED',readback.id,evidence,decisionState==='published'?'Collect Instagram outcome metrics and feed learning loop.':'Await provider send, then reconcile.',null);
        results.push({channel:row.channel,status:decisionState,post_id:readback.id,provider:'buffer',provider_truth_verified:true});
        continue;
      } catch(error){
        if(error instanceof BufferHttpError && error.status===429){
          bufferCircuit=await openBufferCircuit(db,error.retryAfter,'instagram-buffer-fallback');
          const evidence={...(row.delivery_evidence||{}),provider:'buffer',provider_truth_verified:false,error:'BUFFER_RATE_LIMITED',transport_contract:'instagram-meta-primary-composio-buffer-fallback-v1',buffer_retry_at:bufferCircuit.retry_at};
          await db.from('powerhouse_channel_decisions').update({state:'content_ready',delivery_evidence:evidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel);
          await recordObligation(db,runDate,row.channel,'APPROVED',null,evidence,`Reuse same proven Mira Reel after Buffer reset at ${bufferCircuit.retry_at}.`,'BUFFER_RATE_LIMITED');
          results.push({channel:row.channel,status:'deferred_rate_limit',provider:'buffer',retry_at:bufferCircuit.retry_at});
          continue;
        }
        const message=error instanceof Error?error.message:String(error);
        const evidence={...(row.delivery_evidence||{}),provider:instagramMetaConfig?'meta':instagramComposioApiKey?'composio':'buffer',provider_truth_verified:false,error:message,transport_contract:'instagram-meta-primary-composio-buffer-fallback-v1',make_dependency:false};
        const authMissing=message==='META_INSTAGRAM_AUTH_REQUIRED'||message==='COMPOSIO_INSTAGRAM_AUTH_REQUIRED'||message==='COMPOSIO_INSTAGRAM_CONNECTION_REQUIRED';
        await db.from('powerhouse_channel_decisions').update({state:authMissing?'content_ready':'failed',delivery_evidence:evidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel);
        await recordObligation(db,runDate,row.channel,authMissing?'APPROVED':'FAILED',null,evidence,authMissing?'Use Buffer fallback when its circuit is closed; reuse same proven media.':'Retry only after transport diagnosis; never fall back to Make.',message);
        results.push({channel:row.channel,status:authMissing?'waiting_auth':'failed',provider:instagramMetaConfig?'meta':instagramComposioApiKey?'composio':'buffer',error:message});
        continue;
      }
    }
    const input: Record<string,unknown> = { text: clean(art.body), channelId: channelIds[row.channel], schedulingType: 'automatic', mode: future ? 'customScheduled' : 'shareNow', ...(future ? { dueAt: due.toISOString() } : {}) };
    let created: any;
    try {
      await consumePublishCapability(db,capability,runDate,row.channel,textHash,mediaSha);
      created = await createPost(bufferToken, input);
    } catch (error) {
      if (error instanceof BufferHttpError && error.status === 429) {
        bufferCircuit = await openBufferCircuit(db,error.retryAfter,'create-post');
        const evidence={...(row.delivery_evidence||{}),provider:'buffer',buffer_rate_limited:true,buffer_retry_at:bufferCircuit.retry_at,
          buffer_retry_after_seconds:bufferCircuit.retry_after_seconds,provider_truth_verified:false,error:'BUFFER_RATE_LIMITED'};
        await db.from('powerhouse_channel_decisions')
          .update({ state: 'content_ready', delivery_evidence:evidence, updated_at: new Date().toISOString() })
          .eq('run_date', runDate).eq('channel', row.channel).eq('state', 'dispatching');
        await recordObligation(db,runDate,row.channel,'APPROVED',null,evidence,
          `Buffer rate limit open until ${bufferCircuit.retry_at}; canonical closed loop retries automatically after reset.`,'BUFFER_RATE_LIMITED');
        results.push({channel:row.channel,status:'deferred_rate_limit',retry_at:bufferCircuit.retry_at});
        continue;
      }
      throw error;
    }
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
  return json({ ok: true, runDate, containment_sweep, provider_reconciliation, results, buffer_circuit:bufferCircuit, provider_truth_verified: true, publication_authority: PUBLICATION_AUTHORITY });
  } catch (error) {
    if (error instanceof BufferHttpError && error.status === 429) {
      return json({ ok: false, error: 'BUFFER_RATE_LIMITED', retryable: true, retry_after: error.retryAfter }, 429);
    }
    throw error;
  }
});