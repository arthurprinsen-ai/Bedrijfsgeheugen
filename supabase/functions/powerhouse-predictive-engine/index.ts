const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store','access-control-allow-origin':'*','access-control-allow-headers':'content-type,x-powerhouse-token','access-control-allow-methods':'POST,OPTIONS'}});
const clean=(v:unknown)=>String(v??'').replace(/\s+/g,' ').trim();
const num=(v:unknown,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
const arr=(v:unknown)=>Array.isArray(v)?v:[];
const base=clean(Deno.env.get('SUPABASE_URL')).replace(/\/$/,'');
const service=clean(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
const headers={apikey:service,authorization:`Bearer ${service}`,'content-type':'application/json',accept:'application/json'};

async function sha256(value:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function authorized(req:Request){const raw=clean(req.headers.get('x-powerhouse-token'));if(!raw||!base||!service)return false;const hash=await sha256(raw);const r=await fetch(`${base}/rest/v1/powerhouse_device_tokens?token_hash=eq.${encodeURIComponent(hash)}&active=eq.true&select=scopes&limit=1`,{headers});if(!r.ok)return false;const row=(await r.json())?.[0];return !!row&&arr(row.scopes).includes('daily')}
async function rest(path:string,init:RequestInit={}){const r=await fetch(`${base}/rest/v1/${path}`,{...init,headers:{...headers,...(init.headers||{})}});const text=await r.text();let data:any=null;try{data=text?JSON.parse(text):null}catch{data=text}if(!r.ok)throw new Error(`REST_${r.status}:${String(text).slice(0,500)}`);return data}
async function upsert(table:string,onConflict:string,row:any){return rest(`${table}?on_conflict=${encodeURIComponent(onConflict)}`,{method:'POST',headers:{prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(row)})}

function evidenceQuality(s:any){return clamp(.45*num(s.brontrouw,.5)+.25*num(s.bevestiging,.5)+.15*num(s.versheid,.5)+.15*num(s.relevantie,.5))}
function freshness(published:any,fallback=.55){if(!published)return fallback;const age=(Date.now()-new Date(published).getTime())/86400000;if(!Number.isFinite(age))return fallback;return clamp(1-age/90)}
function acceleration(rows:any[]){if(rows.length<2)return 0;const times=rows.map(x=>new Date(x.gepubliceerd_op||x.opgehaald_op||0).getTime()).filter(Number.isFinite).sort((a,b)=>a-b);if(times.length<2)return 0;const span=Math.max(1,(times[times.length-1]-times[0])/86400000);return clamp((times.length/span)/2,-1,1)}
function score(p:number,c:number,a:number,s:number,commercial:number,white:number,saturation:number,lead:number){return Math.round(10000*(clamp(p)*clamp(c)*clamp((a+1)/2)*clamp(s)*clamp(commercial)*clamp(white)*(1-clamp(saturation))*(.5+.5*clamp(lead/90))))/100}

async function run(){
  const runRows=await rest('powerhouse_predictive_runs',{method:'POST',headers:{prefer:'return=representation'},body:JSON.stringify({run_type:'engine',state:'started',evidence:{contract:'predictive-first-mover-intelligence-v1'}})});
  const runId=runRows?.[0]?.run_id;
  try{
    const external=arr(await rest('bg_externe_signalen?toegestaan=eq.true&select=url,onderwerp,titel,samenvatting,domein,gepubliceerd_op,opgehaald_op,brontrouw,bevestiging,versheid,relevantie,vertrouwen&order=opgehaald_op.desc&limit=250').catch(()=>[]));
    const keywords=arr(await rest('bg_zoekwoordkansen?select=zoekwoord,zaadwoord,zoekvolume,concurrentie,cpc,kansscore,positie,rankende_url,bron,opgehaald_op&order=kansscore.desc.nullslast&limit=100').catch(()=>[]));
    const byTopic=new Map<string,any[]>();
    for(const e of external){const topic=clean(e.onderwerp)||'onbekend';if(!byTopic.has(topic))byTopic.set(topic,[]);byTopic.get(topic)!.push(e)}
    let signals=0,forecasts=0,recommendations=0;
    const produced:any[]=[];
    for(const [topic,rows] of byTopic){
      const independent=new Set(rows.map(x=>clean(x.domein)).filter(Boolean));
      const ranked=rows.sort((a,b)=>evidenceQuality(b)-evidenceQuality(a));
      const top=ranked.slice(0,5);
      const quality=top.reduce((s,x)=>s+evidenceQuality(x),0)/Math.max(1,top.length);
      const acc=acceleration(rows);
      const topicKeywords=keywords.filter(k=>clean(`${k.zoekwoord} ${k.zaadwoord}`).toLowerCase().includes(topic.toLowerCase().split(' ')[0]));
      const searchDemand=clamp(topicKeywords.reduce((s,k)=>s+Math.log10(1+Math.max(0,num(k.zoekvolume))),0)/10);
      const saturation=clamp(.15+.12*Math.min(5,independent.size)+.35*searchDemand);
      const whitespace=1-saturation;
      const strategicFit=clamp(.6+.2*quality);
      const commercial=clamp(.5+.25*searchDemand+.15*quality);
      const corroborated=independent.size>=2&&quality>=.55;
      for(const e of top){
        const signalKey=await sha256(`external|${e.url}`);
        await upsert('powerhouse_predictive_signals','dedupe_key',{dedupe_key:signalKey,source_type:'external',source_ref:e.url,topic_key:topic,signal_statement:clean(e.titel||e.samenvatting),freshness:freshness(e.gepubliceerd_op,num(e.versheid,.5)),novelty:whitespace,velocity:clamp(rows.length/20),acceleration:acc,strategic_fit:strategicFit,evidence_quality:evidenceQuality(e),evidence_refs:[e.url],observed_at:e.gepubliceerd_op||e.opgehaald_op||new Date().toISOString(),updated_at:new Date().toISOString()});signals++;
      }
      if(!corroborated)continue;
      const p=clamp(.45+.3*quality+.15*acc+.1*searchDemand);
      const c=clamp(.45+.35*quality+.1*Math.min(1,independent.size/3)+.1*searchDemand);
      const horizon=p>.72?30:90;
      const lead=Math.max(7,Math.round(horizon*(.65+.25*whitespace)));
      const evidenceRefs=top.map(x=>x.url).filter(Boolean).slice(0,5);
      if(evidenceRefs.length<2)continue;
      const dedupe=await sha256(`forecast|${topic}|${horizon}|${new Date().toISOString().slice(0,10)}`);
      const expectedBy=new Date(Date.now()+horizon*86400000).toISOString();
      const firstMover=score(p,c,acc,strategicFit,commercial,whitespace,saturation,lead);
      const statement=`De kans neemt toe dat ${topic.toLowerCase()} binnen circa ${horizon} dagen een explicieter probleem, zoek- of koopmoment wordt voor het MKB.`;
      const forecast=(await upsert('powerhouse_forecasts','dedupe_key',{dedupe_key:dedupe,topic_key:topic,forecast_statement:statement,expected_problem:topic,expected_search_intent:topic,expected_buying_trigger:`toenemende urgentie rond ${topic}`,horizon_days:horizon,expected_by:expectedBy,probability:p,confidence:c,expected_lead_days:lead,market_saturation:saturation,strategic_fit:strategicFit,commercial_potential:commercial,signal_acceleration:acc,whitespace,lifecycle:'active',evidence_refs:evidenceRefs,score_components:{quality,independent_sources:independent.size,search_demand:searchDemand,first_mover_score:firstMover},activated_at:new Date().toISOString(),updated_at:new Date().toISOString()}))?.[0];
      if(!forecast)continue;forecasts++;
      const claimKey=await sha256(`claim|${forecast.forecast_id}|anticipatory`);
      const claim=(await upsert('powerhouse_first_mover_claims','dedupe_key',{forecast_id:forecast.forecast_id,dedupe_key:claimKey,prediction_mode:'anticipatory',claim_text:statement,frame:'verwachting op basis van meerdere signalen',term:topic,prediction_rationale:`${independent.size} onafhankelijke bronnen; confidence ${c.toFixed(2)}; saturation ${saturation.toFixed(2)}. Dit is een voorspelling, geen bestaand feit.`,evidence_refs:evidenceRefs,status:'candidate',updated_at:new Date().toISOString()}))?.[0];
      const recKey=`predictive:${forecast.forecast_id}`;
      await upsert('powerhouse_content_recommendations','dedupe_key',{dedupe_key:recKey,run_date:new Date().toISOString().slice(0,10),topic_key:topic,recommendation_type:'predictive_first_mover',priority:firstMover,reason:`Anticipatory opportunity from predictive-first-mover-intelligence-v1. Forecast, not fact.`,evidence:{forecast_id:forecast.forecast_id,claim_id:claim?.claim_id||null,prediction_mode:'anticipatory',prediction_rationale:claim?.prediction_rationale||null,evidence_refs:evidenceRefs,first_mover_score:firstMover},status:'suggested',updated_at:new Date().toISOString()});recommendations++;
      produced.push({forecast_id:forecast.forecast_id,topic,first_mover_score:firstMover});
    }
    const state=external.length===0?'degraded':'completed';
    const degraded=external.length===0?'no_allowed_external_signals':null;
    if(runId)await rest(`powerhouse_predictive_runs?run_id=eq.${runId}`,{method:'PATCH',headers:{prefer:'return=minimal'},body:JSON.stringify({state,input_count:external.length+keywords.length,output_count:forecasts,evidence:{signals,forecasts,recommendations,produced},degraded_reason:degraded,completed_at:new Date().toISOString()})});
    return {ok:state==='completed',state,signals,forecasts,recommendations,produced,degraded_reason:degraded};
  }catch(error){if(runId)await rest(`powerhouse_predictive_runs?run_id=eq.${runId}`,{method:'PATCH',headers:{prefer:'return=minimal'},body:JSON.stringify({state:'failed',degraded_reason:clean((error as Error).message),completed_at:new Date().toISOString()})}).catch(()=>{});throw error}
}

Deno.serve(async(req)=>{if(req.method==='OPTIONS')return json({ok:true});if(req.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);if(!await authorized(req))return json({ok:false,error:'UNAUTHORIZED'},401);try{return json(await run())}catch(error){return json({ok:false,error:clean((error as Error).message)},500)}});
