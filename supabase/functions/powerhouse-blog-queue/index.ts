import { createClient } from 'npm:@supabase/supabase-js@2';

const VERSION='v7-repository-native-prewrite';
const clean=(v:unknown)=>String(v??'').trim();
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const localDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const slugify=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70);

Deno.serve(async(req)=>{
  if(req.method!=='POST') return json({ok:false,error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL')||'',key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!key) return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const expected=clean((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data);
  if(!expected||req.headers.get('x-powerhouse-token')!==expected) return json({ok:false,error:'UNAUTHORIZED'},401);
  let input:any={}; try{input=await req.json()}catch{}
  const runDate=clean(input.runDate)||localDate();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(runDate)) return json({ok:false,error:'INVALID_DATE'},400);

  const [{data:a,error:ae},{data:d,error:de}]=await Promise.all([
    db.from('powerhouse_content_artifacts').select('title,body,cta,content_brief,generation_evidence,status').eq('run_date',runDate).eq('channel','blog').maybeSingle(),
    db.from('powerhouse_channel_decisions').select('decision,state,delivery_evidence').eq('run_date',runDate).eq('channel','blog').maybeSingle()
  ]);
  if(ae||de) return json({ok:false,error:'READ_FAILED'},500);
  if(!a||!d||d.decision!=='publish'||!['content_ready','scheduled','published'].includes(clean(d.state))) return json({ok:true,queued:false,reason:'NO_APPROVED_BLOG_ARTIFACT',runDate});

  const slug=clean(a.generation_evidence?.seo_slug)||slugify(clean(a.title))||('powerhouse-'+runDate);
  const canonical='https://www.bedrijfsgeheugen.nl/blog/'+slug+'/';
  const evidence={
    ...(d.delivery_evidence||{}),
    provider:'github-protected-daily-blog',
    executor:'powerhouse-blog-queue',
    executor_version:VERSION,
    source_of_truth:'powerhouse_content_artifacts',
    slug,
    canonical_url:canonical,
    queued_at:new Date().toISOString(),
    notion_critical_path:false,
    recovery_contract:'powerhouse|prewrite-obligation|external-mutation-recovery|v1',
    idempotency_key:'content-publication:'+runDate+':blog',
    next_executor:'.github/workflows/powerhouse-daily-blog.yml'
  };

  // Durable obligation is the first material state mutation. A later GitHub runner,
  // provider or execution-surface failure can therefore only leave RECOVERY_REQUIRED work,
  // never an orphaned outcome.
  const {error:obligationError}=await db.rpc('record_content_publication_state',{
    p_tenant_id:'canonical',
    p_publication_date:runDate,
    p_channel:'blog',
    p_status:'GENERATED',
    p_content_id:'blog:'+slug,
    p_slug:slug,
    p_external_id:null,
    p_canonical_url:canonical,
    p_evidence:evidence,
    p_metrics:{},
    p_next_action:'Canonical hourly GitHub publisher -> same-date protected candidate -> required checks -> merge -> Netlify -> exact public readback.',
    p_error:null
  });
  if(obligationError) return json({ok:false,error:'OBLIGATION_WRITE:'+obligationError.message},500);

  const {error:decisionError}=await db.from('powerhouse_channel_decisions')
    .update({delivery_evidence:evidence,updated_at:new Date().toISOString()})
    .eq('run_date',runDate).eq('channel','blog');
  if(decisionError){
    return json({ok:false,error:'DECISION_EVIDENCE_WRITE:'+decisionError.message,recovery_required:true,runDate,slug,canonical_url:canonical},500);
  }

  return json({ok:true,queued:true,runDate,slug,canonical_url:canonical,provider:'github-protected-daily-blog',executor_version:VERSION,recovery_required:false});
});
