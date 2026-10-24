const ref='adhjwmvyoixzjtmiroln';
export const queries={
  social:[
    "with ranked as (select s.post_id,s.platform,s.published_at,s.format,s.hook_type,s.cta_type,m.observed_at,m.data_quality,m.source,m.metrics,",
    "row_number() over (partition by s.tenant_id,s.post_id order by m.observed_at desc nulls last,m.snapshot_id desc) rn",
    "from public.social_posts s left join public.social_metric_snapshots m on m.tenant_id=s.tenant_id and m.post_id=s.post_id",
    "where s.tenant_id='bedrijfsgeheugen' and s.published_at>=now()-interval '180 days')",
    "select post_id,platform,published_at,format,hook_type,cta_type,observed_at,data_quality,source,metrics from ranked where rn=1 order by published_at desc limit 300"
  ].join(' '),
  pages:[
    "select pad page_path,count(distinct sessie) filter(where gebeurtenis='pagina') human_page_sessions,",
    "count(distinct sessie) filter(where gebeurtenis='klik') human_click_sessions,max(ontvangen_op) observed_at",
    "from public.bg_interacties where ontvangen_op>=now()-interval '30 days' and is_robot=false and toestemming=true",
    "and pad is not null and sessie is not null group by pad order by human_page_sessions desc limit 300"
  ].join(' '),
  sources:[
    "select distinct on(source_key) source_key,quality,metric_date,source_observed_at,evidence->>'authority' authority",
    "from public.powerhouse_growth_source_daily_v1 where tenant_id='bedrijfsgeheugen'",
    "and metric_date>=current_date-interval '7 days' and source_key in",
    "('ga4','search_console','website_interactions','instagram','linkedin')",
    "order by source_key,metric_date desc limit 8"
  ].join(' ')
};
function rows(body){
 if(Array.isArray(body))return body;
 if(Array.isArray(body?.data))return body.data;
 if(Array.isArray(body?.result))return body.result;
 throw Error('EVIDENCE_RESPONSE_SHAPE_UNVERIFIED');
}
export async function collect({token=process.env.SUPABASE_ACCESS_TOKEN,fetcher=fetch,now=new Date()}={}){
 const out={state:'AUTH_REQUIRED',collected_at:now.toISOString(),social:[],pages:[],sources:[],coverage:'NOT_OBSERVED'};
 if(!token)return out;
 for(const [kind,query] of Object.entries(queries)){
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),15000);
   try{
     const result=await fetcher('https://api.supabase.com/v1/projects/'+ref+'/database/query/read-only',{
       method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},
       body:JSON.stringify({query}),signal:controller.signal
     });
     if(!result.ok)throw Error('PROVIDER_HTTP_'+result.status);
     const records=rows(await result.json());
     if(records.length>300)throw Error('SOURCE_ROW_LIMIT_EXCEEDED');
     out[kind]=records;
   }finally{clearTimeout(timer);}
 }
 out.state='READ_ONLY_PROVIDER_OBSERVED';
 out.coverage='OWNED_POSTS_AND_CONSENTED_HUMAN_PAGE_AGGREGATES_ONLY';
 return out;
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 let report;
 try{report=await collect();}
 catch(e){report={state:'SOURCE_ERROR',failure_class:'PROVIDER_READ_ONLY_QUERY_FAILED',collected_at:new Date().toISOString(),social:[],pages:[],sources:[],coverage:'NOT_OBSERVED'};}
 // Do not emit raw provider rows to Actions logs or write network content to an attacker-selected file.
 // The trusted workflow redirects stdout into a private, fixed /tmp path.
 process.stdout.write(JSON.stringify(report)+'\n');
 process.stderr.write(JSON.stringify({state:report.state,social:report.social.length,pages:report.pages.length,sources:report.sources.length})+'\n');
}