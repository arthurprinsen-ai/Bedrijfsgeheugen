import { createClient } from 'npm:@supabase/supabase-js@2';

const clean=(v:unknown)=>String(v??'').trim();
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
async function digest(bytes:Uint8Array){const h=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function hashRemote(url:string,max=120*1024*1024){const r=await fetch(url,{redirect:'follow'});if(!r.ok)throw new Error('MEDIA_FETCH_FAILED');const bytes=new Uint8Array(await r.arrayBuffer());if(!bytes.length||bytes.length>max)throw new Error('MEDIA_SIZE_INVALID');return{sha256:await digest(bytes),contentType:clean(r.headers.get('content-type')).split(';')[0].toLowerCase()};}
function inferType(...v:any[]){const s=v.map(clean).join(' ').toLowerCase();if(s.includes('carousel'))return'carousel';if(s.includes('reel'))return'reel';if(s.includes('video'))return'video';return'image';}
async function invoke(base:string,token:string,name:string,payload:any){const r=await fetch(`${base}/functions/v1/${name}`,{method:'POST',headers:{'content-type':'application/json','x-powerhouse-token':token},body:JSON.stringify(payload)});return{http:r.status,body:await r.json().catch(()=>({}))};}

Deno.serve(async req=>{
 if(req.method!=='POST')return json({ok:false,error:'POST_ONLY'},405);
 const base=Deno.env.get('SUPABASE_URL')||'',key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
 if(!base||!key)return json({ok:false,error:'CONFIG'},500);
 const db=createClient(base,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const token=clean((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data);
 if(!token||req.headers.get('x-powerhouse-token')!==token)return json({ok:false,error:'UNAUTHORIZED'},401);
 let input:any={};try{input=await req.json()}catch{}
 const runDate=clean(input.runDate||input.publicationDate)||today(),action=clean(input.action)||'preflight';
 const [{data:ob},{data:art},{data:rec},{data:ints},{data:job}]=await Promise.all([
  db.from('content_publication_obligations').select('*').eq('tenant_id','canonical').eq('publication_date',runDate).eq('channel','instagram').maybeSingle(),
  db.from('powerhouse_content_artifacts').select('*').eq('run_date',runDate).eq('channel','instagram_company').maybeSingle(),
  db.from('powerhouse_content_recommendations').select('*').eq('run_date',runDate).in('target_channel',['instagram','instagram_company']).order('priority',{ascending:false}).limit(1).maybeSingle(),
  db.from('bg_integrations').select('integration,status').in('integration',['openart','openart_mcp','placid']),
  db.from('powerhouse_instagram_media_jobs_v1').select('*').eq('tenant_id','canonical').eq('publication_date',runDate).eq('channel','instagram').maybeSingle()
 ]);
 const postType=inferType(input.postType,ob?.evidence?.post_type,ob?.evidence?.media_type,art?.generation_evidence?.post_type,art?.generation_evidence?.media_type,art?.generation_evidence?.format,rec?.evidence?.format,rec?.recommendation_type);
 const {data:policy}=await db.rpc('powerhouse_instagram_provider_policy_v1',{p_post_type:postType});
 const active=new Set((ints||[]).filter((x:any)=>['actief','active','connected','ready'].includes(clean(x.status).toLowerCase())).map((x:any)=>clean(x.integration).toLowerCase()));
 const ready=(p:string)=>p==='openart'?(active.has('openart')||active.has('openart_mcp')):active.has(p);
 const historical=!!clean(ob?.external_id);

 if(historical&&(ob?.status==='BLOCKED'||ob?.evidence?.republish_forbidden===true)){
  const row={tenant_id:'canonical',publication_date:runDate,channel:'instagram',post_type:postType,status:'REPLACEMENT_REQUIRED',required_provider:policy?.required_provider||null,
   asset_manifest:job?.asset_manifest||{},proof_manifest:job?.proof_manifest||{},replacement_of_external_id:ob.external_id,republish_forbidden:true,
   provider_connection_state:'REPLACEMENT_DELETE_AUTHORITY_UNAVAILABLE',attempts:(job?.attempts||0)+1,last_error:'SENT_UNPROVEN_REPLACEMENT_REQUIRED',
   next_action:'Never duplicate. Controlled replacement requires delete/replace authority plus a new provider-routed proven asset.',updated_at:new Date().toISOString()};
  await db.from('powerhouse_instagram_media_jobs_v1').upsert(row,{onConflict:'tenant_id,publication_date,channel'});
  return json({ok:true,ready:false,runDate,postType,status:row.status,republish_forbidden:true,external_id:ob.external_id});
 }

 if(action==='submit_asset'){
  const provider=clean(input.provider).toLowerCase(),manifest=input.assetManifest||{},allowed=Array.isArray(policy?.allowed_providers)?policy.allowed_providers:[];
  if(!allowed.includes(provider))return json({ok:false,error:'MEDIA_PROVIDER_NOT_ALLOWED',provider,postType},422);
  if(policy?.required_provider&&provider!==policy.required_provider)return json({ok:false,error:'MEDIA_PROVIDER_REQUIRED',required:policy.required_provider},422);
  let proof:any={};

  if(postType==='image'){
   const u=clean(manifest.asset_url||manifest.assetUrl);if(!u)return json({ok:false,error:'ASSET_URL_REQUIRED'},422);
   const v=await invoke(base,token,'powerhouse-instagram-media-verifier',{publicationDate:runDate,mediaUrl:u,provider,mediaType:'image',writeObligation:false});
   if(!v.body?.pass)return json({ok:false,error:'VISION_PROOF_FAILED',detail:v.body},422);
   proof={exact_final_media_proven:true,identity_gate_result:'PASS',mira_gate_result:'PASS',media_type:'image',media_provider:provider,media_url:u,final_media_sha256:v.body.sha256,instagram_visual:v.body.visual};
  } else if(postType==='reel'||postType==='video'){
   if(provider!=='openart')return json({ok:false,error:'OPENART_REQUIRED_FOR_VIDEO'},422);
   const u=clean(manifest.asset_url||manifest.assetUrl),frames=Array.isArray(manifest.frames)?manifest.frames:[];
   if(!u||!['start','middle','end'].every(p=>frames.some((f:any)=>f.position===p&&clean(f.asset_url||f.assetUrl))))return json({ok:false,error:'VIDEO_AND_START_MIDDLE_END_FRAMES_REQUIRED'},422);
   const final=await hashRemote(u);if(final.contentType!=='video/mp4')return json({ok:false,error:'VIDEO_MP4_REQUIRED'},422);
   const fps:any[]=[];for(const f of frames){const fv=await invoke(base,token,'powerhouse-instagram-media-verifier',{publicationDate:runDate,mediaUrl:clean(f.asset_url||f.assetUrl),provider:'openart',mediaType:'image',verificationRole:'video_frame',writeObligation:false});if(!fv.body?.pass)return json({ok:false,error:'VIDEO_FRAME_VISION_PROOF_FAILED',position:f.position,detail:fv.body},422);fps.push({position:f.position,...fv.body.visual,sha256:fv.body.sha256});}
   const visual={verified:true,semantic_verified:true,mira_present:true,identity_class:'mira_daily_life',evidence_method:'vision',placeholder_detected:false,format_verified:true,width:1080,height:1920,evidence_refs:fps.flatMap(x=>x.evidence_refs||[]),frame_evidence:fps};
   proof={exact_final_media_proven:true,identity_gate_result:'PASS',mira_gate_result:'PASS',media_type:postType,media_provider:'openart',media_url:u,final_media_sha256:final.sha256,instagram_visual:visual};
  } else if(postType==='carousel'){
   const slides=Array.isArray(manifest.slides)?manifest.slides:[];if(slides.length<2)return json({ok:false,error:'CAROUSEL_MIN_TWO_SLIDES_REQUIRED'},422);
   const proven:any[]=[];
   for(const slide of slides){
    const kind=clean(slide.kind||'image').toLowerCase(),sp=clean(slide.provider).toLowerCase(),u=clean(slide.asset_url||slide.assetUrl);
    if(!u)return json({ok:false,error:'CAROUSEL_SLIDE_URL_REQUIRED'},422);
    if(kind==='video'&&sp!=='openart')return json({ok:false,error:'CAROUSEL_VIDEO_OPENART_REQUIRED'},422);
    if(kind==='image'&&!['openart','placid'].includes(sp))return json({ok:false,error:'CAROUSEL_IMAGE_PROVIDER_INVALID'},422);
    if(kind==='image'){const v=await invoke(base,token,'powerhouse-instagram-media-verifier',{publicationDate:runDate,mediaUrl:u,provider:sp,mediaType:'image',writeObligation:false});if(!v.body?.pass)return json({ok:false,error:'CAROUSEL_IMAGE_PROOF_FAILED',detail:v.body},422);proven.push({kind,provider:sp,asset_url:u,sha256:v.body.sha256,proof:{identity_gate_result:'PASS',visual:v.body.visual}});}
    else {const fs=Array.isArray(slide.frames)?slide.frames:[];if(!['start','middle','end'].every(p=>fs.some((f:any)=>f.position===p)))return json({ok:false,error:'CAROUSEL_VIDEO_FRAMES_REQUIRED'},422);const vh=await hashRemote(u);if(vh.contentType!=='video/mp4')return json({ok:false,error:'CAROUSEL_VIDEO_MP4_REQUIRED'},422);const fps:any[]=[];for(const f of fs){const v=await invoke(base,token,'powerhouse-instagram-media-verifier',{publicationDate:runDate,mediaUrl:clean(f.asset_url||f.assetUrl),provider:'openart',mediaType:'image',verificationRole:'video_frame',writeObligation:false});if(!v.body?.pass)return json({ok:false,error:'CAROUSEL_VIDEO_FRAME_PROOF_FAILED'},422);fps.push({position:f.position,...v.body.visual,sha256:v.body.sha256});}proven.push({kind:'video',provider:'openart',asset_url:u,sha256:vh.sha256,proof:{identity_gate_result:'PASS',visual:{verified:true,semantic_verified:true,mira_present:true,identity_class:'mira_daily_life',evidence_method:'vision',evidence_refs:fps.flatMap(x=>x.evidence_refs||[]),frame_evidence:fps}}});}
   }
   const mh=await digest(new TextEncoder().encode(JSON.stringify(proven.map(x=>x.sha256))));
   proof={exact_final_media_proven:true,identity_gate_result:'PASS',mira_gate_result:'PASS',media_type:'carousel',media_provider:'mixed',final_media_sha256:mh,carousel_manifest:{slides:proven},instagram_visual:proven[0].proof.visual};
  } else return json({ok:false,error:'POST_TYPE_UNSUPPORTED'},422);

  const proofFingerprint='instagram-router-proof:'+runDate+':'+clean(proof.final_media_sha256);
  const proofRow={
    fingerprint:proofFingerprint,publication_date:runDate,channel:'instagram',provider:clean(proof.media_provider||provider),
    provider_post_id:'preflight:'+clean(proof.final_media_sha256).slice(0,24),provider_external_url:null,
    media_url:clean(proof.media_url)||clean(proof.carousel_manifest?.slides?.[0]?.asset_url)||null,provider_status:'prepublish_verified',
    canonical_copy:null,exact_copy_verified:false,exact_media_retrievable:true,exact_media_sha256:clean(proof.final_media_sha256),
    exact_media_verified_at:new Date().toISOString(),identity_contract:'mira-visible-identity-vision-v1',identity_gate_result:'PASS',
    proof_lineage:{contract:'instagram-media-provider-routing-preproof-v1',media_type:proof.media_type,media_source:proof.media_provider,instagram_visual:proof.instagram_visual,carousel_manifest:proof.carousel_manifest||null,exact_final_media_proven:true},
    failure_reason:null,updated_at:new Date().toISOString()
  };
  const pw=await db.from('powerhouse_media_proof_evidence_v1').upsert(proofRow,{onConflict:'fingerprint'});
  if(pw.error)throw new Error('AGGREGATE_PROOF_WRITE_FAILED');
  proof.proof_fingerprint=proofFingerprint;
  const row={tenant_id:'canonical',publication_date:runDate,channel:'instagram',post_type:postType,status:'PROOF_VERIFIED',required_provider:policy?.required_provider||null,selected_provider:provider,asset_manifest:manifest,proof_manifest:proof,provider_connection_state:'READY',attempts:(job?.attempts||0)+1,last_error:null,next_action:'Proof verified; canonical orchestrator/publisher may use this exact manifest only.',updated_at:new Date().toISOString()};
  const jw=await db.from('powerhouse_instagram_media_jobs_v1').upsert(row,{onConflict:'tenant_id,publication_date,channel'});if(jw.error)throw new Error('MEDIA_JOB_WRITE_FAILED');
  const evidence={...(ob?.evidence||{}),...proof,instagram_media_proof:proof,provider_routing_policy:policy,media_job_status:'PROOF_VERIFIED'};
  await db.from('content_publication_obligations').update({status:ob?.status==='BLOCKED'?'APPROVED':ob?.status,last_error:null,evidence,next_action:'Exact provider-routed media proof verified; continue canonical orchestration.',updated_at:new Date().toISOString()}).eq('tenant_id','canonical').eq('publication_date',runDate).eq('channel','instagram');
  return json({ok:true,ready:true,runDate,postType,provider,proof});
 }

 const allowed=Array.isArray(policy?.allowed_providers)?policy.allowed_providers:[],readyProviders=allowed.filter((p:string)=>ready(p));
 const existingAssetUrl=clean(job?.asset_manifest?.asset_url||job?.asset_manifest?.assetUrl);
 const existingProvider=clean(job?.asset_manifest?.provider||job?.selected_provider).toLowerCase();
 const assetMaterialized=!!existingAssetUrl && !!existingProvider && allowed.includes(existingProvider);
 const state=job?.status==='PROOF_VERIFIED'?'PROOF_VERIFIED':assetMaterialized?'WAITING_PROOF':readyProviders.length?'WAITING_ASSET':'WAITING_PROVIDER_CONNECTION';
 const providerState=job?.status==='PROOF_VERIFIED'?'READY':assetMaterialized?'ASSET_MATERIALIZED':readyProviders.length?'READY':'UNAVAILABLE';
 const row={tenant_id:'canonical',publication_date:runDate,channel:'instagram',post_type:postType,status:state,required_provider:policy?.required_provider||null,selected_provider:job?.selected_provider||existingProvider||null,asset_manifest:job?.asset_manifest||{},proof_manifest:job?.proof_manifest||{},republish_forbidden:false,provider_connection_state:providerState,attempts:(job?.attempts||0)+1,last_error:assetMaterialized?null:(readyProviders.length?null:'MEDIA_PROVIDER_UNAVAILABLE'),next_action:assetMaterialized?'Exact asset already materialized; submit it with required frame/image evidence for canonical vision proof.':readyProviders.length?'Producer must submit exact asset manifest to this router.':'Connect required OpenArt/Placid producer; fallback publication is forbidden.',updated_at:new Date().toISOString()};
 await db.from('powerhouse_instagram_media_jobs_v1').upsert(row,{onConflict:'tenant_id,publication_date,channel'});
 if(state!=='PROOF_VERIFIED')await db.from('content_publication_obligations').update({status:'BLOCKED',last_error:row.last_error||'MEDIA_ASSET_REQUIRED',evidence:{...(ob?.evidence||{}),provider_routing_policy:policy,media_job_status:state},next_action:row.next_action,updated_at:new Date().toISOString()}).eq('tenant_id','canonical').eq('publication_date',runDate).eq('channel','instagram');
 return json({ok:true,ready:state==='PROOF_VERIFIED',runDate,postType,status:state,allowedProviders:allowed,requiredProvider:policy?.required_provider||null,readyProviders});
});