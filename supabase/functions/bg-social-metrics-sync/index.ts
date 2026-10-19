import { createClient } from 'npm:@supabase/supabase-js@2';

// Provider reader for the existing ONE BRAIN social_posts and social_metric_snapshots.
// Never sends a post, never infers impressions from likes, never stores actor PII.
const BASE='https://backend.composio.dev/api/v3.1';
const clean=(v:unknown)=>String(v??'').trim();
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const localDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const delayMs=90*1000;
const numeric=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)&&n>=0?n:null;};
async function secret(db:any,name:string){
  const {data,error}=await db.rpc('bg_geheim',{p_naam:name});
  if(error)throw new Error('SECRET_READ_FAILED:'+name);
  return clean(data);
}
async function request(apiKey:string,path:string,init:RequestInit={}){
  const response=await fetch(BASE+path,{...init,headers:{'x-api-key':apiKey,'content-type':'application/json',...(init.headers||{})},signal:AbortSignal.timeout(12000)});
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error('COMPOSIO_HTTP_'+response.status);
  return body;
}
async function execute(apiKey:string,account:any,slug:string,args:any){
  if(!account?.id||!account?.user_id)throw new Error('BOUND_PROVIDER_ACCOUNT_MISSING');
  const body=await request(apiKey,'/tools/execute/'+slug,{method:'POST',body:JSON.stringify({
    connected_account_id:account.id,user_id:account.user_id,version:'latest',arguments:args
  })});
  if(body?.successful!==true)throw new Error(slug+':'+clean(body?.error||body?.data?.message||'PROVIDER_REJECTED').slice(0,160));
  return body.data||{};
}
async function accounts(apiKey:string,toolkit:string){
  const body=await request(apiKey,'/connected_accounts?toolkit_slugs='+encodeURIComponent(toolkit)+'&statuses=ACTIVE&account_type=ALL&limit=50');
  return (Array.isArray(body?.items)?body.items:Array.isArray(body?.data?.items)?body.data.items:[]).filter((x:any)=>clean(x?.status).toUpperCase()==='ACTIVE');
}
async function snapshot(db:any,tenantId:string,postId:string,platform:string,providerId:string,day:string,metrics:any,quality:string){
  const now=new Date().toISOString();
  if(!Object.keys(metrics).length)throw new Error('EMPTY_PROVIDER_METRICS');
  const snapshotId='composio:'+platform+':'+providerId+':'+day;
  const {error}=await db.from('social_metric_snapshots').upsert({
    tenant_id:tenantId,post_id:postId,snapshot_id:snapshotId,
    source_event_id:snapshotId,source:'composio-'+platform,observed_at:now,
    data_quality:quality,metrics
  },{onConflict:'tenant_id,source_event_id'});
  if(error)throw new Error('SOCIAL_METRIC_STORE:'+error.message);
}
async function resolveInstagram(db:any,media:any){
  const mediaId=clean(media.id),timestamp=clean(media.timestamp);
  if(!/^\d{10,25}$/.test(mediaId)||!Number.isFinite(Date.parse(timestamp)))throw new Error('IG_MEDIA_ID_OR_DATE_INVALID');
  const {data:exact,error:exactErr}=await db.from('social_posts').select('tenant_id,post_id')
    .eq('tenant_id','bedrijfsgeheugen').eq('platform','instagram').eq('external_post_id',mediaId).limit(2);
  if(exactErr)throw new Error('IG_EXACT_LOOKUP:'+exactErr.message);
  if((exact||[]).length===1)return exact[0];
  const ms=Date.parse(timestamp);
  const {data:near,error:nearErr}=await db.from('social_posts').select('tenant_id,post_id,external_post_id')
    .eq('tenant_id','bedrijfsgeheugen').eq('platform','instagram')
    .gte('published_at',new Date(ms-60000).toISOString()).lte('published_at',new Date(ms+60000).toISOString()).limit(5);
  if(nearErr)throw new Error('IG_TIMESTAMP_LOOKUP:'+nearErr.message);
  if((near||[]).length===1)return near[0];
  if((near||[]).length>1)throw new Error('IG_POST_IDENTITY_AMBIGUOUS');
  // Verified provider media missing in the older Buffer register: register the exact owned post.
  const postId='instagram:'+mediaId;
  const {error}=await db.from('social_posts').upsert({
    tenant_id:'bedrijfsgeheugen',post_id:postId,platform:'instagram',
    external_post_id:mediaId,published_at:new Date(ms).toISOString(),
    channel_name:'Bedrijfsgeheugen Instagram',channel_kind:'instagram_business',
    learning_status:'pending_measurement'
  },{onConflict:'tenant_id,post_id',ignoreDuplicates:true});
  if(error)throw new Error('IG_PROVIDER_POST_REGISTER:'+error.message);
  return {tenant_id:'bedrijfsgeheugen',post_id:postId};
}
async function instagram(db:any,apiKey:string,day:string){
  const a=await accounts(apiKey,'instagram');
  const eligible=a.filter((x:any)=>clean(x?.user_info?.username).toLowerCase()==='bedrijfsgeheugen.nl');
  // A personal or Mira account is never a fallback for the business profile.
  const canonical=eligible.filter((x:any)=>clean(x.alias)==='bedrijfsgeheugen-nl-canonical');
  const chosen=canonical.length===1?canonical[0]:(eligible.length===1?eligible[0]:null);
  if(!chosen)throw new Error('IG_CANONICAL_IDENTITY_UNAVAILABLE_OR_AMBIGUOUS');
  const response=await execute(apiKey,chosen,'INSTAGRAM_GET_IG_USER_MEDIA',{
    ig_user_id:'me',limit:12,fields:'id,timestamp,permalink,media_type,media_product_type,like_count,comments_count,view_count'
  });
  const posts=Array.isArray(response?.data)?response.data:[];
  let observed=0;const failures:string[]=[];
  for(const media of posts){
    try{
      const id=clean(media.id);
      const result=await execute(apiKey,chosen,'INSTAGRAM_GET_IG_MEDIA_INSIGHTS',{
        ig_media_id:id,metric:['views','reach','likes','comments','saved','shares']
      });
      const items=Array.isArray(result?.data)?result.data:[];
      const metrics:Record<string,number>={};
      for(const item of items){
        const k=clean(item.name).toLowerCase();
        if(!['views','reach','likes','comments','saved','shares'].includes(k))continue;
        const val=numeric(item?.values?.[0]?.value??item?.total_value?.value);
        if(val!==null)metrics[k]=val;
      }
      if(metrics.likes===undefined&&numeric(media.like_count)!==null)metrics.likes=numeric(media.like_count)!;
      if(metrics.comments===undefined&&numeric(media.comments_count)!==null)metrics.comments=numeric(media.comments_count)!;
      if(!Object.keys(metrics).length)throw new Error('IG_INSIGHTS_UNAVAILABLE');
      const post=await resolveInstagram(db,media);
      await snapshot(db,post.tenant_id,post.post_id,'instagram',id,day,metrics,'OBSERVED');
      observed++;
    }catch(e){failures.push(clean((e as Error).message).slice(0,120));}
  }
  return {status:observed>0?'OBSERVED':'UNAVAILABLE',media_examined:posts.length,snapshots:observed,failures:failures.slice(0,12)};
}
async function linkedin(db:any,apiKey:string,day:string){
  const a=await accounts(apiKey,'linkedin');
  const eligible=a.filter((x:any)=>clean(x?.alias)==='bedrijfsgeheugen-org-publishing-reauth-20261010');
  if(eligible.length!==1)throw new Error('LINKEDIN_BOUND_CONNECTION_AMBIGUOUS_OR_UNAVAILABLE');
  const chosen=eligible[0];
  const {data:posts,error}=await db.from('social_posts')
    .select('tenant_id,post_id,external_post_id,published_at')
    .eq('tenant_id','canonical').eq('platform','linkedin').ilike('post_id','linkedin-personal%')
    .not('published_at','is',null).order('published_at',{ascending:false}).limit(8);
  if(error)throw new Error('LINKEDIN_CANONICAL_POST_READ:'+error.message);
  let observed=0;const failures:string[]=[];
  for(const post of posts||[]){
    const urn=clean(post.external_post_id);
    if(!/^urn:li:(share|ugcPost):\d+$/.test(urn))continue;
    try{
      const result=await execute(apiKey,chosen,'LINKEDIN_LIST_REACTIONS',{entity:urn,count:100,start:0});
      const total=numeric(result?.paging?.total);
      if(total===null)throw new Error('LINKEDIN_REACTION_TOTAL_UNAVAILABLE');
      await snapshot(db,post.tenant_id,post.post_id,'linkedin',urn,day,
        {reactions:total,metric_scope:'reactions_only',views_unavailable:true},'OBSERVED_PARTIAL_SCOPE');
      observed++;
    }catch(e){failures.push(clean((e as Error).message).slice(0,130));}
  }
  return {status:observed>0?'PARTIAL_SCOPE_OBSERVED':'UNAVAILABLE',posts_examined:(posts||[]).length,snapshots:observed,unsupported:'post_impressions_and_company_analytics',failures:failures.slice(0,8)};
}
Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  const url=Deno.env.get('SUPABASE_URL')||'';
  const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!key)return json({ok:false,error:'RUNTIME_CONFIG_MISSING'},500);
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  try{
    const scheduler=await secret(db,'powerhouse_daily_scheduler_token');
    if(!scheduler||clean(req.headers.get('x-powerhouse-token'))!==scheduler)return json({ok:false,error:'UNAUTHORIZED'},401);
    const apiKey=await secret(db,'COMPOSIO_API_KEY');
    if(!apiKey)throw new Error('COMPOSIO_API_KEY_MISSING');
    const day=localDay();
    let ig:any,li:any;
    try{ig=await instagram(db,apiKey,day);}catch(e){ig={status:'UNAVAILABLE',error:clean((e as Error).message)};}
    try{li=await linkedin(db,apiKey,day);}catch(e){li={status:'UNAVAILABLE',error:clean((e as Error).message)};}
    const total=(ig?.snapshots||0)+(li?.snapshots||0);
    const healthy=(ig?.snapshots||0)>0&&(li?.snapshots||0)>0&&!(ig?.failures||[]).length&&!(li?.failures||[]).length;
    const outcome={contract:'bg-social-metrics-composio-v1',day,healthy,provider_snapshots:total,
      instagram:ig,linkedin_personal:li,
      linkedin_company:'BLOCKED_ORGANIZATION_PERMISSION_403',
      social_sentiment_or_revenue_not_inferred:true};
    const {error:saveError}=await db.from('powerhouse_runtime_events').upsert({
      dedupe_key:'provider-social-metrics:'+day,event_type:'provider_social_metric_ingest',
      source:'bg-social-metrics-sync',subject_key:'social-learning',channel:'system',
      occurred_at:new Date().toISOString(),evidence:outcome,
      context:{provider:'composio',learning_authority:'social_metric_snapshots'},
      state:healthy?'observed':'error',data_quality:healthy?'OBSERVED':'PARTIAL',
      confidence:1,updated_at:new Date().toISOString()
    },{onConflict:'dedupe_key'});
    if(saveError)throw new Error('PROVIDER_METRIC_READBACK:'+saveError.message);
    return json({ok:total>0,...outcome},total>0?200:503);
  }catch(e){return json({ok:false,error:clean((e as Error).message).slice(0,190)},503);}
});
