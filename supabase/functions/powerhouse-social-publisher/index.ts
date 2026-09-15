import { createClient } from 'npm:@supabase/supabase-js@2';

const ORG_ID='6a7037d2d8fce064ac755ec7';
const PERSONAL='6a70381699afb44349f0fb35';
const COMPANY='6a70381699afb44349f0fb36';
const INSTAGRAM='6a70384d99afb44349f0fba9';
const GATE='channel-identity-hard-gate-v3';
const CONTRACT='arthur-personal-linkedin-identity-v4';
const VERSION='v3-instagram-fail-closed';
const ids:any={linkedin_personal:PERSONAL,linkedin_company:COMPANY,instagram_company:INSTAGRAM};
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const clean=(v:unknown)=>String(v??'').trim();
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
async function digest(v:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function bufferGql(token:string,query:string){const r=await fetch('https://api.buffer.com',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({query})});const b=await r.json().catch(()=>({}));if(!r.ok||b.errors)throw new Error('BUFFER_GQL:'+clean(b?.errors?.[0]?.message||r.status));return b.data;}
const esc=(s:unknown)=>String(s).replaceAll('\\','\\\\').replaceAll('"','\\"').replaceAll('\n','\\n').replaceAll('\r','');
async function futurePersonal(token:string){const q=`query { posts(first: 100, input: {organizationId: "${ORG_ID}", filter: {status: [scheduled, sending], channelIds: ["${PERSONAL}"]}, sort: [{field: dueAt, direction: asc}]}) { edges { node { id text status dueAt channelId } } pageInfo { hasNextPage endCursor } } }`;const d=await bufferGql(token,q);return (d?.posts?.edges||[]).map((e:any)=>e.node);}
async function getPost(token:string,id:string){const d=await bufferGql(token,`query { post(input:{id:"${esc(id)}"}) { id text status dueAt channelId assets { id mimeType source } } }`);return d?.post||null;}
async function deletePost(token:string,id:string){const d=await bufferGql(token,`mutation { deletePost(input:{id:"${esc(id)}"}) { __typename ... on DeletePostSuccess { id } ... on VoidMutationError { message } } }`);const x=d?.deletePost||{};return {ok:x.__typename==='DeletePostSuccess'&&x.id===id,type:x.__typename||null,id:x.id||null,error:x.message||null};}
async function review(url:string,payload:any){const r=await fetch(url+'/functions/v1/bg-pre-publish-review',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const b=await r.json().catch(()=>({}));return {http:r.status,...b};}

async function obligationState(db:any,runDate:string,channel:string,status:string,evidence:any,error:string|null=null,externalId:string|null=null){
  const {error:rpcError}=await db.rpc('record_content_publication_state',{p_tenant_id:'canonical',p_publication_date:runDate,p_channel:channel,p_status:status,p_external_id:externalId,p_evidence:evidence||{},p_error:error});
  if(rpcError)console.error('PUBLICATION_OBLIGATION_STATE_FAILED',channel,status,rpcError.message);
}

function instagramMedia(d:any,art:any){
  const m=d?.delivery_evidence?.instagram_media||art?.generation_evidence?.instagram_media||{};
  const assetUrl=clean(m.assetUrl||m.asset_url);
  const mediaKind=clean(m.mediaKind||m.media_kind).toLowerCase();
  const miraVerified=m.mira_verified===true||m.miraVerified===true;
  let publicHttps=false;
  try{const u=new URL(assetUrl);publicHttps=u.protocol==='https:'&&!!u.hostname&&!['localhost','127.0.0.1'].includes(u.hostname);}catch{}
  return {assetUrl,mediaKind,miraVerified,publicHttps,raw:m};
}

function bufferAssetsInput(media:any){
  if(media.mediaKind==='image'||media.mediaKind==='photo')return `assets: [{ image: { url: "${esc(media.assetUrl)}" } }]`;
  if(media.mediaKind==='video'||media.mediaKind==='reel')return `assets: [{ video: { url: "${esc(media.assetUrl)}" } }]`;
  throw new Error('INSTAGRAM_MEDIA_KIND_REQUIRED');
}

async function auditPersonalQueue(db:any,url:string,token:string){
  const posts=await futurePersonal(token); const results:any[]=[];
  for(const p of posts){
    const hash=await digest(clean(p.text));
    const {data:d}=await db.from('powerhouse_channel_decisions').select('run_date,channel,decision,state,delivery_ref,delivery_evidence').eq('delivery_ref',p.id).maybeSingle();
    let art:any=null; if(d?.run_date&&d?.channel){const q=await db.from('powerhouse_content_artifacts').select('body,generation_evidence,status').eq('run_date',d.run_date).eq('channel',d.channel).maybeSingle();art=q.data;}
    const evidence=d?.delivery_evidence?.identity_gate_evidence||art?.generation_evidence?.identity_gate_evidence||{};
    const payload={...evidence,channel_id:PERSONAL,channel_kind:'linkedin_personal',identity_contract:CONTRACT,identity_gate_version:GATE,post_text:clean(p.text),final_text_hash:clean(evidence.final_text_hash)};
    const rv=await review(url,payload);
    const pass=rv.http===200&&rv.identity_gate_decision==='PASS'&&rv.final_text_hash===hash&&p.channelId===PERSONAL;
    let containment:any=null;
    if(!pass){containment=await deletePost(token,p.id);if(d?.run_date&&d?.channel){await db.from('powerhouse_channel_decisions').update({state:'blocked',delivery_evidence:{...(d.delivery_evidence||{}),p0_identity_containment:{at:new Date().toISOString(),post_id:p.id,due_at:p.dueAt,text_hash:hash,decision:'BLOCKED_IDENTITY_GATE',violations:rv.violations||[],delete_result:containment}},updated_at:new Date().toISOString()}).eq('run_date',d.run_date).eq('channel',d.channel);await obligationState(db,d.run_date,d.channel,'BLOCKED',{publisher:VERSION,containment},'BLOCKED_IDENTITY_GATE');}}
    const recordId=`personal-buffer-audit:${p.id}`;
    await db.from('brain_records').upsert({tenant_id:'canonical',record_id:recordId,record_type:'Verification',record_kind:'verification',subject_id:p.id,status:pass?'VERIFIED':(containment?.ok?'CONTAINED':'BLOCKED'),observed_at:new Date().toISOString(),executed:true,verified:pass||!!containment?.ok,result:{decision:pass?'PASS':(containment?.ok?'REMOVED_UNSAFE_SCHEDULE':'CONTAINMENT_FAILED'),identity_gate_version:GATE,identity_contract:CONTRACT,provider:'buffer',post_id:p.id,due_at:p.dueAt,status:p.status,channel_id:p.channelId,text_hash:hash,excerpt:clean(p.text).slice(0,180),review_http:rv.http,violations:rv.violations||[],containment},payload:{run_date:d?.run_date||null,canonical_channel:d?.channel||null},idempotency_key:recordId,source_revision:VERSION,stored_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'tenant_id,record_id'});
    results.push({post_id:p.id,due_at:p.dueAt,status:p.status,text_hash:hash,pass,containment,violations:rv.violations||[]});
  }
  return results;
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({ok:false,error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL')||'',key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!key)return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const tokenExpected=clean((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data);
  if(!tokenExpected||req.headers.get('x-powerhouse-token')!==tokenExpected)return json({ok:false,error:'UNAUTHORIZED'},401);
  let body:any={};try{body=await req.json()}catch{};const runDate=clean(body.runDate)||today();const mode=clean(body.mode)||'run';
  const {data:integration}=await db.from('bg_integrations').select('token').eq('integration','buffer').eq('status','actief').single();
  if(!integration?.token)return json({ok:false,error:'BUFFER_TOKEN_MISSING'},503);
  const bufferToken=integration.token;
  const audit=await auditPersonalQueue(db,url,bufferToken);
  if(mode==='audit_only')return json({ok:true,runDate,identity_gate_version:GATE,personal_queue_audit:audit});

  const {data:rows,error:rowError}=await db.from('powerhouse_channel_decisions').select('channel,scheduled_for,delivery_evidence').eq('run_date',runDate).eq('decision','publish').eq('state','content_ready').in('channel',['linkedin_personal','linkedin_company','instagram_company']).order('priority',{ascending:false});
  if(rowError)return json({ok:false,error:'DECISION_READ:'+rowError.message},500);
  const out:any[]=[];
  for(const d of rows||[]){
    const {data:art,error:artifactReadError}=await db.from('powerhouse_content_artifacts').select('body,generation_evidence,status').eq('run_date',runDate).eq('channel',d.channel).maybeSingle();
    if(artifactReadError){
      const reason='ARTIFACT_READ:'+artifactReadError.message;
      await db.from('powerhouse_channel_decisions').update({state:'failed',delivery_evidence:{...(d.delivery_evidence||{}),publisher:VERSION,error:reason},updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',d.channel);
      await obligationState(db,runDate,d.channel,'FAILED',{publisher:VERSION},reason);
      out.push({channel:d.channel,status:'failed',reason});
      continue;
    }
    if(!art?.body){
      const reason='ARTIFACT_MISSING';
      await db.from('powerhouse_channel_decisions').update({state:'blocked',delivery_evidence:{...(d.delivery_evidence||{}),publisher:VERSION,blocked_reason:reason},updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',d.channel);
      await obligationState(db,runDate,d.channel,'BLOCKED',{publisher:VERSION},reason);
      out.push({channel:d.channel,status:'blocked',reason});
      continue;
    }
    const hash=await digest(clean(art.body)); const hook=clean(art.generation_evidence?.hook_type)||'Probleem';

    if(d.channel==='instagram_company'){
      const media=instagramMedia(d,art);
      if(!media.assetUrl||!media.mediaKind||!media.publicHttps||!media.miraVerified){
        const reason='INSTAGRAM_MEDIA_REQUIRED';
        const evidence={...(d.delivery_evidence||{}),provider:'buffer',pre_publish_gate:'blocked',mira_gate:'blocked',media_gate:'blocked',assetUrl:media.assetUrl||null,mediaKind:media.mediaKind||null,mira_verified:media.miraVerified,public_https:media.publicHttps,channel_id:INSTAGRAM,blocked_reason:reason};
        await db.from('powerhouse_channel_decisions').update({state:'blocked',delivery_evidence:evidence,updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',d.channel);
        await obligationState(db,runDate,d.channel,'BLOCKED',{publisher:VERSION,...evidence},reason);
        out.push({channel:d.channel,status:'blocked',reason});
        continue;
      }
      const due=new Date(d.scheduled_for); const future=due.getTime()>Date.now()+120000;
      let assetInput='';
      try{assetInput=bufferAssetsInput(media);}catch(e:any){
        await db.from('powerhouse_channel_decisions').update({state:'blocked',delivery_evidence:{...(d.delivery_evidence||{}),provider:'buffer',blocked_reason:e.message},updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',d.channel);
        await obligationState(db,runDate,d.channel,'BLOCKED',{publisher:VERSION,assetUrl:media.assetUrl,mediaKind:media.mediaKind},e.message);
        out.push({channel:d.channel,status:'blocked',reason:e.message}); continue;
      }
      const input=`text: "${esc(art.body)}", channelId: "${INSTAGRAM}", schedulingType: automatic, mode: ${future?'customScheduled':'shareNow'}${future?`, dueAt: "${due.toISOString()}"`:''}, ${assetInput}`;
      const created=await bufferGql(bufferToken,`mutation { createPost(input:{${input}}) { ... on PostActionSuccess { post { id text dueAt status channelId assets { id mimeType source } } } ... on MutationError { message } } }`);
      const p=created?.createPost?.post;
      if(!p?.id){const err=created?.createPost?.message||'BUFFER_CREATE_FAILED';await db.from('powerhouse_channel_decisions').update({state:'failed',delivery_evidence:{...(d.delivery_evidence||{}),provider:'buffer',error:err,assetUrl:media.assetUrl,mediaKind:media.mediaKind},updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',d.channel);await obligationState(db,runDate,d.channel,'FAILED',{publisher:VERSION,provider:'buffer',assetUrl:media.assetUrl},err);out.push({channel:d.channel,status:'failed',error:err});continue;}
      const rb=await getPost(bufferToken,p.id);
      const readbackOk=!!rb&&rb.id===p.id&&rb.channelId===INSTAGRAM&&clean(rb.text)===clean(art.body)&&Array.isArray(rb.assets)&&rb.assets.length>0&&(!future||new Date(rb.dueAt).getTime()===due.getTime());
      if(!readbackOk){const containment=await deletePost(bufferToken,p.id);await db.from('powerhouse_channel_decisions').update({state:'blocked',delivery_ref:p.id,delivery_evidence:{...(d.delivery_evidence||{}),provider:'buffer',post_buffer_readback:'mismatch',provider_readback:rb,assetUrl:media.assetUrl,mediaKind:media.mediaKind,containment},updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',d.channel);await obligationState(db,runDate,d.channel,'BLOCKED',{publisher:VERSION,post_id:p.id,provider_readback:rb,containment},'INSTAGRAM_PROVIDER_READBACK_MISMATCH',p.id);out.push({channel:d.channel,status:'blocked_readback_mismatch',post_id:p.id,containment});continue;}
      await db.from('powerhouse_channel_decisions').update({state:rb.status==='sent'?'published':'scheduled',delivery_ref:p.id,delivery_evidence:{...(d.delivery_evidence||{}),provider:'buffer',post_id:p.id,status:rb.status,due_at:rb.dueAt||d.scheduled_for,pre_publish_gate:'passed',mira_gate:'passed',media_gate:'passed',assetUrl:media.assetUrl,mediaKind:media.mediaKind,provider_immediate_readback:{id:rb.id,channel_id:rb.channelId,text_hash:hash,status:rb.status,due_at:rb.dueAt,assets:rb.assets}},updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',d.channel);
      await db.from('powerhouse_content_artifacts').update({status:rb.status==='sent'?'published':'scheduled',updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',d.channel);
      await obligationState(db,runDate,d.channel,rb.status==='sent'?'PUBLISHED':'DISPATCHED',{publisher:VERSION,provider:'buffer',post_id:p.id,channel_id:INSTAGRAM,assetUrl:media.assetUrl,mediaKind:media.mediaKind,provider_readback:rb},null,p.id);
      out.push({channel:d.channel,status:rb.status,post_id:p.id,readback:true,media_readback:true});
      continue;
    }

    let reviewPayload:any={channel:ids[d.channel],post_text:art.body,hook_type:hook};
    if(d.channel==='linkedin_personal'){
      const ev=d.delivery_evidence?.identity_gate_evidence||art.generation_evidence?.identity_gate_evidence||{};
      reviewPayload={...ev,channel_id:PERSONAL,channel_kind:'linkedin_personal',identity_contract:CONTRACT,identity_gate_version:GATE,post_text:art.body,hook_type:hook,final_text_hash:clean(ev.final_text_hash)};
    }
    const rv=await review(url,reviewPayload);
    if(rv.http!==200||rv.can_publish!==true||rv.identity_gate_decision!=='PASS'||rv.final_text_hash!==hash){await db.from('powerhouse_channel_decisions').update({state:'blocked',delivery_evidence:{...(d.delivery_evidence||{}),pre_publish_gate:'blocked',identity_gate_version:GATE,final_text_hash:hash,violations:rv.violations||[],review_status:rv.http},updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',d.channel);await obligationState(db,runDate,d.channel,'BLOCKED',{publisher:VERSION,violations:rv.violations||[]},'PRE_PUBLISH_GATE_BLOCKED');out.push({channel:d.channel,status:'blocked',violations:rv.violations||[]});continue;}
    const due=new Date(d.scheduled_for);const future=due.getTime()>Date.now()+120000;
    const input=`text: "${esc(art.body)}", channelId: "${ids[d.channel]}", schedulingType: automatic, mode: ${future?'customScheduled':'shareNow'}${future?`, dueAt: "${due.toISOString()}"`:''}`;
    const created=await bufferGql(bufferToken,`mutation { createPost(input:{${input}}) { ... on PostActionSuccess { post { id text dueAt status channelId } } ... on MutationError { message } } }`);const p=created?.createPost?.post;
    if(!p?.id){const err=created?.createPost?.message||'BUFFER_CREATE_FAILED';await db.from('powerhouse_channel_decisions').update({state:'failed',delivery_evidence:{...(d.delivery_evidence||{}),provider:'buffer',error:err},updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',d.channel);await obligationState(db,runDate,d.channel,'FAILED',{publisher:VERSION,provider:'buffer'},err);out.push({channel:d.channel,status:'failed'});continue;}
    const rb=await getPost(bufferToken,p.id);const readbackOk=!!rb&&rb.id===p.id&&rb.channelId===ids[d.channel]&&clean(rb.text)===clean(art.body)&&(!future||new Date(rb.dueAt).getTime()===due.getTime());
    if(!readbackOk){const containment=await deletePost(bufferToken,p.id);await db.from('powerhouse_channel_decisions').update({state:'blocked',delivery_ref:p.id,delivery_evidence:{...(d.delivery_evidence||{}),provider:'buffer',post_buffer_readback:'mismatch',identity_gate_version:GATE,reviewed_text_hash:hash,provider_readback:rb,containment},updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',d.channel);await obligationState(db,runDate,d.channel,'BLOCKED',{publisher:VERSION,post_id:p.id,provider_readback:rb,containment},'PROVIDER_READBACK_MISMATCH',p.id);out.push({channel:d.channel,status:'blocked_readback_mismatch',post_id:p.id,containment});continue;}
    const gateEvidence=d.channel==='linkedin_personal'?{identity_gate_version:GATE,identity_contract:CONTRACT,identity_gate_decision:'PASS',final_text_hash:hash}:undefined;
    await db.from('powerhouse_channel_decisions').update({state:rb.status==='sent'?'published':'scheduled',delivery_ref:p.id,delivery_evidence:{...(d.delivery_evidence||{}),provider:'buffer',post_id:p.id,status:rb.status,due_at:rb.dueAt||d.scheduled_for,pre_publish_gate:'passed',provider_immediate_readback:{id:rb.id,channel_id:rb.channelId,text_hash:hash,status:rb.status,due_at:rb.dueAt},identity_gate_evidence:gateEvidence||d.delivery_evidence?.identity_gate_evidence},updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',d.channel);
    await db.from('powerhouse_content_artifacts').update({status:rb.status==='sent'?'published':'scheduled',updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',d.channel);
    await obligationState(db,runDate,d.channel,rb.status==='sent'?'PUBLISHED':'DISPATCHED',{publisher:VERSION,provider:'buffer',post_id:p.id,channel_id:ids[d.channel],provider_readback:rb},null,p.id);
    out.push({channel:d.channel,status:rb.status,post_id:p.id,readback:true});
  }
  return json({ok:true,runDate,version:VERSION,identity_gate_version:GATE,personal_queue_audit:audit,results:out});
});
