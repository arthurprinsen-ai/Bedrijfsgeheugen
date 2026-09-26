import { createClient } from 'npm:@supabase/supabase-js@2';

const USE_CASE='supabase-powerhouse-instagram-media-verifier-v1';
const CONTRACT='mira-continuous-human-video-v1';
const clean=(v:unknown)=>String(v??'').trim();
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const b64=(v:any)=>clean(v?.imageBase64||v?.image_base64);
const mime=(v:any)=>clean(v?.mediaType||v?.media_type||'image/jpeg').toLowerCase();
async function sha256(text:string){const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('');}

Deno.serve(async(req)=>{
  if(req.method!=='POST') return json({ok:false,error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL')||'', service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!service) return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const expected=clean((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data);
  if(!expected||req.headers.get('x-powerhouse-token')!==expected) return json({ok:false,error:'UNAUTHORIZED'},401);
  let body:any={}; try{body=await req.json();}catch{}
  const publicationDate=clean(body.publicationDate||body.runDate), videoSha256=clean(body.videoSha256);
  const frames=Array.isArray(body.frames)?body.frames:[];
  if(!/^\d{4}-\d{2}-\d{2}$/.test(publicationDate)||!videoSha256||frames.length<3) return json({ok:false,error:'INVALID_INPUT'},400);
  const ordered=['start','middle','end'].map(p=>frames.find((f:any)=>clean(f.position)===p)).filter(Boolean);
  if(ordered.length!==3||ordered.some((f:any)=>!b64(f))) return json({ok:false,error:'START_MIDDLE_END_FRAMES_REQUIRED'},422);
  if(ordered.some((f:any)=>!['image/jpeg','image/png'].includes(mime(f)))) return json({ok:false,error:'FRAME_MEDIA_TYPE_UNSUPPORTED'},422);

  try{
    const gov=await db.from('brain_ai_governance_registry').select('model_id,provider,approved,lifecycle_status')
      .eq('tenant_id','canonical').eq('use_case_id',USE_CASE).maybeSingle();
    if(!gov.data||gov.data.approved!==true||gov.data.lifecycle_status!=='ACTIVE'||gov.data.provider!=='Anthropic') throw new Error('AI_GOVERNANCE_UNAVAILABLE');
    const apiKey=clean((await db.rpc('bg_geheim',{p_naam:'ANTHROPIC_API_KEY'})).data);
    if(!apiKey) throw new Error('AI_KEY_UNAVAILABLE');
    const tool={name:'temporal_verdict',description:'Conservatively judge temporal continuity across ordered start, middle and end frames of one short Reel.',input_schema:{
      type:'object',additionalProperties:false,properties:{
        single_continuous_take:{type:'boolean'},continuous_motion_verified:{type:'boolean'},scene_continuity_verified:{type:'boolean'},
        identity_continuity_verified:{type:'boolean'},human_motion_verified:{type:'boolean'},realistic_camera_motion:{type:'boolean'},
        slideshow_detected:{type:'boolean'},still_image_animation_detected:{type:'boolean'},confidence:{type:'number',minimum:0,maximum:1},reason:{type:'string'}
      },required:['single_continuous_take','continuous_motion_verified','scene_continuity_verified','identity_continuity_verified','human_motion_verified','realistic_camera_motion','slideshow_detected','still_image_animation_detected','confidence','reason']
    }};
    const content:any[]=[{type:'text',text:'The next three images are ordered START, MIDDLE, END frames from the exact same short vertical Reel. Judge only visible evidence across the sequence. Pass continuity fields only when the same woman, same scene and natural progression of human pose/expression/object interaction are visible. realistic_camera_motion means subtle natural perspective/framing change consistent with a real handheld or stable live camera, not a requirement for large movement. Mark slideshow/still-image animation true if the sequence looks like independent stills, crossfades, static pan/zoom, or an animated single photo. Be conservative.'}];
    for(const [i,f] of ordered.entries()){
      content.push({type:'text',text:['START','MIDDLE','END'][i]});
      content.push({type:'image',source:{type:'base64',media_type:mime(f),data:b64(f)}});
    }
    const response=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({
      model:gov.data.model_id,max_tokens:700,messages:[{role:'user',content}],tools:[tool],tool_choice:{type:'tool',name:'temporal_verdict'}
    })});
    const rb:any=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error('VISION_PROVIDER_REQUEST_FAILED:'+response.status);
    const item=(rb.content||[]).find((x:any)=>x.type==='tool_use'&&x.name==='temporal_verdict');
    if(!item?.input) throw new Error('TEMPORAL_TOOL_OUTPUT_MISSING');
    const v=item.input;
    const pass=v.single_continuous_take===true&&v.continuous_motion_verified===true&&v.scene_continuity_verified===true&&v.identity_continuity_verified===true
      &&v.human_motion_verified===true&&v.realistic_camera_motion===true&&v.slideshow_detected===false&&v.still_image_animation_detected===false&&Number(v.confidence)>=0.9;
    const evidenceHash=await sha256(videoSha256+'|'+ordered.map((f:any)=>clean(f.position)+':'+clean(f.seconds)).join('|'));
    const temporal_proof={
      contract:CONTRACT,verified:pass,single_continuous_take:v.single_continuous_take===true,continuous_motion_verified:v.continuous_motion_verified===true,
      scene_continuity_verified:v.scene_continuity_verified===true,identity_continuity_verified:v.identity_continuity_verified===true,human_motion_verified:v.human_motion_verified===true,
      realistic_camera_motion:v.realistic_camera_motion===true,slideshow_detected:v.slideshow_detected===true,still_image_animation_detected:v.still_image_animation_detected===true,
      evidence_method:'vision',confidence:Number(v.confidence)||0,reason:clean(v.reason).slice(0,700),video_sha256:videoSha256,
      evidence_refs:[`temporal:anthropic:${gov.data.model_id}:${evidenceHash.slice(0,20)}`]
    };
    return json({ok:true,pass,publicationDate,temporal_proof});
  }catch(error){return json({ok:false,error:clean((error as Error)?.message||error).slice(0,300)},500);}
});
