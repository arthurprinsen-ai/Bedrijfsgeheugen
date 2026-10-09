import { createClient } from 'npm:@supabase/supabase-js@2';

const USE_CASE='supabase-powerhouse-instagram-media-verifier-v1';
const CONTRACT='mira-visible-identity-vision-v1';
const MAX_BYTES=10*1024*1024;
const MIRA_MASTER_ID='Yjqu4D7v76HABNPmQPj1';
const MIRA_MASTER_URL='https://cdn.openart.ai/openart-ai/production/2026-09/create-image/WZvuT1BzGx566fWaFo8F/image_1790665568080_41c2e10a_1790665568142_c6e526dd.jpg';

const clean=(v:unknown)=>String(v??'').trim();
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});

function safeRemoteUrl(raw:string){
  const url=new URL(raw);
  if(url.protocol!=='https:') throw new Error('MEDIA_URL_HTTPS_REQUIRED');
  const host=url.hostname.toLowerCase();
  if(host==='localhost'||host.endsWith('.local')||host==='127.0.0.1'||host==='::1'||/^10\./.test(host)||/^192\.168\./.test(host)||/^169\.254\./.test(host)||/^172\.(1[6-9]|2\d|3[01])\./.test(host)) throw new Error('MEDIA_URL_PRIVATE_HOST_BLOCKED');
  return url;
}
function pngDimensions(bytes:Uint8Array){
  if(bytes.length<24)return null;
  const sig=[137,80,78,71,13,10,26,10];
  if(!sig.every((v,i)=>bytes[i]===v))return null;
  const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  return {width:v.getUint32(16),height:v.getUint32(20)};
}
function jpegDimensions(bytes:Uint8Array){
  if(bytes.length<4||bytes[0]!==0xff||bytes[1]!==0xd8)return null;
  let i=2;
  const sof=new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
  while(i+8<bytes.length){
    if(bytes[i]!==0xff){i++;continue;}
    while(i<bytes.length&&bytes[i]===0xff)i++;
    const marker=bytes[i++];
    if(marker===0xd9||marker===0xda)break;
    if(i+1>=bytes.length)break;
    const len=(bytes[i]<<8)|bytes[i+1];
    if(len<2||i+len>bytes.length)break;
    if(sof.has(marker)&&len>=7){
      return {height:(bytes[i+3]<<8)|bytes[i+4],width:(bytes[i+5]<<8)|bytes[i+6]};
    }
    i+=len;
  }
  return null;
}
function dimensions(bytes:Uint8Array,contentType:string){
  return contentType==='image/png'?pngDimensions(bytes):jpegDimensions(bytes);
}
function toBase64(bytes:Uint8Array){
  let out='';
  const step=0x8000;
  for(let i=0;i<bytes.length;i+=step)out+=String.fromCharCode(...bytes.subarray(i,Math.min(i+step,bytes.length)));
  return btoa(out);
}
async function sha256(bytes:Uint8Array){
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function visionVerdict(apiKey:string,model:string,bytes:Uint8Array,mediaType:string,masterBytes:Uint8Array,masterType:string){
  const tool={
    name:'visual_verdict',
    description:'Return strict visible-Mira evidence for the exact supplied image.',
    input_schema:{
      type:'object',additionalProperties:false,
      properties:{
        canonical_identity_match:{type:'boolean'},
        canonical_identity_confidence:{type:'number',minimum:0,maximum:1},
        semantic_verified:{type:'boolean'},
        mira_present:{type:'boolean'},
        identity_class:{type:'string',enum:['mira_daily_life','text_only_card','generic_person','other','uncertain']},
        evidence_method:{type:'string',enum:['vision']},
        placeholder_detected:{type:'boolean'},
        visual_complete:{type:'boolean'},
        daily_life_scene:{type:'boolean'},
        mira_central_subject:{type:'boolean'},
        text_dominant:{type:'boolean'},
        brand_template_dominant:{type:'boolean'},
        confidence:{type:'number',minimum:0,maximum:1},
        reason:{type:'string'}
      },
      required:['canonical_identity_match','canonical_identity_confidence','semantic_verified','mira_present','identity_class','evidence_method','placeholder_detected','visual_complete','daily_life_scene','mira_central_subject','text_dominant','brand_template_dominant','confidence','reason']
    }
  };
  const response=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'},
    body:JSON.stringify({
      model,max_tokens:700,
      system:'Compare two actual supplied images, not their filenames, prompts or claimed identity. Image A is the immutable canonical fictional Mira master. Image B is the exact candidate final image or video frame. Approve canonical_identity_match ONLY if B visibly portrays the SAME person as A, with stable face shape, eye/nose/mouth proportions, age range and recognisable hairstyle/colour. Clothing, lighting, emotion and camera angle may differ. A generic similar-looking woman is NOT enough. If B is obscured, tiny, lacks a clear face, or differs meaningfully, reject. Also reject text-only cards, templates and logo-first creatives. Conservative uncertainty means canonical_identity_match=false and mira_present=false.',
      messages:[{role:'user',content:[
        {type:'text',text:'IMAGE A: the canonical reference portrait of the only allowed Mira identity.'},
        {type:'image',source:{type:'base64',media_type:masterType,data:toBase64(masterBytes)}},
        {type:'text',text:'IMAGE B: the exact final media or video frame that must match the SAME face/person as A.'},
        {type:'image',source:{type:'base64',media_type:mediaType,data:toBase64(bytes)}},
        {type:'text',text:'Compare IMAGE A and B directly for the same character identity. Reject an unrelated or merely similar person, blurred/hidden face, generic model, text/quote card or template. Do not accept model prompt, claimed reference ID or metadata in lieu of actual image comparison.'}
      ]}],
      tools:[tool],tool_choice:{type:'tool',name:'visual_verdict'}
    })
  });
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error('VISION_PROVIDER_REQUEST_FAILED');
  const item=(body.content||[]).find((x:any)=>x.type==='tool_use'&&x.name==='visual_verdict');
  if(!item?.input)throw new Error('VISION_TOOL_OUTPUT_MISSING');
  return item.input;
}

Deno.serve(async(req)=>{
  if(req.method!=='POST')return json({ok:false,error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL')||'',service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!service)return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const expected=clean((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data);
  if(!expected||req.headers.get('x-powerhouse-token')!==expected)return json({ok:false,error:'UNAUTHORIZED'},401);

  let body:any={};try{body=await req.json();}catch{}
  const publicationDate=clean(body.publicationDate);
  const mediaUrl=clean(body.mediaUrl);
  const provider=clean(body.provider)||'unknown';
  const mediaType=clean(body.mediaType||'image').toLowerCase();
  const verificationRole=clean(body.verificationRole)||'static_image';
  const writeObligation=body.writeObligation!==false;
  const inlineInput=clean(body.imageBase64);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(publicationDate)||(!mediaUrl&&!inlineInput))return json({ok:false,error:'INVALID_INPUT'},400);
  if(mediaType!=='image')return json({ok:false,error:'IMAGE_OR_VIDEO_FRAME_REQUIRED'},422);

  try{
    const inlineBase64=clean(body.imageBase64);
    const inlineMime=clean(body.mediaMime||'image/jpeg').toLowerCase();
    if(!mediaUrl&&!inlineBase64)return json({ok:false,error:'MEDIA_INPUT_REQUIRED'},400);
    if(mediaUrl)safeRemoteUrl(mediaUrl);
    if(inlineBase64 && !['image/jpeg','image/png'].includes(inlineMime))return json({ok:false,error:'MEDIA_TYPE_UNSUPPORTED'},422);
    const gov=await db.from('brain_ai_governance_registry')
      .select('model_id,provider,approved,lifecycle_status')
      .eq('tenant_id','canonical').eq('use_case_id',USE_CASE).maybeSingle();
    if(!gov.data||gov.data.approved!==true||gov.data.lifecycle_status!=='ACTIVE'||gov.data.provider!=='Anthropic')throw new Error('AI_GOVERNANCE_UNAVAILABLE');
    const apiKey=clean((await db.rpc('bg_geheim',{p_naam:'ANTHROPIC_API_KEY'})).data);
    if(!apiKey)throw new Error('AI_KEY_UNAVAILABLE');

    let ct='',bytes:Uint8Array;
    if(inlineBase64){
      ct=inlineMime;
      try{bytes=Uint8Array.from(atob(inlineBase64),c=>c.charCodeAt(0));}catch{throw new Error('MEDIA_BASE64_INVALID');}
    }else{
      const response=await fetch(mediaUrl,{redirect:'follow'});
      if(!response.ok)throw new Error('MEDIA_FETCH_FAILED');
      ct=clean(response.headers.get('content-type')).split(';')[0].toLowerCase();
      if(!['image/jpeg','image/png'].includes(ct))throw new Error('MEDIA_TYPE_UNSUPPORTED');
      const len=Number(response.headers.get('content-length')||0);
      if(len>MAX_BYTES)throw new Error('MEDIA_TOO_LARGE');
      bytes=new Uint8Array(await response.arrayBuffer());
    }
    if(!bytes.length||bytes.length>MAX_BYTES)throw new Error('MEDIA_SIZE_INVALID');
    const size=dimensions(bytes,ct);
    if(!size)throw new Error('MEDIA_DIMENSIONS_UNREADABLE');
    const hash=await sha256(bytes);
    const masterResponse=await fetch(MIRA_MASTER_URL,{redirect:'follow'});
    if(!masterResponse.ok)throw new Error('MIRA_MASTER_ASSET_UNAVAILABLE');
    const masterType=clean(masterResponse.headers.get('content-type')).split(';')[0].toLowerCase();
    if(!['image/jpeg','image/png'].includes(masterType))throw new Error('MIRA_MASTER_MEDIA_INVALID');
    const masterBytes=new Uint8Array(await masterResponse.arrayBuffer());
    if(!masterBytes.length||masterBytes.length>MAX_BYTES)throw new Error('MIRA_MASTER_BYTES_INVALID');
    const masterSha=await sha256(masterBytes);
    const verdict=await visionVerdict(apiKey,gov.data.model_id,bytes,ct,masterBytes,masterType);
    const expectedHeight=verificationRole==='video_frame'?1920:1350;
    const dimsOk=size.width===1080&&size.height===expectedHeight;
    const pass=dimsOk
      && verdict.canonical_identity_match===true
      && Number(verdict.canonical_identity_confidence)>=0.94
      && verdict.semantic_verified===true
      && verdict.mira_present===true
      && verdict.identity_class==='mira_daily_life'
      && verdict.evidence_method==='vision'
      && verdict.placeholder_detected===false
      && verdict.visual_complete===true
      && verdict.daily_life_scene===true
      && verdict.mira_central_subject===true
      && verdict.text_dominant===false
      && verdict.brand_template_dominant===false
      && Number(verdict.confidence)>=0.9;
    const evidenceRef=`vision:anthropic:${gov.data.model_id}:${hash.slice(0,16)}:master:${masterSha.slice(0,16)}`;
    const visual={
      verified:pass,canonical_master_reference_id:MIRA_MASTER_ID,canonical_master_sha256:masterSha,canonical_identity_match:verdict.canonical_identity_match===true,canonical_identity_confidence:Number(verdict.canonical_identity_confidence)||0,semantic_verified:verdict.semantic_verified===true,mira_present:verdict.mira_present===true,
      identity_class:clean(verdict.identity_class),evidence_method:'vision',
      placeholder_detected:verdict.placeholder_detected===true,visual_complete:verdict.visual_complete===true,
      daily_life_scene:verdict.daily_life_scene===true,mira_central_subject:verdict.mira_central_subject===true,
      text_dominant:verdict.text_dominant===true,brand_template_dominant:verdict.brand_template_dominant===true,
      confidence:Number(verdict.confidence)||0,
      reason:clean(verdict.reason).slice(0,500),asset_url:mediaUrl||null,width:size.width,height:size.height,
      format_verified:dimsOk,evidence_refs:[evidenceRef]
    };
    const providerPostId=clean(body.providerPostId)||`preflight:${hash.slice(0,24)}`;
    const fingerprint=`instagram-vision-proof:${publicationDate}:${hash}`;
    const proof={
      fingerprint,publication_date:publicationDate,channel:'instagram',provider,provider_post_id:providerPostId,
      provider_external_url:null,media_url:mediaUrl,provider_status:pass?'prepublish_verified':'prepublish_rejected',
      canonical_copy:null,exact_copy_verified:false,exact_media_retrievable:true,exact_media_sha256:hash,
      exact_media_verified_at:new Date().toISOString(),identity_contract:CONTRACT,
      identity_gate_result:pass?'PASS':'FAIL',
      proof_lineage:{contract:CONTRACT,media_type:verificationRole==='video_frame'?'video_frame':'image',verification_role:verificationRole,media_source:provider,instagram_visual:visual,exact_final_media_proven:pass},
      failure_reason:pass?null:`MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED: ${visual.reason}`,
      updated_at:new Date().toISOString()
    };
    const write=await db.from('powerhouse_media_proof_evidence_v1').upsert(proof,{onConflict:'fingerprint'});
    if(write.error)throw new Error('PROOF_WRITE_FAILED');

    if(writeObligation){
    const current=await db.from('content_publication_obligations')
      .select('status,external_id,evidence').eq('tenant_id','canonical').eq('publication_date',publicationDate).eq('channel','instagram').maybeSingle();
    const row=current.data;
    if(row){
      const historicalSent=!!clean(row.external_id);
      const mergedEvidence={...(row.evidence||{}),
        media_url:mediaUrl,media_type:'image',media_provider:provider,final_media_sha256:hash,
        exact_final_media_proven:pass,mira_gate_result:pass?'PASS':'FAIL',mira_gate_passed:pass,
        identity_gate_result:pass?'PASS':'FAIL',instagram_visual:visual,proof_fingerprint:fingerprint,
        vision_verified_at:new Date().toISOString(),republish_forbidden:historicalSent?true:(row.evidence?.republish_forbidden===true)
      };
      const patch:any={evidence:mergedEvidence,updated_at:new Date().toISOString()};
      if(pass&&!historicalSent){
        patch.last_error=null;
        patch.next_action='Vision proof PASS; canonical social publisher may proceed with this exact asset only.';
        if(row.status==='BLOCKED')patch.status='APPROVED';
      }else if(!pass){
        patch.status='BLOCKED';
        patch.last_error='MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED';
        patch.next_action='Generate or select a new exact final Mira asset and vision-verify it before dispatch.';
      }else{
        patch.next_action='Historical sent item verified only for evidence; republish remains forbidden.';
      }
      const update=await db.from('content_publication_obligations').update(patch)
        .eq('tenant_id','canonical').eq('publication_date',publicationDate).eq('channel','instagram');
      if(update.error)throw new Error('OBLIGATION_WRITE_FAILED');
    }
    }
    return json({ok:true,publicationDate,pass,fingerprint,sha256:hash,width:size.width,height:size.height,confidence:visual.confidence,canonical_identity_match:visual.canonical_identity_match,canonical_identity_confidence:visual.canonical_identity_confidence,canonical_master_reference_id:MIRA_MASTER_ID,canonical_master_sha256:masterSha,evidence_ref:evidenceRef,visual});
  }catch(error){
    const message=String((error as Error)?.message||error).slice(0,300);
    return json({ok:false,error:message},500);
  }
});
