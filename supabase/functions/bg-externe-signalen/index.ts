// Provider quota exhaustion is explicit; fallback uses independently observed DataForSEO SERP results, not synthetic signals.
import { createClient } from 'npm:@supabase/supabase-js@2';

const BRON='bg-externe-signalen';
const CONTRACT='tavily-signal-ingest-v2-bounded';
const DREMPEL=0.6;
const BATCH=3;
const TAVILY_TIMEOUT_MS=12000;
const BETROUWBAAR:Record<string,number>={
  'rijksoverheid.nl':1,'overheid.nl':1,'europa.eu':1,'autoriteitpersoonsgegevens.nl':1,'rvo.nl':1,'kvk.nl':0.95,'cbs.nl':1,'dnb.nl':1,'belastingdienst.nl':1,
  'mkb.nl':0.9,'fd.nl':0.9,'nos.nl':0.9,'nu.nl':0.8,'rtl.nl':0.8,'computable.nl':0.8,'emerce.nl':0.8,'accountancyvanmorgen.nl':0.85,'accountant.nl':0.85,
  'bouwendnederland.nl':0.8,'vno-ncw.nl':0.85,'tweakers.net':0.75,'agconnect.nl':0.75,'dutchitchannel.nl':0.7,'mt.nl':0.75,'sprout.nl':0.7,'intermediair.nl':0.7
};
const SOCIAAL=/(^|\.)(instagram|facebook|linkedin|tiktok|x|twitter|youtube|pinterest|reddit)\.com$/i;
const RUIS_TITEL=/^(zoekresultaten|search results?|home|homepage|nieuws|inzichten.*|blog)$|\btop ?\d+\b|\bbeste\b.*\b(vergelijk|programma|software|tools?)\b|\bvergelijken\b|\|\s*(salaris|software|hr software|prijzen)/i;
const RUIS_URL=/[?&](q|query|s|search)=|\/(search|zoeken|zoekresultaten|tag|categorie|category)\b|\/(prijzen|pricing|product|producten|features)\/?$/i;
const safeFailure=(error:unknown)=>{
  const detail=String((error as Error)?.message||error||'');
  if(/HTTP_432|usage limit|quota/i.test(detail))return 'UPSTREAM_PLAN_LIMIT';
  if(/HTTP_429|rate.limit/i.test(detail))return 'UPSTREAM_RATE_LIMIT';
  if(/TimeoutError|TAVILY_TIMEOUT|timed? ?out/i.test(detail))return 'UPSTREAM_TIMEOUT';
  if(/DATAFORSEO_CREDENTIALS_UNAVAILABLE/.test(detail))return 'DATAFORSEO_CREDENTIALS_UNAVAILABLE';
  if(/DATAFORSEO/.test(detail))return 'DATAFORSEO_REMOTE_FAILURE';
  return 'UPSTREAM_OR_VALIDATION_FAILURE';
};
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const clean=(v:unknown)=>String(v??'').trim();
const domeinVan=(u:string)=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch{return''}};
const trouw=(d:string)=>{if(SOCIAAL.test(d))return 0.1;for(const[k,v]of Object.entries(BETROUWBAAR))if(d===k||d.endsWith('.'+k))return v;return 0.4};


const DATAFORSEO_ENDPOINT='https://api.dataforseo.com/v3/serp/google/organic/live/advanced';
const DATAFORSEO_TIMEOUT_MS=35000; // Existing pg_net scheduler transport allows 120s; Tavily remains 12s.
async function dataforseoSerp(query:string,login:string,password:string){
  if(!login||!password)throw new Error('DATAFORSEO_CREDENTIALS_UNAVAILABLE');
  const r=await fetch(DATAFORSEO_ENDPOINT,{
    method:'POST',
    headers:{authorization:'Basic '+btoa(login+':'+password),'content-type':'application/json'},
    body:JSON.stringify([{keyword:query,location_name:'Netherlands',language_code:'nl',depth:10}]),
    signal:AbortSignal.timeout(DATAFORSEO_TIMEOUT_MS)
  });
  const b:any=await r.json().catch(()=>({}));
  if(!r.ok||Number(b.status_code)!==20000)throw new Error('DATAFORSEO_REMOTE_FAILURE');
  const task=b.tasks?.[0];
  if(task&&Number(task.status_code)!==20000)throw new Error('DATAFORSEO_TASK_'+String(task.status_code));
  const items:any[]=task?.result?.[0]?.items||[];
  // Paid listings are not market-truth signals. Unknown dates remain unknown.
  return items.filter(x=>x.type==='organic'&&/^https?:\/\//.test(String(x.url||''))).slice(0,10).map(x=>({
    url:String(x.url),title:String(x.title||''),content:String(x.description||''),
    published_date:typeof x.timestamp==='string'?x.timestamp:null,
    // Explicit rank proxy, not a claimed provider relevance score.
    score:1/Math.max(1,Number(x.rank_group)||10)
  }));
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({ok:false,error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL')||'',key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!key)return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const expected=clean((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data);
  if(!expected||req.headers.get('x-powerhouse-token')!==expected)return json({ok:false,error:'UNAUTHORIZED'},401);
  const bewijs=(groen:boolean,detail:unknown,klasse:string|null=null)=>db.rpc('bg_bewijs',{p_bron:BRON,p_groen:groen,p_detail:detail,p_foutklasse:klasse}).then(()=>{},()=>{});
  const tavily=clean(Deno.env.get('TAVILY_API_KEY')||((await db.rpc('bg_geheim',{p_naam:'TAVILY_API_KEY'})).data as string));
  const dataforseoLogin=clean(Deno.env.get('DATAFORSEO_LOGIN')||((await db.rpc('bg_geheim',{p_naam:'DATAFORSEO_LOGIN'})).data as string));
  const dataforseoPassword=clean(Deno.env.get('DATAFORSEO_PASSWORD')||((await db.rpc('bg_geheim',{p_naam:'DATAFORSEO_PASSWORD'})).data as string));
  const dataforseoReady=!!(dataforseoLogin&&dataforseoPassword);
  if(!tavily&&!dataforseoReady){const out={ok:false,error:'CONFIG_UNAVAILABLE',missing:{tavily:true,dataforseo:true}};await bewijs(false,out,'AUTH');return json(out,503)}

  try{
    const {data:all,error}=await db.from('bg_signaal_onderwerpen').select('onderwerp,zoekvraag').eq('actief',true).order('onderwerp');
    if(error)throw new Error('ONDERWERPEN:'+error.message);
    const topics=all||[];
    if(!topics.length){
      const observedAt=new Date().toISOString();
      await db.rpc('powerhouse_record_source_observation_v1',{p_source_key:'external-intelligence',p_dedupe_key:'external-intelligence-empty:'+observedAt.slice(0,13),p_external_event_id:'producer-run:'+observedAt,p_observed_at:observedAt,p_evidence:{contract:CONTRACT,provider:'tavily',producer_run:true,active_topics:0,no_data_returned:true}});
      const out={ok:true,contract:CONTRACT,active_topics:0,processed:0};await bewijs(true,out);return json(out);
    }
    const slot=Math.floor(Date.now()/1200000);
    const start=(slot*BATCH)%topics.length;
    const selected=Array.from({length:Math.min(BATCH,topics.length)},(_,i)=>topics[(start+i)%topics.length]);
    const results=await Promise.all(selected.map(async(o:any)=>{
      try{
        let res:any[]=[];
        let provider='tavily';
        let fallbackReason:string|null=null;
        if(tavily){
          try{
            const r=await fetch('https://api.tavily.com/search',{method:'POST',headers:{authorization:`Bearer ${tavily}`,'content-type':'application/json'},body:JSON.stringify({query:o.zoekvraag,topic:'news',days:7,max_results:6,search_depth:'basic',include_answer:false}),signal:AbortSignal.timeout(TAVILY_TIMEOUT_MS)});
            const b:any=await r.json().catch(()=>({}));
            if(!r.ok)throw new Error(`HTTP_${r.status}:${String(b?.detail?.error||b?.error||'').slice(0,100)}`);
            res=Array.isArray(b.results)?b.results:[];
          }catch(error){
            if(!dataforseoReady)throw error;
            fallbackReason=safeFailure(error);
            provider='dataforseo';
            res=await dataforseoSerp(o.zoekvraag,dataforseoLogin,dataforseoPassword);
          }
        }else{
          provider='dataforseo';
          fallbackReason='TAVILY_CREDENTIAL_UNAVAILABLE';
          res=await dataforseoSerp(o.zoekvraag,dataforseoLogin,dataforseoPassword);
        }
        const echt=res.filter(x=>!SOCIAAL.test(domeinVan(x.url)));
        const bevestiging=Math.min(1,Math.max(0,new Set(echt.map(x=>domeinVan(x.url))).size-1)/3);
        const rows=res.map(x=>{
          const d=domeinVan(x.url),pub=x.published_date?new Date(x.published_date):null,heeftDatum=!!pub&&!isNaN(pub.getTime());
          const dagen=heeftDatum?(Date.now()-pub!.getTime())/86400000:7;
          const versheid=Math.max(0,Math.min(1,1-Math.max(0,dagen-2)/12));
          const relevantie=Math.max(0,Math.min(1,Number(x.score)||0)),bt=trouw(d),titel=String(x.title||'').trim();
          const reden=SOCIAAL.test(d)?'sociale media':!heeftDatum?'geen publicatiedatum':RUIS_TITEL.test(titel)?'lijstje, zoek- of overzichtspagina':RUIS_URL.test(String(x.url))?'zoek-, categorie- of productpagina':titel.length<20?'titel te kort':null;
          const v=Math.round((bt*0.35+bevestiging*0.25+versheid*0.15+relevantie*0.25)*1000)/1000;
          return{url:x.url,onderwerp:o.onderwerp,titel:titel.slice(0,300),samenvatting:String(x.content||'').slice(0,1500),domein:d,gepubliceerd_op:heeftDatum?pub!.toISOString():null,brontrouw:bt,bevestiging,versheid:Math.round(versheid*1000)/1000,relevantie,vertrouwen:v,ruis_reden:reden,toegestaan:!reden&&v>=DREMPEL,opgehaald_op:new Date().toISOString()};
        });
        if(rows.length){const {error:ue}=await db.from('bg_externe_signalen').upsert(rows,{onConflict:'url'});if(ue)throw new Error('UPSERT:'+ue.message)}
        return{ok:true,topic:o.onderwerp,provider,fallback_reason:fallbackReason,found:rows.length,allowed:rows.filter(x=>x.toegestaan).length,noise:rows.filter(x=>x.ruis_reden).length};
      }catch(e:any){return{ok:false,topic:o.onderwerp,error:safeFailure(e)}}
    }));
    const ok=results.filter((x:any)=>x.ok),failed=results.filter((x:any)=>!x.ok);
    const found=ok.reduce((a:number,x:any)=>a+x.found,0),allowed=ok.reduce((a:number,x:any)=>a+x.allowed,0),noise=ok.reduce((a:number,x:any)=>a+x.noise,0);
    const observedAt=new Date().toISOString();
    if(ok.length){
      const providers=[...new Set(ok.map((x:any)=>x.provider))];
      const sourceKey=providers.includes('tavily')?'tavily-intelligence':'dataforseo-intelligence';
      const evidence={contract:CONTRACT,provider:providers.length===1?providers[0]:'multi',providers,source_routes:ok.map((x:any)=>({topic:x.topic,provider:x.provider,fallback_reason:x.fallback_reason})),relevance_basis:providers.includes('dataforseo')?'rank_proxy_not_provider_relevance':null,producer_run:true,active_topics:topics.length,selected_topics:selected.map((x:any)=>x.onderwerp),successful_topics:ok.length,failed_topics:failed.length,found,allowed,noise,bounded_batch:true,timeout_ms:TAVILY_TIMEOUT_MS};
      await db.rpc('powerhouse_record_source_observation_v1',{p_source_key:sourceKey,p_dedupe_key:'external-source-run:'+observedAt.slice(0,13)+':'+start,p_external_event_id:sourceKey+':'+observedAt,p_observed_at:observedAt,p_evidence:evidence});
      await db.rpc('powerhouse_record_source_observation_v1',{p_source_key:'external-intelligence',p_dedupe_key:'external-intelligence-producer:'+observedAt.slice(0,13)+':'+start,p_external_event_id:'external-intelligence:'+observedAt,p_observed_at:observedAt,p_evidence:{...evidence,authority:'bg_externe_signalen'}});
    }
    const out={ok:failed.length===0,contract:CONTRACT,active_topics:topics.length,processed:selected.length,successful:ok.length,failed:failed.length,found,allowed,noise,results};
    await bewijs(ok.length>0,out,ok.length?'PARTIAL':'REMOTE');
    return json(out,ok.length?(failed.length?207:200):502);
  }catch(e:any){
    const out={ok:false,contract:CONTRACT,error:safeFailure(e)};
    await bewijs(false,out,'VALIDATION');return json(out,500);
  }
});