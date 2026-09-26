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
async function composioExecuteArgs(apiKey:string,connectedAccountId:string,userId:string,toolSlug:string,args:Record<string,unknown>){
  const response=await fetch(COMPOSIO_BASE+'/tools/execute/'+toolSlug,{
    method:'POST',
    headers:{'content-type':'application/json','x-api-key':apiKey},
    body:JSON.stringify({connected_account_id:connectedAccountId,user_id:userId,version:'latest',arguments:args})
  });
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok||body?.successful!==true){
    const err=clean(body?.error||body?.message||body?.data?.message||JSON.stringify(body));
    const e:any=new Error('COMPOSIO_'+toolSlug+'_'+response.status+':'+err.slice(0,240));
    e.http=response.status;e.composioBody=body;throw e;
  }
  return body;
}
async function composioLinkedInContext(db:any){
  const {apiKey,accountId}=await composioConnectedAccount(db,'linkedin','COMPOSIO_LINKEDIN_CONNECTED_ACCOUNT_ID');
  const {data,error}=await db.from('brain_records').select('result').eq('tenant_id','canonical').eq('record_id','linkedin-composio-setup-current-state-v1').maybeSingle();
  if(error)throw new Error('COMPOSIO_LINKEDIN_STATE_READ:'+error.message);
  const userId=clean(data?.result?.user_id);
  if(!userId)throw new Error('COMPOSIO_LINKEDIN_USER_ID_REQUIRED');
  return {apiKey,accountId,userId};
}

function isLinkedInAuthPreflightError(error:any){
  const message=clean(error instanceof Error?error.message:error).toUpperCase();
  const status=Number((error as any)?.http||0);
  return status===401||status===403
    ||message.includes('REVOKED_ACCESS_TOKEN')
    ||message.includes('UNAUTHORIZED')
    ||message.includes('TOKEN')
    ||message.includes('AUTH_REQUIRED')
    ||message.includes('CONNECTION_REQUIRED');
}

async function preflightLinkedInComposio(db:any){
  const {apiKey,accountId,userId}=await composioLinkedInContext(db);
  const me=await composioExecuteArgs(apiKey,accountId,userId,'LINKEDIN_GET_MY_INFO',{});
  const personId=deepPickString(me?.data||me,['id']);
  if(!personId)throw new Error('COMPOSIO_LINKEDIN_PERSON_ID_MISSING');
  return {provider:'composio',provider_auth_preflight:'passed',provider_auth_checked_at:new Date().toISOString(),account_id:accountId,person_id:personId};
}

async function runLinkedInCockpitAutopilot(db:any){
  const {data:actions,error}=await db.from('powerhouse_sales_actions')
    .select('action_id,action_type,channel,source_url,message_draft,status,person_name,company_name,evidence,priority')
    .eq('status','suggested')
    .order('priority',{ascending:false})
    .limit(15);
  if(error)throw new Error('LINKEDIN_COCKPIT_AUTOPILOT_READ:'+error.message);
  const results:any[]=[];
  for(const action of actions||[]){
    const type=clean(action.action_type);
    const sourceUrl=clean(action.source_url);
    const message=clean(action.message_draft);
    if(type!=='reply_post'){
      results.push({action_id:action.action_id,status:'exception',reason:['reply_dm','activate_connection'].includes(type)?'LINKEDIN_CAPABILITY_NOT_AVAILABLE':'ACTION_TYPE_NOT_AUTOMATABLE',action_type:type});
      continue;
    }
    if(!/^https:\/\/(?:www\.)?linkedin\.com\/(?:posts\/|feed\/update\/|pulse\/)/i.test(sourceUrl)||!message){
      results.push({action_id:action.action_id,status:'blocked',reason:'CONCRETE_POST_CONTEXT_REQUIRED'});
      continue;
    }
    const {data:claimed,error:claimError}=await db.from('powerhouse_sales_actions')
      .update({status:'dispatching',updated_at:new Date().toISOString()})
      .eq('action_id',action.action_id).eq('status','suggested')
      .select('action_id').maybeSingle();
    if(claimError)throw new Error('LINKEDIN_COCKPIT_AUTOPILOT_CLAIM:'+claimError.message);
    if(!claimed){results.push({action_id:action.action_id,status:'skipped',reason:'ALREADY_CLAIMED'});continue;}
    let providerId='';
    let providerEvidence:any=null;
    try{
      const {apiKey,accountId}=await composioConnectedAccount(db,'linkedin','COMPOSIO_LINKEDIN_CONNECTED_ACCOUNT_ID');
      const provider=await composioExecute(apiKey,accountId,'LINKEDIN_CREATE_COMMENT_ON_POST',
        `Create this exact LinkedIn comment on the post at ${sourceUrl}. Comment text: ${message}`);
      providerId=deepPickId(provider?.data||provider,['id','comment_id','commentId']);
      if(!providerId)throw new Error('COMPOSIO_LINKEDIN_COMMENT_ID_MISSING');
      providerEvidence={...(action.evidence||{}),autopilot:{version:'linkedin-cockpit-autopilot-v1',provider:'composio',tool:'LINKEDIN_CREATE_COMMENT_ON_POST',provider_id:providerId,source_url:sourceUrl,provider_ack_verified:true,exact_readback_available:false,republish_forbidden:true,executed_at:new Date().toISOString()}};
      const {error:updateError}=await db.from('powerhouse_sales_actions')
        .update({status:'executed',evidence:providerEvidence,updated_at:new Date().toISOString()})
        .eq('action_id',action.action_id).eq('status','dispatching');
      if(updateError)throw new Error('LINKEDIN_COCKPIT_AUTOPILOT_COMPLETE:'+updateError.message);
      const dedupe=await digest('cockpit-autopilot:'+action.action_id+':'+providerId);
      const {error:outcomeError}=await db.rpc('powerhouse_record_outcome',{p_action_id:action.action_id,p_dedupe_key:dedupe,p_outcome_type:'executed',p_evidence:providerEvidence.autopilot,p_revenue_eur:0});
      if(outcomeError)throw new Error('LINKEDIN_COCKPIT_AUTOPILOT_OUTCOME:'+outcomeError.message);
      results.push({action_id:action.action_id,status:'executed',provider:'composio',provider_id:providerId,provider_ack_verified:true});
    }catch(error){
      const messageError=error instanceof Error?error.message:String(error);
      if(providerId){
        const evidence=providerEvidence||{...(action.evidence||{}),autopilot:{version:'linkedin-cockpit-autopilot-v1',provider:'composio',provider_id:providerId,source_url:sourceUrl,provider_ack_verified:true,republish_forbidden:true}};
        evidence.autopilot={...(evidence.autopilot||{}),reconciliation_required:true,writeback_error:messageError,failed_at:new Date().toISOString()};
        await db.from('powerhouse_sales_actions').update({status:'executed',evidence,updated_at:new Date().toISOString()}).eq('action_id',action.action_id);
        results.push({action_id:action.action_id,status:'reconciliation_required',provider:'composio',provider_id:providerId,reason:messageError,republish_forbidden:true});
        continue;
      }
      const evidence={...(action.evidence||{}),autopilot:{version:'linkedin-cockpit-autopilot-v1',failed_at:new Date().toISOString(),error:messageError,source_url:sourceUrl}};
      await db.from('powerhouse_sales_actions').update({status:'suggested',evidence,updated_at:new Date().toISOString()}).eq('action_id',action.action_id).eq('status','dispatching');
      results.push({action_id:action.action_id,status:'failed_pre_provider',error:messageError});
    }
  }
  return results;
}

async function composioConnectedAccount(db:any,toolkit:string,secretName:string){
  const apiKey=await secret(db,'COMPOSIO_API_KEY');
  if(!apiKey)throw new Error(`COMPOSIO_${toolkit.toUpperCase()}_AUTH_REQUIRED`);
  let accountId=await secret(db,secretName);
  if(!accountId){
    const response=await fetch(`${COMPOSIO_BASE}/connected_accounts?toolkit_slugs=${encodeURIComponent(toolkit)}&statuses=ACTIVE`,{headers:{'x-api-key':apiKey}});
    const body:any=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(`COMPOSIO_${toolkit.toUpperCase()}_ACCOUNT_DISCOVERY_${response.status}`);
    const items=Array.isArray(body?.items)?body.items:Array.isArray(body?.data?.items)?body.data.items:Array.isArray(body?.data)?body.data:[];
    const active=items.filter((item:any)=>clean(item?.status).toUpperCase()==='ACTIVE'||!clean(item?.status));
    if(active.length===0)throw new Error(`COMPOSIO_${toolkit.toUpperCase()}_CONNECTION_REQUIRED`);
    if(active.length===1){
      accountId=clean(active[0]?.id||active[0]?.connected_account_id);
    } else if(toolkit==='instagram'){
      const resolved:any[]=[];
      for(const item of active){
        const id=clean(item?.id||item?.connected_account_id);
        if(!id)continue;
        const proxy=await fetch(`${COMPOSIO_BASE.replace('/api/v3','')}/api/v3.1/tools/execute/proxy`,{
          method:'POST',
          headers:{'content-type':'application/json','x-api-key':apiKey},
          body:JSON.stringify({endpoint:'/me?fields=id,username',method:'GET',connected_account_id:id,parameters:[]})
        });
        const pb:any=await proxy.json().catch(()=>({}));
        const igId=clean(pb?.data?.id||pb?.body?.data?.id);
        const username=clean(pb?.data?.username||pb?.body?.data?.username).toLowerCase();
        if(proxy.ok&&igId)resolved.push({id,igId,username,alias:clean(item?.alias).toLowerCase()});
      }
      const identities=[...new Set(resolved.map((x:any)=>x.igId))];
      if(identities.length!==1)throw new Error('COMPOSIO_INSTAGRAM_CONNECTION_AMBIGUOUS');
      const sameIdentity=resolved.filter((x:any)=>x.igId===identities[0]).sort((a:any,b:any)=>{
        const ar=a.alias==='bedrijfsgeheugen-mira'?0:a.alias==='bedrijfsgeheugen'?1:2;
        const br=b.alias==='bedrijfsgeheugen-mira'?0:b.alias==='bedrijfsgeheugen'?1:2;
        return ar-br||a.id.localeCompare(b.id);
      });
      if(!sameIdentity.length)throw new Error('COMPOSIO_INSTAGRAM_CONNECTION_AMBIGUOUS');
      accountId=sameIdentity[0].id;
    } else {
      throw new Error(`COMPOSIO_${toolkit.toUpperCase()}_CONNECTION_AMBIGUOUS`);
    }
  }
  if(!accountId)throw new Error(`COMPOSIO_${toolkit.toUpperCase()}_CONNECTION_REQUIRED`);
  return {apiKey,accountId};
}
function deepPickLinkedInPostUrn(value:any):string{
  if(typeof value==='string'&&/^urn:li:(ugcPost|share):[A-Za-z0-9_-]+$/.test(value.trim()))return value.trim();
  if(!value||typeof value!=='object')return'';
  for(const v of Object.values(value)){const found=deepPickLinkedInPostUrn(v);if(found)return found;}
  return'';
}
async function publishLinkedInPersonalViaComposio(db:any,art:any){
  const {apiKey,accountId,userId}=await composioLinkedInContext(db);
  const me=await composioExecuteArgs(apiKey,accountId,userId,'LINKEDIN_GET_MY_INFO',{});
  const personId=deepPickString(me?.data||me,['id']);
  if(!personId)throw new Error('COMPOSIO_LINKEDIN_PERSON_ID_MISSING');
  const author=`urn:li:person:${personId}`;
  const commentary=clean(art.body);
  const created=await composioExecuteArgs(apiKey,accountId,userId,'LINKEDIN_CREATE_LINKED_IN_POST',{author,commentary,visibility:'PUBLIC',lifecycleState:'PUBLISHED'});
  const createdData=created?.data||created;
  const postUrn=clean(createdData?.x_restli_id)||deepPickLinkedInPostUrn(createdData);
  if(!postUrn)throw new Error('COMPOSIO_LINKEDIN_POST_URN_MISSING');
  try{
    const readback=await composioExecuteArgs(apiKey,accountId,userId,'LINKEDIN_GET_POST_CONTENT',{post_id:postUrn});
    const rb=readback?.data||readback;
    const rbUrn=clean(rb?.id)||deepPickLinkedInPostUrn(rb);
    const truth=rbUrn===postUrn&&clean(rb?.author)===author&&clean(rb?.commentary)===commentary&&clean(rb?.lifecycleState).toUpperCase()==='PUBLISHED';
    if(!truth)throw new Error('COMPOSIO_LINKEDIN_EXACT_READBACK_MISMATCH');
    const publishedAtMs=Number(rb?.publishedAt||createdData?.publishedAt||Date.now());
    return {
      provider:'composio',
      provider_post_id:postUrn,
      provider_create_success:true,
      provider_truth_verified:true,
      provider_truth_checked_at:new Date().toISOString(),
      provider_status:'published',
      republish_forbidden:true,
      published_at:Number.isFinite(publishedAtMs)?new Date(publishedAtMs).toISOString():new Date().toISOString(),
      author_urn:author,
      linkedin_readback:{id:rbUrn,author:clean(rb?.author),commentary:clean(rb?.commentary),lifecycleState:clean(rb?.lifecycleState)}
    };
  }catch(error){
    return {
      provider:'composio',
      provider_post_id:postUrn,
      provider_create_success:true,
      provider_truth_verified:false,
      provider_truth_checked_at:new Date().toISOString(),
      provider_status:'dispatched',
      republish_forbidden:true,
      verification_pending:true,
      readback_error:error instanceof Error?error.message:String(error),
      author_urn:author
    };
  }
}
async function readLinkedInPersonalPostViaComposio(db:any,postUrn:string,expectedCommentary:string=''){
  const ref=clean(postUrn);
  if(!/^urn:li:(ugcPost|share):[A-Za-z0-9_-]+$/.test(ref))throw new Error('COMPOSIO_LINKEDIN_POST_URN_INVALID');
  const {apiKey,accountId,userId}=await composioLinkedInContext(db);
  const me=await composioExecuteArgs(apiKey,accountId,userId,'LINKEDIN_GET_MY_INFO',{});
  const personId=deepPickString(me?.data||me,['id']);
  if(!personId)throw new Error('COMPOSIO_LINKEDIN_PERSON_ID_MISSING');
  const author=`urn:li:person:${personId}`;
  const readback=await composioExecuteArgs(apiKey,accountId,userId,'LINKEDIN_GET_POST_CONTENT',{post_id:ref});
  const rb=readback?.data||readback;
  const rbUrn=clean(rb?.id)||deepPickLinkedInPostUrn(rb);
  const commentary=clean(rb?.commentary);
  const lifecycleState=clean(rb?.lifecycleState).toUpperCase();
  const truth=rbUrn===ref&&clean(rb?.author)===author&&lifecycleState==='PUBLISHED'&&(!clean(expectedCommentary)||commentary===clean(expectedCommentary));
  if(!truth)throw new Error('COMPOSIO_LINKEDIN_EXACT_RECONCILE_MISMATCH');
  return {provider:'composio',provider_post_id:ref,provider_truth_verified:true,provider_truth_checked_at:new Date().toISOString(),provider_status:'published',author_urn:author,linkedin_readback:{id:rbUrn,author:clean(rb?.author),commentary,lifecycleState}};
}

async function publicationStoryFingerprint(db:any,row:any,art:any){
  if(row?.channel!=='linkedin_personal')return null;
  const evidence=row?.delivery_evidence?.identity_gate_evidence||art?.generation_evidence?.identity_gate_evidence||{};
  const source=clean(evidence?.source_text)||clean(evidence?.content_id);
  if(!source)return null;
  const {data,error}=await db.rpc('powerhouse_story_fingerprint_v1',{p_source:source});
  if(error)throw new Error('STORY_FINGERPRINT_RPC:'+error.message);
  const fingerprint=clean(data);
  if(!fingerprint)throw new Error('STORY_FINGERPRINT_EMPTY');
  return fingerprint;
}
async function reserveGlobalUniquePublication(db:any,runDate:string,channel:string,body:string,storyFingerprint:string|null){
  const {data,error}=await db.rpc('powerhouse_reserve_unique_publication_v1',{
    p_publication_date:runDate,
    p_channel:channel,
    p_body:body,
    p_similarity_threshold:0.62,
    p_story_fingerprint:storyFingerprint,
  });
  if(error)throw new Error('GLOBAL_POST_UNIQUENESS_RPC:'+error.message);
  const result=data||{};
  if(result.allowed!==true){
    const reason=clean(result.reason)||'GLOBAL_POST_DUPLICATE_BLOCKED';
    throw new Error('GLOBAL_POST_DUPLICATE_BLOCKED:'+reason+':'+JSON.stringify({
      matched_reservation_key:result.matched_reservation_key||null,
      matched_channel:result.matched_channel||null,
      matched_publication_date:result.matched_publication_date||null,
      similarity:result.similarity||null,
      threshold:result.threshold||null
    }));
  }
  return result;
}

async function ensureLinkedInCompanyMeasuredLink(db:any,runDate:string,art:any){
  const compact=runDate.replaceAll('-','');
  const key='li-company-'+compact;
  const destination='https://www.bedrijfsgeheugen.nl/frisse-blik';
  const campaignKey='powerhouse-'+runDate+'-linkedin-company';
  const measuredUrl='https://www.bedrijfsgeheugen.nl/g/'+key;
  const {error:linkError}=await db.from('bg_campaign_links').upsert({
    key,destination,campaign_key:campaignKey,status:'active',updated_at:new Date().toISOString()
  },{onConflict:'key'});
  if(linkError)throw new Error('LINKEDIN_COMPANY_MEASURED_LINK_UPSERT:'+linkError.message);
  let body=clean(art?.body);
  if(!body.includes('/g/')){
    const cta='Benieuwd waar in jouw organisatie tijd, risico of besluitvorming blijft hangen? Doe de Frisse blik:\n'+measuredUrl;
    const hashIndex=body.search(/\n#[A-Za-z0-9_]/);
    body=hashIndex>=0 ? body.slice(0,hashIndex)+'\n\n'+cta+'\n'+body.slice(hashIndex+1) : body+'\n\n'+cta;
  }
  const generationEvidence={...(art?.generation_evidence||{}),measurable_link:measuredUrl,campaign_key:campaignKey,link_destination:destination,measurable_link_verified:true};
  if(body!==clean(art?.body) || clean(art?.generation_evidence?.measurable_link)!==measuredUrl){
    const {error:updateError}=await db.from('powerhouse_content_artifacts').update({
      body,generation_evidence:generationEvidence,updated_at:new Date().toISOString()
    }).eq('run_date',runDate).eq('channel','linkedin_company');
    if(updateError)throw new Error('LINKEDIN_COMPANY_MEASURED_LINK_ARTIFACT_WRITE:'+updateError.message);
  }
  art.body=body;
  art.generation_evidence=generationEvidence;
  return {measuredUrl,campaignKey,destination};
}

async function linkedinCompanyAuthorUrn(db:any):Promise<string>{
  const explicit=clean(await secret(db,'COMPOSIO_LINKEDIN_COMPANY_AUTHOR_URN'));
  if(explicit){
    if(!/^urn:li:organization:[A-Za-z0-9_-]+$/.test(explicit))throw new Error('COMPOSIO_LINKEDIN_COMPANY_AUTHOR_URN_INVALID');
    return explicit;
  }
  const {data,error}=await db.from('brain_records')
    .select('result')
    .eq('tenant_id','canonical')
    .eq('record_id','linkedin-composio-setup-current-state-v1')
    .maybeSingle();
  if(error)throw new Error('COMPOSIO_LINKEDIN_COMPANY_STATE_READ:'+error.message);
  const urns=Array.isArray(data?.result?.company_author_urns)
    ? [...new Set(data.result.company_author_urns.map((v:any)=>clean(v)).filter((v:string)=>/^urn:li:organization:[A-Za-z0-9_-]+$/.test(v)))]
    : [];
  if(urns.length===0)throw new Error('COMPOSIO_LINKEDIN_COMPANY_AUTHOR_UNVERIFIED');
  if(urns.length!==1)throw new Error('COMPOSIO_LINKEDIN_COMPANY_AUTHOR_AMBIGUOUS');
  return urns[0];
}
async function publishLinkedInCompanyViaComposio(db:any,art:any){
  const {apiKey,accountId,userId}=await composioLinkedInContext(db);
  const author=await linkedinCompanyAuthorUrn(db);
  const commentary=clean(art.body);
  const created=await composioExecuteArgs(apiKey,accountId,userId,'LINKEDIN_CREATE_LINKED_IN_POST',{author,commentary,visibility:'PUBLIC',lifecycleState:'PUBLISHED'});
  const createdData=created?.data||created;
  const postUrn=clean(createdData?.x_restli_id)||deepPickLinkedInPostUrn(createdData);
  if(!postUrn)throw new Error('COMPOSIO_LINKEDIN_COMPANY_POST_URN_MISSING');
  try{
    const readback=await composioExecuteArgs(apiKey,accountId,userId,'LINKEDIN_GET_POST_CONTENT',{post_id:postUrn});
    const rb=readback?.data||readback;
    const rbUrn=clean(rb?.id)||deepPickLinkedInPostUrn(rb);
    const truth=rbUrn===postUrn&&clean(rb?.author)===author&&clean(rb?.commentary)===commentary&&clean(rb?.lifecycleState).toUpperCase()==='PUBLISHED';
    if(!truth)throw new Error('COMPOSIO_LINKEDIN_COMPANY_EXACT_READBACK_MISMATCH');
    const publishedAtMs=Number(rb?.publishedAt||createdData?.publishedAt||Date.now());
    return {
      provider:'composio',
      provider_post_id:postUrn,
      provider_create_success:true,
      provider_truth_verified:true,
      provider_truth_checked_at:new Date().toISOString(),
      provider_status:'published',
      republish_forbidden:true,
      published_at:Number.isFinite(publishedAtMs)?new Date(publishedAtMs).toISOString():new Date().toISOString(),
      author_urn:author,
      linkedin_readback:{id:rbUrn,author:clean(rb?.author),commentary:clean(rb?.commentary),lifecycleState:clean(rb?.lifecycleState)}
    };
  }catch(error){
    return {
      provider:'composio',
      provider_post_id:postUrn,
      provider_create_success:true,
      provider_truth_verified:false,
      provider_truth_checked_at:new Date().toISOString(),
      provider_status:'dispatched',
      verification_pending:true,
      republish_forbidden:true,
      author_urn:author,
      readback_error:error instanceof Error?error.message:String(error)
    };
  }
}
async function readLinkedInCompanyPostViaComposio(db:any,postUrn:string,expectedCommentary:string=''){
  const ref=clean(postUrn);
  if(!/^urn:li:(ugcPost|share):[A-Za-z0-9_-]+$/.test(ref))throw new Error('COMPOSIO_LINKEDIN_COMPANY_POST_URN_INVALID');
  const {apiKey,accountId,userId}=await composioLinkedInContext(db);
  const author=await linkedinCompanyAuthorUrn(db);
  const readback=await composioExecuteArgs(apiKey,accountId,userId,'LINKEDIN_GET_POST_CONTENT',{post_id:ref});
  const rb=readback?.data||readback;
  const rbUrn=clean(rb?.id)||deepPickLinkedInPostUrn(rb);
  const commentary=clean(rb?.commentary);
  const lifecycleState=clean(rb?.lifecycleState).toUpperCase();
  const truth=rbUrn===ref&&clean(rb?.author)===author&&lifecycleState==='PUBLISHED'&&(!clean(expectedCommentary)||commentary===clean(expectedCommentary));
  if(!truth)throw new Error('COMPOSIO_LINKEDIN_COMPANY_EXACT_RECONCILE_MISMATCH');
  return {provider:'composio',provider_post_id:ref,provider_truth_verified:true,provider_truth_checked_at:new Date().toISOString(),provider_status:'published',author_urn:author,linkedin_readback:{id:rbUrn,author:clean(rb?.author),commentary,lifecycleState}};
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
    const readbackType=clean(rb.media_type).toUpperCase();
    const truth=rb.id===mediaId&&['VIDEO','REEL','REELS'].includes(readbackType)&&clean(rb.caption)===clean(art.body);
    return {provider:'meta',provider_post_id:mediaId,container_id:containerId,permalink:rb.permalink||null,provider_truth_verified:truth,provider_truth_checked_at:new Date().toISOString(),published_at:rb.timestamp||new Date().toISOString(),media_type:readbackType||'REELS',media_url:mediaUrl,final_media_sha256:clean(proof.final_media_sha256),provider_readback:rb};
  }catch(error){
    return {provider:'meta',provider_post_id:mediaId,container_id:containerId,permalink:null,provider_truth_verified:false,provider_truth_checked_at:new Date().toISOString(),published_at:new Date().toISOString(),media_type:'REELS',media_url:mediaUrl,final_media_sha256:clean(proof.final_media_sha256),verification_pending:true,readback_error:error instanceof Error?error.message:String(error)};
  }
}
async function publishInstagramViaComposio(db:any,art:any,runDate:string){
  const proof=art?.generation_evidence?.instagram_media_proof||{};
  if(!instagramIdentityProven(proof))throw new Error('MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED');
  const mediaType=clean(proof.media_type).toLowerCase();
  if(mediaType!=='reel')throw new Error('INSTAGRAM_MIRA_REEL_ONLY_V3');
  const mediaUrl=clean(proof.media_url);if(!mediaUrl)throw new Error('FINAL_MEDIA_URL_REQUIRED');
  const {apiKey,accountId}=await composioConnectedAccount(db,'instagram','COMPOSIO_INSTAGRAM_CONNECTED_ACCOUNT_ID');
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
  const publishedAt=deepPickString(rb,['timestamp','created_time','created_at'])||new Date().toISOString();
  const mediaTypeReadback=deepPickString(rb,['media_product_type','media_type','type'])||'REELS';
  return {provider:'composio',provider_post_id:mediaId,container_id:containerId,permalink:permalink||null,provider_truth_verified:true,provider_truth_checked_at:new Date().toISOString(),published_at:publishedAt,media_type:mediaTypeReadback,media_url:mediaUrl,final_media_sha256:clean(proof.final_media_sha256)};
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

async function ingestDirectInstagramSocialPost(db:any,runDate:string,art:any,direct:any,textHash:string){
  if(direct?.provider_truth_verified!==true||!clean(direct?.provider_post_id))throw new Error('DIRECT_INSTAGRAM_SOCIAL_INGEST_REQUIRES_PROVIDER_TRUTH');
  const {data:winner,error:winnerError}=await db.from('powerhouse_instagram_daily_winners_v1')
    .select('recommendation_id,score_version,selected_format')
    .eq('run_date',runDate).maybeSingle();
  if(winnerError)throw new Error('DIRECT_INSTAGRAM_WINNER_READ:'+winnerError.message);
  const now=new Date().toISOString();
  const post={
    tenant_id:'bedrijfsgeheugen',
    post_id:clean(direct.provider_post_id),
    platform:'instagram',
    external_post_id:clean(direct.provider_post_id),
    published_at:clean(direct.published_at)||now,
    content_hash:textHash,
    format:clean(winner?.selected_format)||'reel',
    hook_type:clean(art?.generation_evidence?.hook_type)||null,
    learning_status:'observed',
    channel_id:INSTAGRAM,
    channel_name:'bedrijfsgeheugen.nl',
    channel_kind:'instagram_company',
    winner_recommendation_id:winner?.recommendation_id||null,
    winner_score_version:clean(winner?.score_version)||null,
    updated_at:now
  };
  const {error}=await db.from('social_posts').upsert(post,{onConflict:'tenant_id,platform,external_post_id',ignoreDuplicates:false});
  if(error)throw new Error('DIRECT_INSTAGRAM_SOCIAL_INGEST:'+error.message);
  const {error:lessonError}=await db.rpc('bg_content_lessen');
  if(lessonError)throw new Error('DIRECT_INSTAGRAM_SOCIAL_LEARNING:'+lessonError.message);
  return {post_id:post.post_id,format:post.format,winner_recommendation_id:post.winner_recommendation_id,winner_score_version:post.winner_score_version};
}

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
    if (row.channel === 'linkedin_personal' && (declaredProvider === 'linkedin_direct' || /^urn:li:(ugcPost|share):[A-Za-z0-9_-]+$/.test(ref))) {
      try {
        const {data:artifact,error:artifactError}=await db.from('powerhouse_content_artifacts').select('body').eq('run_date',runDate).eq('channel','linkedin_personal').maybeSingle();
        if(artifactError)throw new Error(`LINKEDIN_DIRECT_ARTIFACT_READ:${artifactError.message}`);
        const direct=await readLinkedInPersonalPostViaComposio(db,ref,clean(artifact?.body));
        const evidence={...(obligation?.evidence||{}),...(row.delivery_evidence||{}),...direct,stale_delivery_ref:false,lineage_recovered_from_obligation:lineageRecovered,transport_contract:'linkedin-composio-direct-v2',buffer_dependency:false};
        await db.from('powerhouse_channel_decisions').update({state:'published',delivery_ref:ref,delivery_evidence:evidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel);
        await recordObligation(db,runDate,row.channel,'PUBLISHED',ref,evidence,'Collect LinkedIn outcome metrics and feed learning loop.',null);
        results.push({channel:row.channel,post_id:ref,state:'published',provider:'composio',provider_truth_verified:true,lineage_recovered_from_obligation:lineageRecovered});
      } catch(error) {
        const message=error instanceof Error?error.message:String(error);
        const evidence={...(obligation?.evidence||{}),...(row.delivery_evidence||{}),provider:'composio',provider_post_id:ref,provider_truth_verified:false,provider_truth_checked_at:new Date().toISOString(),error:message,republish_forbidden:true,transport_contract:'linkedin-composio-direct-v2',buffer_dependency:false};
        await db.from('powerhouse_channel_decisions').update({state:'blocked',delivery_ref:ref,delivery_evidence:evidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel);
        await recordObligation(db,runDate,row.channel,'BLOCKED',ref,evidence,'Repair exact LinkedIn direct readback for this URN; never route this claim through Buffer or create a replacement post.',message);
        results.push({channel:row.channel,post_id:ref,state:'blocked',provider:'composio',provider_truth_verified:false,reason:message});
      }
      continue;
    }
    if (row.channel === 'linkedin_company' && ((declaredProvider === 'composio' || declaredProvider === 'linkedin_direct') || /^urn:li:(ugcPost|share):[A-Za-z0-9_-]+$/.test(ref))) {
      try {
        const {data:artifact,error:artifactError}=await db.from('powerhouse_content_artifacts').select('body').eq('run_date',runDate).eq('channel','linkedin_company').maybeSingle();
        if(artifactError)throw new Error(`LINKEDIN_COMPANY_DIRECT_ARTIFACT_READ:${artifactError.message}`);
        const direct=await readLinkedInCompanyPostViaComposio(db,ref,clean(artifact?.body));
        const evidence={...(obligation?.evidence||{}),...(row.delivery_evidence||{}),...direct,stale_delivery_ref:false,lineage_recovered_from_obligation:lineageRecovered,transport_contract:'linkedin-composio-direct-v2',buffer_dependency:false};
        await db.from('powerhouse_channel_decisions').update({state:'published',delivery_ref:ref,delivery_evidence:evidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel);
        await recordObligation(db,runDate,row.channel,'PUBLISHED',ref,evidence,'Collect LinkedIn company outcome metrics and feed learning loop.',null);
        results.push({channel:row.channel,post_id:ref,state:'published',provider:'composio',provider_truth_verified:true,lineage_recovered_from_obligation:lineageRecovered});
      } catch(error) {
        const message=error instanceof Error?error.message:String(error);
        const evidence={...(obligation?.evidence||{}),...(row.delivery_evidence||{}),provider:'composio',provider_post_id:ref,provider_truth_verified:false,provider_truth_checked_at:new Date().toISOString(),error:message,republish_forbidden:true,transport_contract:'linkedin-composio-direct-v2',buffer_dependency:false};
        await db.from('powerhouse_channel_decisions').update({state:'blocked',delivery_ref:ref,delivery_evidence:evidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel);
        await recordObligation(db,runDate,row.channel,'BLOCKED',ref,evidence,'Repair exact LinkedIn company Composio readback for this URN; never route this claim through Buffer or create a replacement post.',message);
        results.push({channel:row.channel,post_id:ref,state:'blocked',provider:'composio',provider_truth_verified:false,reason:message});
      }
      continue;
    }
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
  if (mode === 'cockpit_autopilot') return json({ ok: true, runDate, cockpit_autopilot: await runLinkedInCockpitAutopilot(db) });
  const { data: integration } = await db.from('bg_integrations').select('token').eq('integration', 'buffer').eq('status', 'actief').maybeSingle();
  const bufferToken = clean(integration?.token) || null;

  let bufferCircuit = await readBufferCircuit(db);
  let containment_sweep:any = { skipped:false };
  let provider_reconciliation:any[] = [];
  if (!bufferCircuit.active && bufferToken) {
    try {
      containment_sweep = await containmentSweepInstagram(db, bufferToken);
      provider_reconciliation = await reconcileExistingProviderTruth(db, bufferToken, runDate);
    } catch (error) {
      if (error instanceof BufferHttpError && error.status === 429) {
        bufferCircuit = await openBufferCircuit(db,error.retryAfter,'provider-audit');
        containment_sweep = { skipped:true, reason:'BUFFER_RATE_LIMITED', retry_at:bufferCircuit.retry_at };
        provider_reconciliation = [];
      } else throw error;
    }
  } else {
    containment_sweep = { skipped:true, reason:bufferToken?'BUFFER_RATE_LIMIT_CIRCUIT_OPEN':'BUFFER_TOKEN_UNAVAILABLE_NON_BLOCKING', retry_at:bufferCircuit.retry_at };
  }
  if (mode === 'audit_only') return json({ ok: true, runDate, containment_sweep, provider_reconciliation, buffer_circuit:bufferCircuit });

  const cockpit_autopilot = await runLinkedInCockpitAutopilot(db);
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
    if(row.channel==='linkedin_company'){
      const measured=await ensureLinkedInCompanyMeasuredLink(db,runDate,art);
      row.delivery_evidence={...(row.delivery_evidence||{}),measurable_link:measured.measuredUrl,measurable_link_verified:true,campaign_key:measured.campaignKey};
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

    // External auth is a precondition, not a consumed publication attempt.
    // A revoked/expired LinkedIn token must leave the exact daily claim resumable.
    if(row.channel==='linkedin_personal'||row.channel==='linkedin_company'){
      try{
        const providerPreflight=await preflightLinkedInComposio(db);
        const evidence={...gatePassedEvidence,...providerPreflight,provider_auth_required:false,republish_forbidden:false,buffer_dependency:false};
        row.delivery_evidence=evidence;
        await db.from('powerhouse_channel_decisions').update({state:'content_ready',delivery_evidence:evidence,updated_at:new Date().toISOString()})
          .eq('run_date',runDate).eq('channel',row.channel).eq('state','content_ready');
      }catch(error){
        const message=error instanceof Error?error.message:String(error);
        if(!isLinkedInAuthPreflightError(error))throw error;
        const evidence={...gatePassedEvidence,provider:'composio',provider_auth_preflight:'failed',provider_auth_required:true,provider_truth_verified:false,
          provider_auth_checked_at:new Date().toISOString(),error:'LINKEDIN_REAUTH_REQUIRED',provider_error:message,republish_forbidden:false,
          possible_provider_side_effect:false,buffer_dependency:false,transport_contract:'linkedin-composio-direct-v3-auth-preflight'};
        await db.from('powerhouse_channel_decisions').update({state:'content_ready',delivery_evidence:evidence,updated_at:new Date().toISOString()})
          .eq('run_date',runDate).eq('channel',row.channel).eq('state','content_ready');
        await recordObligation(db,runDate,row.channel,'APPROVED',null,evidence,
          'Re-authorize the canonical LinkedIn Composio account; then resume this exact daily claim. No publish capability or provider side-effect has been consumed.',
          'LINKEDIN_REAUTH_REQUIRED');
        results.push({channel:row.channel,status:'waiting_reauth',provider:'composio',resumable:true,error:'LINKEDIN_REAUTH_REQUIRED'});
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

    let uniqueness:any;
    try{
      const storyFingerprint=await publicationStoryFingerprint(db,row,art);
      uniqueness=await reserveGlobalUniquePublication(db,runDate,row.channel,clean(art.body),storyFingerprint);
      const uniquenessEvidence={...gatePassedEvidence,global_uniqueness_gate:'passed',global_uniqueness_fingerprint:'powerhouse-global-post-story-uniqueness-v2',global_uniqueness:uniqueness,story_fingerprint:storyFingerprint,publication_authority:{capability_id:capability.capabilityId,policy_version:capability.policyVersion,issued:true,consumed:false}};
      await db.from('powerhouse_channel_decisions').update({delivery_evidence:uniquenessEvidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel).eq('state','dispatching');
    }catch(error){
      const message=error instanceof Error?error.message:String(error);
      const evidence={...gatePassedEvidence,error:message,global_uniqueness_gate:'blocked',global_uniqueness_fingerprint:'powerhouse-global-post-story-uniqueness-v2',provider_truth_verified:false,republish_forbidden:true,publication_authority:{capability_id:capability.capabilityId,policy_version:capability.policyVersion,issued:true,consumed:false}};
      await db.from('powerhouse_channel_decisions').update({state:'blocked',delivery_evidence:evidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel).eq('state','dispatching');
      await recordObligation(db,runDate,row.channel,'BLOCKED',null,evidence,'Generate genuinely new content from a different angle/source. Never publish exact or near-duplicate historical content.',message);
      results.push({channel:row.channel,status:'blocked_duplicate',reason:message});
      continue;
    }

    if (row.channel === 'linkedin_personal') {
      try {
        await consumePublishCapability(db,capability,runDate,row.channel,textHash,mediaSha);
        const direct=await publishLinkedInPersonalViaComposio(db,art);
        const verified=direct.provider_truth_verified===true;
        const evidence={...gatePassedEvidence,...direct,pre_publish_gate:'passed',final_text_hash:textHash,personal_truth_verified:true,transport_contract:'linkedin-composio-direct-v2',buffer_dependency:false,republish_forbidden:true,publication_authority:{capability_id:capability.capabilityId,policy_version:capability.policyVersion,issued:true,consumed:true}};
        await db.from('powerhouse_channel_decisions').update({state:verified?'published':'dispatching',delivery_ref:direct.provider_post_id,delivery_evidence:evidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel);
        await db.from('powerhouse_content_artifacts').update({status:verified?'published':'scheduled',updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel);
        await recordObligation(db,runDate,row.channel,verified?'PUBLISHED':'DISPATCHED',direct.provider_post_id,evidence,verified?'Collect LinkedIn outcome metrics and feed learning loop.':'Reconcile this exact LinkedIn personal post URN; never issue another post for this daily claim.',verified?null:'LINKEDIN_PERSONAL_READBACK_PENDING');
        results.push({channel:row.channel,status:verified?'published':'verification_pending',post_id:direct.provider_post_id,provider:'composio',provider_truth_verified:verified});
        continue;
      } catch(error) {
        const message=error instanceof Error?error.message:String(error);
        const evidence={...(row.delivery_evidence||{}),provider:'composio',provider_truth_verified:false,error:message,transport_contract:'linkedin-composio-direct-v2',buffer_dependency:false};
        await db.from('powerhouse_channel_decisions').update({state:'blocked',delivery_evidence:evidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel).eq('state','dispatching');
        await recordObligation(db,runDate,row.channel,'BLOCKED',null,evidence,'Repair the direct LinkedIn connection/readback for this exact claim; do not fall back to Buffer or issue a replacement post.',message);
        results.push({channel:row.channel,status:'blocked_direct_linkedin',provider:'composio',error:message});
        continue;
      }
    }

    if (row.channel === 'linkedin_company') {
      try {
        await consumePublishCapability(db,capability,runDate,row.channel,textHash,mediaSha);
        const direct=await publishLinkedInCompanyViaComposio(db,art);
        const verified=direct.provider_truth_verified===true;
        const evidence={...gatePassedEvidence,...direct,pre_publish_gate:'passed',final_text_hash:textHash,transport_contract:'linkedin-composio-direct-v2',buffer_dependency:false,republish_forbidden:true,publication_authority:{capability_id:capability.capabilityId,policy_version:capability.policyVersion,issued:true,consumed:true}};
        await db.from('powerhouse_channel_decisions').update({state:verified?'published':'dispatching',delivery_ref:direct.provider_post_id,delivery_evidence:evidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel);
        await db.from('powerhouse_content_artifacts').update({status:verified?'published':'scheduled',updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel);
        await recordObligation(db,runDate,row.channel,verified?'PUBLISHED':'DISPATCHED',direct.provider_post_id,evidence,verified?'Collect LinkedIn company outcome metrics and feed learning loop.':'Reconcile this exact LinkedIn organization post URN; never issue another post for this daily claim.',verified?null:'LINKEDIN_COMPANY_READBACK_PENDING');
        results.push({channel:row.channel,status:verified?'published':'verification_pending',post_id:direct.provider_post_id,provider:'composio',provider_truth_verified:verified});
        continue;
      } catch(error) {
        const message=error instanceof Error?error.message:String(error);
        const evidence={...(row.delivery_evidence||{}),provider:'composio',provider_truth_verified:false,error:message,transport_contract:'linkedin-composio-direct-v2',buffer_dependency:false,republish_forbidden:true};
        await db.from('powerhouse_channel_decisions').update({state:'blocked',delivery_evidence:evidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel).eq('state','dispatching');
        await recordObligation(db,runDate,row.channel,'BLOCKED',null,evidence,'Repair the Composio LinkedIn company connection/readback for this exact claim; do not fall back to Buffer or issue a replacement post.',message);
        results.push({channel:row.channel,status:'blocked_composio_linkedin_company',provider:'composio',error:message});
        continue;
      }
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
          await recordObligation(db,runDate,row.channel,verified?'PUBLISHED':'DISPATCHED',direct.provider_post_id,evidence,verified?'Collect Instagram outcome metrics and feed learning loop.':'Reconcile this exact Meta media id; never issue another publish.',verified?null:'META_READBACK_PENDING');
          const socialIngest=verified?await ingestDirectInstagramSocialPost(db,runDate,art,direct,textHash):null;
          results.push({channel:row.channel,status:verified?'published':'verification_pending',post_id:direct.provider_post_id,permalink:direct.permalink,provider:'meta',provider_truth_verified:verified,social_ingest:socialIngest});
          continue;
        }
        if(instagramComposioApiKey){
          const direct = await publishInstagramViaComposio(db, art, runDate);
          const evidence = { ...gatePassedEvidence, ...direct, pre_publish_gate:'passed', final_text_hash:textHash, transport_contract:'instagram-meta-primary-composio-buffer-fallback-v1', fallback_reason:'META_AUTH_UNAVAILABLE', make_dependency:false, publication_authority:{capability_id:capability.capabilityId,policy_version:capability.policyVersion,issued:true,consumed:true} };
          await db.from('powerhouse_channel_decisions').update({ state:'published', delivery_ref:direct.provider_post_id, delivery_evidence:evidence, updated_at:new Date().toISOString() }).eq('run_date',runDate).eq('channel',row.channel);
          await db.from('powerhouse_content_artifacts').update({ status:'published', updated_at:new Date().toISOString() }).eq('run_date',runDate).eq('channel',row.channel);
          await recordObligation(db,runDate,row.channel,'PUBLISHED',direct.provider_post_id,evidence,'Collect Instagram outcome metrics and feed learning loop.',null);
          const socialIngest=await ingestDirectInstagramSocialPost(db,runDate,art,direct,textHash);
          results.push({channel:row.channel,status:'published',post_id:direct.provider_post_id,permalink:direct.permalink,provider:'composio',provider_truth_verified:true,social_ingest:socialIngest});
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
        const evidence={...gatePassedEvidence,provider:'buffer',provider_post_id:readback.id,provider_status:clean(readback.status).toLowerCase(),provider_due_at:readback.dueAt||null,provider_truth_verified:true,provider_truth_checked_at:new Date().toISOString(),pre_publish_gate:'passed',final_text_hash:textHash,transport_contract:'instagram-meta-primary-composio-buffer-fallback-v1',fallback_reason:'META_AND_COMPOSIO_AUTH_UNAVAILABLE',make_dependency:false,publication_authority:{capability_id:capability.capabilityId,policy_version:capability.policyVersion,issued:true,consumed:true}};
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
    if (!bufferToken) {
      const evidence={...(row.delivery_evidence||{}),provider:'buffer',provider_truth_verified:false,error:'BUFFER_TOKEN_MISSING',buffer_dependency:true};
      await db.from('powerhouse_channel_decisions').update({state:'content_ready',delivery_evidence:evidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',row.channel).eq('state','dispatching');
      await recordObligation(db,runDate,row.channel,'APPROVED',null,evidence,'Restore Buffer only for remaining fallback channels; personal LinkedIn is independent.','BUFFER_TOKEN_MISSING');
      results.push({channel:row.channel,status:'deferred_buffer_unavailable'});
      continue;
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
  return json({ ok: true, runDate, containment_sweep, provider_reconciliation, cockpit_autopilot, results, buffer_circuit:bufferCircuit, provider_truth_verified: true, publication_authority: PUBLICATION_AUTHORITY });
  } catch (error) {
    if (error instanceof BufferHttpError && error.status === 429) {
      return json({ ok: false, error: 'BUFFER_RATE_LIMITED', retryable: true, retry_after: error.retryAfter }, 429);
    }
    throw error;
  }
});