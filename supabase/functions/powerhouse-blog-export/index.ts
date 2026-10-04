import { createClient } from 'npm:@supabase/supabase-js@2';

const VERSION='v3-repository-native-export';
const clean=(v:unknown)=>String(v??'').trim();
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store','access-control-allow-origin':'*'}});
const localDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const slugify=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70);

Deno.serve(async(req)=>{
  if(!['GET','POST'].includes(req.method)) return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  const url=Deno.env.get('SUPABASE_URL')||'', key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!key) return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  let runDate=localDate();
  if(req.method==='GET'){ const u=new URL(req.url); runDate=clean(u.searchParams.get('date'))||runDate; }
  else { try{ const b=await req.json(); runDate=clean(b?.runDate)||runDate; }catch{} }
  if(!/^\d{4}-\d{2}-\d{2}$/.test(runDate)) return json({ok:false,error:'INVALID_DATE'},400);

  const [{data:a,error:ae},{data:d,error:de},{data:o,error:oe}]=await Promise.all([
    db.from('powerhouse_content_artifacts').select('title,body,cta,content_brief,generation_evidence,status').eq('run_date',runDate).eq('channel','blog').maybeSingle(),
    db.from('powerhouse_channel_decisions').select('decision,state').eq('run_date',runDate).eq('channel','blog').maybeSingle(),
    db.from('content_publication_obligations').select('status,content_id,slug,canonical_url,evidence').eq('tenant_id','canonical').eq('publication_date',runDate).eq('channel','blog').maybeSingle()
  ]);
  if(ae||de||oe) return json({ok:false,error:'READ_FAILED'},500);
  if(!a||!d||d.decision!=='publish'||!['content_ready','scheduled','published','measured','learned'].includes(clean(d.state))) return json({ok:false,error:'NO_APPROVED_BLOG_ARTIFACT',runDate},404);

  const slug=clean(o?.slug)||clean(a.generation_evidence?.seo_slug)||slugify(clean(a.title))||('powerhouse-'+runDate);
  const contentId=clean(o?.content_id)||('blog:'+slug);
  const canonical=clean(o?.canonical_url)||('https://www.bedrijfsgeheugen.nl/blog/'+slug+'/');
  const focus=clean(a.generation_evidence?.focus_keyword)||'bedrijfsgeheugen';
  const meta=(clean(a.generation_evidence?.meta_description)||clean(a.content_brief)||clean(a.title)).slice(0,170);

  return json({
    ok:true,
    executor_version:VERSION,
    run_date:runDate,
    title:clean(a.title),
    body:clean(a.body),
    cta:clean(a.cta),
    slug,
    focus_keyword:focus,
    meta_description:meta,
    content_id:contentId,
    canonical_url:canonical,
    artifact_status:a.status,
    obligation_status:clean(o?.status)||null,
    obligation_idempotency_key:clean(o?.evidence?.idempotency_key)||('content-publication:'+runDate+':blog')
  });
});
