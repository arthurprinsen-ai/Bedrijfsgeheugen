import { createClient } from 'npm:@supabase/supabase-js@2';
import owners from './intent-owners.json' with { type: 'json' };

const CONTRACT='powerhouse-seo-opportunity-resolver-v1';
const clean=(v:unknown)=>String(v??'').replace(/\s+/g,' ').trim();
const num=(v:unknown,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const clamp=(v:number,min=0,max=100)=>Math.max(min,Math.min(max,v));
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const localDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

function norm(v:unknown){
  return clean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}
function tokenSet(v:unknown){
  return new Set(norm(v).split(' ').filter(x=>x.length>=4));
}
function overlap(a:unknown,b:unknown){
  const aa=tokenSet(a), bb=tokenSet(b);
  if(!aa.size||!bb.size)return 0;
  let hit=0; for(const x of aa) if(bb.has(x)) hit++;
  return hit/Math.max(aa.size,bb.size);
}
function ownerFor(keyword:string){
  const k=norm(keyword);
  let best:any=null,score=0;
  for(const page of (owners as any).pages||[]){
    const candidates=[page.primary_keyword,...(page.secondary_keywords||[])];
    for(const candidate of candidates){
      const c=norm(candidate);
      const s=k===c?1:overlap(k,c);
      if(s>score){score=s;best=page;}
    }
  }
  return score>=0.72?{...best,match_score:score}:null;
}
function scoreKeyword(row:any,gsc:any,forecast:any){
  const volume=Math.max(0,num(row.zoekvolume));
  const cpc=Math.max(0,num(row.cpc));
  const position=num(row.positie,0);
  const volumeScore=Math.min(30,Math.log10(volume+1)*11);
  const cpcScore=Math.min(25,Math.log10(cpc+1)*16);
  const rankGap=position<=0?25:position>50?24:position>30?20:position>10?12:5;
  const gscScore=Math.min(10,Math.log10(num(gsc?.impressions)+1)*5);
  const forecastScore=Math.min(10,num(forecast?.first_mover_score)/10);
  return clamp(volumeScore+cpcScore+rankGap+gscScore+forecastScore,0,100);
}
function chooseForecast(keyword:string,forecasts:any[]){
  let best:any=null,bestScore=0;
  for(const row of forecasts||[]){
    const s=Math.max(overlap(keyword,row.topic_key),overlap(keyword,row.predicted_search_intent),overlap(keyword,row.predicted_question));
    if(s>bestScore){bestScore=s;best=row;}
  }
  return bestScore>=0.34?{...best,semantic_overlap:bestScore}:null;
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST') return json({ok:false,error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL')||'', service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!service) return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const expected=clean((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data);
  if(!expected||req.headers.get('x-powerhouse-token')!==expected) return json({ok:false,error:'UNAUTHORIZED'},401);

  const runDate=localDate();
  const observedAt=new Date().toISOString();
  try{
    const [kwResult,gscResult,forecastResult]=await Promise.all([
      db.from('bg_zoekwoordkansen')
        .select('zoekwoord,zoekvolume,concurrentie,cpc,kansscore,positie,rankende_url,bron,opgehaald_op')
        .eq('bron','dataforseo')
        .gte('opgehaald_op',new Date(Date.now()-14*86400000).toISOString())
        .order('opgehaald_op',{ascending:false})
        .limit(500),
      db.from('bg_zoekprestaties')
        .select('datum,pagina,zoekterm,klikken,vertoningen,ctr,positie,opgehaald_op')
        .gte('opgehaald_op',new Date(Date.now()-72*3600000).toISOString())
        .gte('datum',new Date(Date.now()-35*86400000).toISOString().slice(0,10))
        .limit(3000),
      db.from('powerhouse_forecasts')
        .select('forecast_id,topic_key,predicted_search_intent,predicted_question,first_mover_score,confidence,signal_acceleration,whitespace_score,evidence,created_at')
        .eq('scope','market').eq('status','active')
        .gte('created_at',new Date(Date.now()-30*86400000).toISOString())
        .order('first_mover_score',{ascending:false}).limit(250)
    ]);
    if(kwResult.error) throw new Error('KEYWORD_CACHE_READ:'+kwResult.error.message);
    if(gscResult.error) throw new Error('GSC_READ:'+gscResult.error.message);
    if(forecastResult.error) throw new Error('FORECAST_READ:'+forecastResult.error.message);

    const latestByKeyword=new Map<string,any>();
    for(const row of kwResult.data||[]){
      const key=norm(row.zoekwoord); if(!key)continue;
      const prior=latestByKeyword.get(key);
      if(!prior||Date.parse(row.opgehaald_op)>Date.parse(prior.opgehaald_op)) latestByKeyword.set(key,row);
    }

    const gscByQuery=new Map<string,any>();
    for(const row of gscResult.data||[]){
      const key=norm(row.zoekterm); if(!key)continue;
      const agg=gscByQuery.get(key)||{impressions:0,clicks:0,positionWeighted:0,positionWeight:0,pages:new Set<string>()};
      agg.impressions+=num(row.vertoningen); agg.clicks+=num(row.klikken);
      const w=Math.max(1,num(row.vertoningen)); agg.positionWeighted+=num(row.positie)*w; agg.positionWeight+=w;
      if(row.pagina)agg.pages.add(row.pagina);
      gscByQuery.set(key,agg);
    }

    const opportunities:any[]=[];
    for(const row of latestByKeyword.values()){
      const keyword=clean(row.zoekwoord);
      const g0=gscByQuery.get(norm(keyword));
      const gsc=g0?{impressions:g0.impressions,clicks:g0.clicks,position:g0.positionWeight?g0.positionWeighted/g0.positionWeight:null,pages:[...g0.pages]}:null;
      const owner=ownerFor(keyword);
      const forecast=chooseForecast(keyword,forecastResult.data||[]);
      const score=scoreKeyword(row,gsc,forecast);
      const commercial=(num(row.cpc)>=2||num(row.zoekvolume)>=100);
      const ownerExists=!!owner;
      const action=ownerExists?'UPDATE_MONEY_PAGE':(!ownerExists&&commercial&&score>=68&&(num(row.cpc)>=5||num(forecast?.first_mover_score)>=55)?'CREATE_INTENT_GAP_CONTENT':'NO_ACTION_EVIDENCE_INSUFFICIENT');
      opportunities.push({keyword,row,gsc,owner,forecast,score,action});
    }
    opportunities.sort((a,b)=>b.score-a.score);
    const top=opportunities.slice(0,5);

    let recommendations=0, forecastsWritten=0;
    for(const item of top){
      const forecastKey='seo:'+runDate+':'+norm(item.keyword).replaceAll(' ','-').slice(0,120);
      const probability=Math.max(.05,Math.min(.95,item.score/100));
      const evidence={
        contract:CONTRACT,
        source_chain:['google-search-console','dataforseo-cache','powerhouse-market-forecasts'],
        keyword:item.keyword,
        search_volume:num(item.row.zoekvolume)||null,
        cpc:num(item.row.cpc)||null,
        measured_position:num(item.row.positie)||null,
        ranking_url:item.row.rankende_url||null,
        dataforseo_observed_at:item.row.opgehaald_op,
        gsc:item.gsc,
        intent_owner:item.owner,
        external_forecast:item.forecast?{forecast_id:item.forecast.forecast_id,first_mover_score:num(item.forecast.first_mover_score),confidence:num(item.forecast.confidence),semantic_overlap:num(item.forecast.semantic_overlap)}:null,
        opportunity_score:item.score,
        action:item.action,
        truth_boundary:'forecast and CPC are prioritization signals; they are not realized revenue'
      };
      const {error:fError}=await db.from('powerhouse_forecasts').upsert({
        forecast_key:forecastKey,horizon_start:runDate,horizon_end:new Date(Date.now()+30*86400000).toISOString().slice(0,10),
        scope:'market',scope_key:'seo:'+norm(item.keyword),topic_key:item.keyword,
        predicted_event:'search opportunity progression',predicted_problem:item.owner?'existing intent owner undercaptures demand':'possible distinct intent gap',
        predicted_question:item.keyword,predicted_search_intent:item.keyword,
        predicted_buying_trigger:item.action==='CREATE_INTENT_GAP_CONTENT'?'publish evidence-led first-mover content':item.action==='UPDATE_MONEY_PAGE'?'strengthen canonical money page':null,
        probability,confidence:Math.max(.55,Math.min(.95,.55+(item.score/250))),
        expected_lead_days:30,first_mover_score:item.score,strategic_fit:Math.min(1,item.score/100),
        revenue_potential:0,evidence_signal_ids:[],evidence,status:'active',expected_by:new Date(Date.now()+30*86400000).toISOString().slice(0,10),
        signal_acceleration:Math.min(1,num(item.forecast?.signal_acceleration,item.score/100)),
        market_saturation:Math.max(0,Math.min(1,1-(num(item.forecast?.whitespace_score,.5)))),
        whitespace_score:Math.max(0,Math.min(1,num(item.forecast?.whitespace_score,item.action==='CREATE_INTENT_GAP_CONTENT'?.8:.5))),
        prediction_mode:item.action==='CREATE_INTENT_GAP_CONTENT'?'category_creation':'anticipatory',last_scored_at:observedAt,updated_at:observedAt
      },{onConflict:'forecast_key'});
      if(fError) throw new Error('SEO_FORECAST_WRITE:'+fError.message);
      forecastsWritten++;

      if(item.action==='CREATE_INTENT_GAP_CONTENT'){
        const dedupe='seo-first-mover:'+runDate+':'+norm(item.keyword).replaceAll(' ','-').slice(0,120);
        const reason='SEO first-mover opportunity: '+item.keyword+'; score='+item.score.toFixed(1)+'; volume='+num(item.row.zoekvolume)+'; CPC='+num(item.row.cpc)+'. Distinct intent gap only; verify no canonical owner before publication.';
        const {error:rError}=await db.from('powerhouse_content_recommendations').upsert({
          dedupe_key:dedupe,run_date:runDate,topic_key:item.keyword,content_key:'seo:'+norm(item.keyword),
          target_channel:'blog',recommendation_type:'seo_first_mover_intent_gap',priority:item.score,reason,
          evidence:{...evidence,publication_guard:'CREATE_INTENT_GAP_CONTENT only; canonical owner match must remain absent',cta_target:'/frisse-blik'},
          status:'suggested',updated_at:observedAt
        },{onConflict:'dedupe_key'});
        if(rError) throw new Error('SEO_RECOMMENDATION_WRITE:'+rError.message);
        recommendations++;
      }
    }

    const {error:hError}=await db.from('bg_gezondheid').insert({
      gemeten_op:observedAt,onderdeel:'seo-opportunity-resolver',soort:'search-opportunity-intelligence',status:'ok',
      detail:'keywords='+latestByKeyword.size+'; gsc_queries='+gscByQuery.size+'; top='+top.length+'; recommendations='+recommendations,
      gegevens:{contract:CONTRACT,run_date:runDate,keywords:latestByKeyword.size,gsc_queries:gscByQuery.size,market_forecasts:(forecastResult.data||[]).length,top:top.map(x=>({keyword:x.keyword,score:x.score,action:x.action,owner:x.owner?.route||null})),recommendations,forecasts_written:forecastsWritten}
    });
    if(hError) throw new Error('HEALTH_WRITE:'+hError.message);
    await db.rpc('powerhouse_record_source_observation_v1',{
      p_source_key:'seo-opportunity-intelligence',
      p_dedupe_key:'seo-opportunity-resolver:'+runDate,
      p_external_event_id:'seo-opportunity-resolver:'+runDate,
      p_observed_at:observedAt,
      p_evidence:{contract:CONTRACT,run_date:runDate,recommendations,forecasts_written:forecastsWritten,top:top.map(x=>({keyword:x.keyword,score:x.score,action:x.action}))}
    });
    return json({ok:true,contract:CONTRACT,run_date:runDate,recommendations,forecasts_written:forecastsWritten,top:top.map(x=>({keyword:x.keyword,score:x.score,action:x.action,owner:x.owner?.route||null}))});
  }catch(error:any){
    const detail=clean(error?.message||error).slice(0,500);
    await db.from('bg_gezondheid').insert({gemeten_op:observedAt,onderdeel:'seo-opportunity-resolver',soort:'search-opportunity-intelligence',status:'fout',detail,gegevens:{contract:CONTRACT,run_date:runDate}}).catch(()=>{});
    return json({ok:false,contract:CONTRACT,error:detail},503);
  }
});
