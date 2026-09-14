const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store','access-control-allow-origin':'*','access-control-allow-headers':'content-type,x-powerhouse-token','access-control-allow-methods':'POST,OPTIONS'}});
const clean=(v:unknown)=>String(v??'').replace(/\s+/g,' ').trim();
const num=(v:unknown,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const arr=(v:unknown)=>Array.isArray(v)?v:[];
const base=clean(Deno.env.get('SUPABASE_URL')).replace(/\/$/,'');
const service=clean(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
const headers={apikey:service,authorization:`Bearer ${service}`,'content-type':'application/json',accept:'application/json'};

async function sha256(value:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function authorized(req:Request){const raw=clean(req.headers.get('x-powerhouse-token'));if(!raw||!base||!service)return false;const hash=await sha256(raw);const r=await fetch(`${base}/rest/v1/powerhouse_device_tokens?token_hash=eq.${encodeURIComponent(hash)}&active=eq.true&select=scopes&limit=1`,{headers});if(!r.ok)return false;const row=(await r.json())?.[0];return !!row&&arr(row.scopes).includes('daily')}
async function rest(path:string,init:RequestInit={}){const r=await fetch(`${base}/rest/v1/${path}`,{...init,headers:{...headers,...(init.headers||{})}});const text=await r.text();let data:any=null;try{data=text?JSON.parse(text):null}catch{data=text}if(!r.ok)throw new Error(`REST_${r.status}:${String(text).slice(0,500)}`);return data}
async function upsert(table:string,onConflict:string,row:any){return rest(`${table}?on_conflict=${encodeURIComponent(onConflict)}`,{method:'POST',headers:{prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(row)})}
function brier(probability:number,outcome:number){return Math.round(Math.pow(probability-outcome,2)*1000000)/1000000}
function isCommercial(type:string){return /lead|meeting|offer|order|revenue|website_conversion/i.test(type)}

async function calibrate(){
  const started=(await rest('powerhouse_predictive_runs',{method:'POST',headers:{prefer:'return=representation'},body:JSON.stringify({run_type:'calibrator',state:'started',evidence:{contract:'predictive-first-mover-intelligence-v1'}})}))?.[0];
  const runId=started?.run_id;
  try{
    const due=arr(await rest('powerhouse_forecasts_due_calibration?select=*&limit=100'));
    const results:any[]=[];
    for(const f of due){
      const topic=clean(f.topic_key);
      const since=encodeURIComponent(f.activated_at||f.created_at);
      const events=arr(await rest(`powerhouse_runtime_events?topic_key=eq.${encodeURIComponent(topic)}&occurred_at=gte.${since}&select=event_id,event_type,occurred_at,source,context&order=occurred_at.asc&limit=100`).catch(()=>[]));
      const outcomes=arr(await rest(`powerhouse_sales_outcomes?topic_key=eq.${encodeURIComponent(topic)}&created_at=gte.${since}&select=outcome_id,outcome_type,revenue_eur,created_at,evidence&order=created_at.asc&limit=100`).catch(()=>[]));
      const materialEvent=events.find((e:any)=>isCommercial(clean(e.event_type)));
      const materialOutcome=outcomes.find((o:any)=>isCommercial(clean(o.outcome_type))||num(o.revenue_eur)>0);
      const observed=materialEvent||materialOutcome;
      const outcome=observed?1:0;
      const observedAt=observed?.occurred_at||observed?.created_at||new Date().toISOString();
      const activatedAt=new Date(f.activated_at||f.created_at).getTime();
      const actualLead=outcome===1&&Number.isFinite(activatedAt)?Math.max(0,(new Date(observedAt).getTime()-activatedAt)/86400000):null;
      const revenue=outcomes.reduce((sum:number,o:any)=>sum+Math.max(0,num(o.revenue_eur)),0);
      const refs=[...events.slice(0,5).map((e:any)=>`runtime:${e.event_id}`),...outcomes.slice(0,5).map((o:any)=>`outcome:${o.outcome_id}`)];
      const dedupe=await sha256(`calibration|${f.forecast_id}|${f.expected_by}`);
      await upsert('powerhouse_forecast_calibration','dedupe_key',{forecast_id:f.forecast_id,dedupe_key:dedupe,outcome,observed_at:observedAt,materialized_at:outcome===1?observedAt:null,actual_lead_days:actualLead,brier_component:brier(num(f.probability),outcome),leads:events.filter((e:any)=>/lead|website_conversion/i.test(clean(e.event_type))).length,meetings:events.filter((e:any)=>/meeting/i.test(clean(e.event_type))).length,proposals:events.filter((e:any)=>/offer/i.test(clean(e.event_type))).length,orders:events.filter((e:any)=>/order/i.test(clean(e.event_type))).length,revenue_eur:revenue,attribution_confidence:outcome===1?Math.min(1,.55+.1*Math.min(4,refs.length)):0,evidence_refs:refs,notes:outcome===1?'Observed commercial evidence matched the pre-registered topic.':'No qualifying commercial evidence observed by expected_by.'});
      await rest(`powerhouse_forecasts?forecast_id=eq.${f.forecast_id}`,{method:'PATCH',headers:{prefer:'return=minimal'},body:JSON.stringify({lifecycle:outcome===1?'materialized':'missed',resolved_at:new Date().toISOString(),updated_at:new Date().toISOString()})});
      results.push({forecast_id:f.forecast_id,outcome,brier_component:brier(num(f.probability),outcome),revenue_eur:revenue,evidence_refs:refs});
    }
    if(runId)await rest(`powerhouse_predictive_runs?run_id=eq.${runId}`,{method:'PATCH',headers:{prefer:'return=minimal'},body:JSON.stringify({state:'completed',input_count:due.length,output_count:results.length,evidence:{calibrations:results},completed_at:new Date().toISOString()})});
    return {ok:true,state:'completed',due:due.length,calibrated:results.length,results};
  }catch(error){if(runId)await rest(`powerhouse_predictive_runs?run_id=eq.${runId}`,{method:'PATCH',headers:{prefer:'return=minimal'},body:JSON.stringify({state:'failed',degraded_reason:clean((error as Error).message),completed_at:new Date().toISOString()})}).catch(()=>{});throw error}
}

Deno.serve(async(req)=>{if(req.method==='OPTIONS')return json({ok:true});if(req.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);if(!await authorized(req))return json({ok:false,error:'UNAUTHORIZED'},401);try{return json(await calibrate())}catch(error){return json({ok:false,error:clean((error as Error).message)},500)}});
