import { createClient } from 'npm:@supabase/supabase-js@2';

const CONTRACT='powerhouse-dataforseo-intelligence-v1';
const ENDPOINT='https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const clean=(v:unknown)=>String(v??'').trim();
const n=(v:unknown)=>{const x=Number(v);return Number.isFinite(x)?x:null};
const clamp=(v:number,min=0,max=100)=>Math.max(min,Math.min(max,v));
async function hash(value:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST') return json({ok:false,error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL')||'', service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!service) return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const expected=clean((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data);
  if(!expected||req.headers.get('x-powerhouse-token')!==expected) return json({ok:false,error:'UNAUTHORIZED'},401);

  const observedAt=new Date().toISOString();
  try{
    const [login,password]=await Promise.all([
      db.rpc('bg_geheim',{p_naam:'DATAFORSEO_LOGIN'}),
      db.rpc('bg_geheim',{p_naam:'DATAFORSEO_PASSWORD'})
    ]);
    const user=clean(login.data), pass=clean(password.data);
    if(!user||!pass) throw new Error('DATAFORSEO_CREDENTIALS_MISSING');

    const auth=btoa(`${user}:${pass}`);
    const response=await fetch(ENDPOINT,{
      method:'POST',
      headers:{authorization:`Basic ${auth}`,'content-type':'application/json'},
      body:JSON.stringify([{target:'bedrijfsgeheugen.nl',location_code:2528,language_code:'nl',limit:100}])
    });
    const body:any=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(`DATAFORSEO_HTTP_${response.status}`);
    if(Number(body?.status_code||0)!==20000) throw new Error(`DATAFORSEO_RESPONSE_${body?.status_code}:${clean(body?.status_message).slice(0,180)}`);
    const task=body?.tasks?.[0];
    if(Number(task?.status_code||0)!==20000) throw new Error(`DATAFORSEO_TASK_${task?.status_code}:${clean(task?.status_message).slice(0,180)}`);

    const items=Array.isArray(task?.result?.[0]?.items)?task.result[0].items:[];
    let stored=0, evidence=0;
    for(const item of items){
      const keyword=clean(item?.keyword_data?.keyword);
      if(!keyword) continue;
      const info=item?.keyword_data?.keyword_info||{};
      const serp=item?.ranked_serp_element?.serp_item||{};
      const searchVolume=n(info.search_volume);
      const competition=n(info.competition);
      const cpc=n(info.cpc);
      const position=n(serp.rank_absolute);
      const rankUrl=clean(serp.url)||null;
      const volumeScore=searchVolume===null?0:Math.min(60,Math.log10(Math.max(1,searchVolume)+1)*18);
      const rankOpportunity=position===null?20:position<=3?5:position<=10?15:position<=30?30:40;
      const competitionPenalty=competition===null?10:clamp(competition*25,0,25);
      const opportunity=clamp(volumeScore+rankOpportunity-competitionPenalty,0,100);

      const {error:kwError}=await db.from('bg_zoekwoordkansen').upsert({
        zoekwoord:keyword,
        zaadwoord:'bedrijfsgeheugen.nl',
        zoekvolume:searchVolume===null?null:Math.round(searchVolume),
        concurrentie:competition,
        cpc,
        kansscore:opportunity,
        positie:position,
        rankende_url:rankUrl,
        bron:'dataforseo',
        opgehaald_op:observedAt
      },{onConflict:'zoekwoord'});
      if(kwError) throw new Error(`KEYWORD_STORE:${kwError.message}`);
      stored++;

      const dedupe=`dataforseo:${await hash(keyword+'|'+observedAt.slice(0,10))}`;
      const {error:evError}=await db.rpc('powerhouse_record_source_observation_v1',{
        p_source_key:'dataforseo-intelligence',
        p_dedupe_key:dedupe,
        p_external_event_id:keyword,
        p_observed_at:observedAt,
        p_evidence:{
          contract:CONTRACT,authority:'bg_zoekwoordkansen',provider:'dataforseo',
          target:'bedrijfsgeheugen.nl',keyword,search_volume:searchVolume,competition,cpc,
          position,ranking_url:rankUrl,opportunity_score:opportunity
        }
      });
      if(evError) throw new Error(`EVIDENCE_STORE:${evError.message}`);
      evidence++;
    }

    const heartbeatDedupe=`dataforseo:run:${observedAt.slice(0,10)}`;
    const {error:heartbeatError}=await db.rpc('powerhouse_record_source_observation_v1',{
      p_source_key:'dataforseo-intelligence',
      p_dedupe_key:heartbeatDedupe,
      p_external_event_id:'run-heartbeat',
      p_observed_at:observedAt,
      p_evidence:{
        contract:CONTRACT,authority:'bg_zoekwoordkansen',provider:'dataforseo',
        target:'bedrijfsgeheugen.nl',run_state:'success',items:items.length,stored,
        keyword_evidence:evidence,empty_result:items.length===0
      }
    });
    if(heartbeatError) throw new Error(`HEARTBEAT_STORE:${heartbeatError.message}`);

    await db.from('bg_gezondheid').insert({
      gemeten_op:observedAt,onderdeel:'dataforseo-intelligence',soort:'external-search-intelligence',
      status:'ok',detail:`items=${items.length}; stored=${stored}; evidence=${evidence}`,
      gegevens:{contract:CONTRACT,target:'bedrijfsgeheugen.nl',items:items.length,stored,evidence}
    });
    return json({ok:true,contract:CONTRACT,items:items.length,stored,evidence,observed_at:observedAt});
  }catch(error:any){
    const detail=clean(error?.message||error).slice(0,500);
    await db.from('bg_gezondheid').insert({
      gemeten_op:observedAt,onderdeel:'dataforseo-intelligence',soort:'external-search-intelligence',
      status:'fout',detail,gegevens:{contract:CONTRACT}
    }).catch(()=>{});
    return json({ok:false,contract:CONTRACT,error:detail},503);
  }
});
