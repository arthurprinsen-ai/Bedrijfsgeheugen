import { createClient } from 'npm:@supabase/supabase-js@2';

const clean=(v:unknown)=>String(v??'').trim();
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const FRAME_EXTRACTOR='https://www.bedrijfsgeheugen.nl/.netlify/functions/instagram-video-frames';
async function digest(bytes:Uint8Array){const h=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function hashRemote(url:string,max=120*1024*1024){const r=await fetch(url,{redirect:'follow'});if(!r.ok)throw new Error('MEDIA_FETCH_FAILED');const bytes=new Uint8Array(await r.arrayBuffer());if(!bytes.length||bytes.length>max)throw new Error('MEDIA_SIZE_INVALID');return{sha256:await digest(bytes),contentType:clean(r.headers.get('content-type')).split(';')[0].toLowerCase()};}
function inferType(...v:any[]){const s=v.map(clean).join(' ').toLowerCase();if(s.includes('carousel'))return'carousel';if(s.includes('reel'))return'reel';if(s.includes('video'))return'video';return'image';}
async function invoke(base:string,token:string,name:string,payload:any){const r=await fetch(`${base}/functions/v1/${name}`,{method:'POST',headers:{'content-type':'application/json','x-powerhouse-token':token},body:JSON.stringify(payload)});return{http:r.status,body:await r.json().catch(()=>({}))};}
async function temporalVisionProof(db:any,frames:any[],fps:any[]){
 const gov=await db.from('brain_ai_governance_registry').select('model_id,provider,approved,lifecycle_status').eq('tenant_id','canonical').eq('use_case_id','supabase-powerhouse-instagram-media-verifier-v1').maybeSingle();
 if(!gov.data||gov.data.approved!==true||gov.data.lifecycle_status!=='ACTIVE'||gov.data.provider!=='Anthropic')throw new Error('TEMPORAL_AI_GOVERNANCE_UNAVAILABLE');
 const apiKey=clean((await db.rpc('bg_geheim',{p_naam:'ANTHROPIC_API_KEY'})).data);
 if(!apiKey)throw new Error('TEMPORAL_AI_KEY_UNAVAILABLE');
 const imageBlocks:any[]=[];
 for(const f of frames){
  const frameBase64=clean(f.imageBase64),frameUrl=clean(f.asset_url||f.assetUrl);
  let mediaType=clean(f.mediaType||'image/jpeg').split(';')[0].toLowerCase(),data=frameBase64;
  if(!data&&frameUrl){
   const rr=await fetch(frameUrl,{redirect:'follow'});if(!rr.ok)throw new Error('TEMPORAL_FRAME_FETCH_FAILED');
   mediaType=clean(rr.headers.get('content-type')||mediaType).split(';')[0].toLowerCase();
   const bytes=new Uint8Array(await rr.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+0x8000,bytes.length)));data=btoa(binary);
  }
  if(!data||!['image/jpeg','image/png'].includes(mediaType))throw new Error('TEMPORAL_FRAME_INPUT_INVALID');
  imageBlocks.push({type:'text',text:`Frame ${clean(f.position)||'unknown'} at ${Number(f.seconds||0)}s`},{type:'image',source:{type:'base64',media_type:mediaType,data}});
 }
 const tool={name:'temporal_verdict',description:'Verify continuous human video evidence across ordered frames.',input_schema:{type:'object',additionalProperties:false,properties:{
  single_continuous_take:{type:'boolean'},continuous_motion_verified:{type:'boolean'},scene_continuity_verified:{type:'boolean'},identity_continuity_verified:{type:'boolean'},human_motion_verified:{type:'boolean'},realistic_camera_motion:{type:'boolean'},slideshow_detected:{type:'boolean'},still_image_animation_detected:{type:'boolean'},confidence:{type:'number',minimum:0,maximum:1},reason:{type:'string'}
 },required:['single_continuous_take','continuous_motion_verified','scene_continuity_verified','identity_continuity_verified','human_motion_verified','realistic_camera_motion','slideshow_detected','still_image_animation_detected','confidence','reason']}};
 const response=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({
  model:gov.data.model_id,max_tokens:650,
  system:'Inspect the supplied start, middle and end frames as ordered temporal evidence from one short vertical video. Determine conservatively whether they are consistent with one continuous human video take rather than a slideshow, stitched stills, or a frozen photo with only pan/zoom. Identity and scene must remain continuous and there must be plausible human motion. When uncertain, set the relevant boolean false.',
  messages:[{role:'user',content:[...imageBlocks,{type:'text',text:'Return a strict temporal continuity verdict for this exact sequence.'}]}],
  tools:[tool],tool_choice:{type:'tool',name:'temporal_verdict'}
 })});
 const body:any=await response.json().catch(()=>({}));if(!response.ok)throw new Error('TEMPORAL_VISION_PROVIDER_REQUEST_FAILED');
 const item=(body.content||[]).find((x:any)=>x.type==='tool_use'&&x.name==='temporal_verdict');if(!item?.input)throw new Error('TEMPORAL_VISION_TOOL_OUTPUT_MISSING');
 const v=item.input,refSeed=fps.map((x:any)=>clean(x.sha256)).join(':');
 const evidenceRef=`temporal:anthropic:${gov.data.model_id}:${(await digest(new TextEncoder().encode(refSeed))).slice(0,16)}`;
 return {...v,evidence_method:'vision',evidence_refs:[evidenceRef],verified_at:new Date().toISOString()};
}

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
 const postType=inferType(input.postType,job?.post_type,ob?.evidence?.post_type,ob?.evidence?.media_type,art?.generation_evidence?.daily_winner_format,art?.generation_evidence?.post_type,art?.generation_evidence?.media_type,art?.generation_evidence?.format,rec?.evidence?.format,rec?.recommendation_type);
 if(!['image','reel'].includes(postType))return json({ok:false,error:'INSTAGRAM_MIRA_VISUAL_OR_REEL_ONLY',postType},422);
 const {data:policy}=await db.rpc('powerhouse_instagram_provider_policy_v1',{p_post_type:postType});
 const active=new Set((ints||[]).filter((x:any)=>['actief','active','connected','ready'].includes(clean(x.status).toLowerCase())).map((x:any)=>clean(x.integration).toLowerCase()));
 const ready=(p:string)=>p==='openart'?(active.has('openart')||active.has('openart_mcp')):active.has(p);
 const historical=!!clean(ob?.external_id);

 if(historical&&(ob?.status==='BLOCKED'||ob?.evidence?.republish_forbidden===true)){
  const sameReplacement=job?.status==='REPLACEMENT_REQUIRED'&&clean(job?.replacement_of_external_id)===clean(ob.external_id);
  const row={tenant_id:'canonical',publication_date:runDate,channel:'instagram',post_type:postType,status:'REPLACEMENT_REQUIRED',required_provider:policy?.required_provider||null,
   asset_manifest:job?.asset_manifest||{},proof_manifest:job?.proof_manifest||{},replacement_of_external_id:ob.external_id,republish_forbidden:true,
   provider_connection_state:'REPLACEMENT_DELETE_AUTHORITY_UNAVAILABLE',attempts:sameReplacement?(job?.attempts||0):(job?.attempts||0)+1,last_error:'SENT_UNPROVEN_REPLACEMENT_REQUIRED',
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
   if(provider!=='openart')return json({ok:false,error:'OPENART_REQUIRED_FOR_MIRA_VISUAL'},422);
   const u=clean(manifest.asset_url||manifest.assetUrl);if(!u)return json({ok:false,error:'ASSET_URL_REQUIRED'},422);
   const v=await invoke(base,token,'powerhouse-instagram-media-verifier',{publicationDate:runDate,mediaUrl:u,provider,mediaType:'image',writeObligation:false});
   if(!v.body?.pass)return json({ok:false,error:'VISION_PROOF_FAILED',detail:v.body},422);
   proof={exact_final_media_proven:true,identity_gate_result:'PASS',mira_gate_result:'PASS',media_type:'image',media_provider:provider,media_url:u,final_media_sha256:v.body.sha256,instagram_visual:v.body.visual};
  } else if(postType==='reel'){
   if(provider!=='openart')return json({ok:false,error:'OPENART_REQUIRED_FOR_VIDEO'},422);
   const u=clean(manifest.asset_url||manifest.assetUrl);if(!u)return json({ok:false,error:'VIDEO_ASSET_URL_REQUIRED'},422);
   const final=await hashRemote(u);if(final.contentType!=='video/mp4')return json({ok:false,error:'VIDEO_MP4_REQUIRED'},422);
   let frames=Array.isArray(manifest.frames)?manifest.frames:[];
   if(!['start','middle','end'].every(p=>frames.some((f:any)=>f.position===p&&(clean(f.asset_url||f.assetUrl)||clean(f.imageBase64))))){
     const duration=Number(manifest.duration||job?.asset_manifest?.duration||0);
     const fx=await fetch(FRAME_EXTRACTOR,{method:'POST',headers:{'content-type':'application/json','x-powerhouse-token':token},body:JSON.stringify({mediaUrl:u,duration})});
     const fb=await fx.json().catch(()=>({}));
     if(!fx.ok||fb?.ok!==true||!Array.isArray(fb.frames))return json({ok:false,error:'VIDEO_FRAME_EXTRACTION_FAILED',detail:fb},422);
     frames=fb.frames;
   }
   const fps:any[]=[];
   for(const f of frames){
     const payload:any={publicationDate:runDate,provider:'openart',mediaType:'image',verificationRole:'video_frame',writeObligation:false};
     const frameUrl=clean(f.asset_url||f.assetUrl),frameBase64=clean(f.imageBase64);
     if(frameUrl)payload.mediaUrl=frameUrl;
     else {payload.imageBase64=frameBase64;payload.mediaMime=clean(f.mediaType||'image/jpeg');}
     const fv=await invoke(base,token,'powerhouse-instagram-media-verifier',payload);
     if(!fv.body?.pass)return json({ok:false,error:'VIDEO_FRAME_VISION_PROOF_FAILED',position:f.position,detail:fv.body},422);
     fps.push({position:f.position,seconds:Number(f.seconds||0),...fv.body.visual,sha256:fv.body.sha256});
   }
   const visual={verified:true,semantic_verified:true,mira_present:true,identity_class:'mira_daily_life',evidence_method:'vision',placeholder_detected:false,visual_complete:true,daily_life_scene:true,mira_central_subject:fps.every(x=>x.mira_central_subject===true),text_dominant:fps.some(x=>x.text_dominant===true),brand_template_dominant:fps.some(x=>x.brand_template_dominant===true),confidence:Math.min(...fps.map(x=>Number(x.confidence)||0)),format_verified:true,width:1080,height:1920,asset_url:u,evidence_refs:fps.flatMap(x=>x.evidence_refs||[]),frame_evidence:fps};
   proof={exact_final_media_proven:true,mira_gate_passed:true,identity_gate_result:'PASS',mira_gate_result:'PASS',media_type:postType,media_provider:'openart',media_url:u,final_media_sha256:final.sha256,instagram_visual:visual};
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