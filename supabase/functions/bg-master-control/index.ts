import { createClient } from 'npm:@supabase/supabase-js@2';
import { isAuthorizedRepairRequest } from './security.mjs';
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
Deno.serve(async(req:Request)=>{
  if(req.method!=='POST') return json({error:'METHOD_NOT_ALLOWED'},405);
  // Security boundary: no DB client, secrets or telemetry before server credential verification.
  if(!(await isAuthorizedRepairRequest(req,Deno.env)))return json({error:'UNAUTHORIZED'},401);
  const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); if(!url||!key) return json({error:'CONFIG'},500);
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  try{
    const [{data:bufferLog},{data:postMetrics},{data:rules},{data:lastReview},{data:predictive},{data:outcomes},{data:daily}]=await Promise.all([
      db.from('bg_buffer_sync').select('*').order('uitgevoerd_op',{ascending:false}).limit(1),
      db.from('bg_post_prestatie').select('*').order('bijgewerkt_op',{ascending:false}).limit(10),
      db.from('bg_schrijfregels').select('regel_id,onderwerp,regel,vertrouwen,status').eq('status','actief'),
      db.from('bg_post_review_log').select('*').order('reviewed_at',{ascending:false}).limit(5),
      db.rpc('powerhouse_predictive_health',{}),
      db.from('growth_outcomes').select('revenue_eur,stage,occurred_at').gte('occurred_at','2026-09-14T00:00:00Z'),
      db.from('powerhouse_daily_runs').select('run_date,state,evidence,updated_at').order('run_date',{ascending:false}).limit(1)
    ]);
    const realized=(outcomes||[]).reduce((s:number,o:any)=>s+Number(o.revenue_eur||0),0);
    const target=1000000, remaining=Math.max(0,target-realized);
    const days=Math.max(1,Math.ceil((new Date('2027-09-14T23:59:59+02:00').getTime()-Date.now())/86400000));
    const avgPerformance=postMetrics?.length?Math.round((postMetrics.reduce((sum:number,p:any)=>sum+(p.interactie_pct||0),0)/postMetrics.length)*100)/100:0;
    return json({ok:true,system_status:(predictive as any)?.healthy?'OPERATIONAL':'DEGRADED',timestamp:new Date().toISOString(),pipeline:{last_buffer_sync:bufferLog?.[0]?.uitgevoerd_op||null,last_buffer_ok:bufferLog?.[0]?.status==='ok',posts_with_metrics:postMetrics?.length||0,avg_engagement_pct:avgPerformance,daily_run:daily?.[0]||null},predictive_intelligence:predictive||null,revenue_north_star:{contract:'growth-revenue-os-1m-2027-v1',target_eur:target,deadline:'2027-09-14',realized_since_2026_09_14_eur:realized,remaining_eur:remaining,days_remaining:days,required_average_eur_per_day:Math.round((remaining/days)*100)/100},intelligence:{active_rules:(rules||[]).length,predictive_contract_active:(rules||[]).some((r:any)=>r.regel_id==='predictive-first-mover-intelligence-v1'),rules:(rules||[]).map((r:any)=>({id:r.regel_id,subject:r.onderwerp,confidence:r.vertrouwen}))},outreach:{last_5_reviews:lastReview||[]},daily_order:['05:50 UTC forecast calibration','06:05 UTC Powerhouse revenue/growth runtime','06:08 UTC predictive first-mover engine','06:12 UTC content orchestrator','daytime social publisher + Buffer readback','hourly :47 execution guard']});
  }catch(_e:any){return json({error:'SERVICE_UNAVAILABLE'},503);}
});