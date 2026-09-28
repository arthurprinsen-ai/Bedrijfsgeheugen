import { createClient } from 'npm:@supabase/supabase-js@2';

const CONTRACT='powerhouse-relationship-public-research-v1';
const ENDPOINT='https://api.dataforseo.com/v3/serp/google/organic/live/advanced';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const clean=(v:unknown)=>String(v??'').trim();
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
const TRIGGERS=[
  ['post_merger_integration',/(post[- ]?merger|post[- ]?acquisition|integratie na overname)/i],
  ['investor_pe',/(private equity|investeerder|investor|participatie|portfolio company)/i],
  ['buy_sell_ma',/(overname|acquisition|merger|fusie|m&a)/i],
  ['new_management',/(nieuwe (ceo|cfo|coo|directeur)|new (ceo|cfo|coo|director)|appointed|benoemd)/i],
  ['growth',/(snelle groei|rapid growth|headcount growth|personeelsgroei|nieuwe vestiging|new location|scale[- ]?up|scaling)/i],
  ['erp_afas_change',/(afas|\berp\b|sap s\/4|dynamics 365|exact online|erp implementatie|erp migration|systeemmigratie)/i],
  ['margin_cost_cashflow_pressure',/(margedruk|margin pressure|kostenstijging|cost pressure|cashflow|werkkapitaal|verlieslatend|profit warning)/i],
  ['talent_shortage_key_person_risk',/(personeelstekort|staff shortage|talent shortage|sleutelpersoon|key person|vacaturestop|hiring freeze)/i],
  ['regulation',/(ai act|nis2|csrd|avg|gdpr|wetgeving|regulation|compliance)/i],
  ['financing',/(financiering|funding round|funding|refinancing|refinanciering|bankfinanciering)/i],
  ['turnaround',/(turnaround|reorganisatie|restructuring|herstructurering|faillissement|insolvency|surseance)/i],
  ['ai_data_digitalisation',/(kunstmatige intelligentie|artificial intelligence|digitalisering|digital transformation|automatisering|automation|data platform|dataplatform|\bai\b)/i],
] as const;

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST') return json({ok:false,error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL')||'', service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!service) return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const expected=clean((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data);
  if(!expected||req.headers.get('x-powerhouse-token')!==expected) return json({ok:false,error:'UNAUTHORIZED'},401);

  const observedAt=new Date().toISOString();
  try{
    const [{data:login},{data:password}]=await Promise.all([
      db.rpc('bg_geheim',{p_naam:'DATAFORSEO_LOGIN'}),
      db.rpc('bg_geheim',{p_naam:'DATAFORSEO_PASSWORD'})
    ]);
    const user=clean(login),pass=clean(password);
    if(!user||!pass) throw new Error('DATAFORSEO_CREDENTIALS_MISSING');

    const {data:actions,error:aErr}=await db.from('powerhouse_sales_actions')
      .select('action_id,dedupe_key,person_key,company_key,company_name,person_name,role,priority,evidence')
      .eq('action_type','research_enrichment').eq('channel','internal').in('status',['suggested','prepared','waiting'])
      .like('dedupe_key','relationship-research:%').order('priority',{ascending:false}).limit(10);
    if(aErr) throw new Error('ACTIONS:'+aErr.message);

    let researched=0,matched=0,events=0,noEvidence=0;
    const auth='Basic '+btoa(user+':'+pass);

    for(const action of actions||[]){
      const company=clean(action.company_name||action.company_key);
      if(!company) continue;
      researched++;
      const keyword='"'+company+'" (groei OR overname OR fusie OR investering OR financiering OR vacature OR AI OR ERP OR digitalisering OR reorganisatie)';
      const res=await fetch(ENDPOINT,{
        method:'POST',
        headers:{authorization:auth,'content-type':'application/json'},
        body:JSON.stringify([{keyword,location_code:2528,language_code:'nl',device:'desktop',depth:10}])
      });
      const body:any=await res.json().catch(()=>({}));
      if(!res.ok||Number(body?.status_code||0)!==20000) throw new Error('DATAFORSEO_HTTP_'+res.status);
      const items=Array.isArray(body?.tasks?.[0]?.result?.[0]?.items)?body.tasks[0].result[0].items:[];
      const organic=items.filter((x:any)=>x?.type==='organic').slice(0,10);
      let best:any=null;
      for(const item of organic){
        const title=clean(item?.title),desc=clean(item?.description),link=clean(item?.url);
        const text=[title,desc].join(' ');
        const companyNorm=company.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); const textNorm=[title,desc,link].join(' ').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); if(!companyNorm||!textNorm.includes(companyNorm)) continue;
        const hit=TRIGGERS.find(([,rx])=>rx.test(text));
        if(hit){best={trigger_type:hit[0],title,summary:desc,url:link,rank:Number(item?.rank_absolute||item?.rank_group||99)};break;}
      }

      if(best){
        matched++;
        const confidence=clamp(0.62+Math.max(0,10-Math.min(10,best.rank))*0.02);
        const dedupe='relationship-public-research:'+action.action_id+':'+best.trigger_type;
        const {error:eErr}=await db.from('powerhouse_runtime_events').upsert({
          dedupe_key:dedupe,event_type:'relationship_public_research_evidence',source:CONTRACT,
          subject_key:'relationship:'+action.person_key,person_key:action.person_key,company_key:action.company_key,
          occurred_at:observedAt,
          evidence:{contract:CONTRACT,trigger_type:best.trigger_type,trigger:best.title,headline:best.title,summary:best.summary,source_url:best.url,provider:'dataforseo-serp',vendor_enrichment:false,evidence_only:true},
          context:{person_name:action.person_name,company_name:action.company_name,role:action.role,research_action_id:action.action_id,external_side_effects:false},
          state:'observed',data_quality:'VERIFIED',confidence
        },{onConflict:'dedupe_key'});
        if(eErr) throw new Error('EVENT:'+eErr.message);
        events++;

        const {error:uErr}=await db.from('powerhouse_sales_actions').update({
          status:'done',executed_at:observedAt,source_url:best.url,
          evidence:{...(action.evidence||{}),public_research_execution:{contract:CONTRACT,trigger_type:best.trigger_type,headline:best.title,summary:best.summary,source_url:best.url,confidence,observed_at:observedAt,provider:'dataforseo-serp',vendor_used:false,evidence_only:true}}
        }).eq('action_id',action.action_id);
        if(uErr) throw new Error('ACTION_UPDATE:'+uErr.message);
      }else{
        noEvidence++;
        const {error:uErr}=await db.from('powerhouse_sales_actions').update({
          status:'waiting',
          evidence:{...(action.evidence||{}),public_research_execution:{contract:CONTRACT,no_current_trigger_evidence:true,researched_at:observedAt,provider:'dataforseo-serp',vendor_used:false,evidence_only:true}}
        }).eq('action_id',action.action_id);
        if(uErr) throw new Error('ACTION_WAIT:'+uErr.message);
      }
    }

    if(events>0){
      const {error:rErr}=await db.rpc('powerhouse_refresh_trigger_based_mkb_acquisition_v1',{p_run_date:observedAt.slice(0,10)});
      if(rErr) throw new Error('TRIGGER_REFRESH:'+rErr.message);
    }
    await db.from('bg_gezondheid').insert({
      gemeten_op:observedAt,onderdeel:'relationship-public-research',soort:'commercial-intelligence',
      status:'ok',detail:`researched=${researched}; matched=${matched}; events=${events}; no_evidence=${noEvidence}`,
      gegevens:{contract:CONTRACT,researched,matched,events,no_evidence:noEvidence,vendor_enrichment:false,external_outreach_executed:false}
    });
    return json({ok:true,contract:CONTRACT,researched,matched,events,no_evidence:noEvidence,vendor_enrichment:false,external_outreach_executed:false,observed_at:observedAt});
  }catch(error:any){
    const detail=clean(error?.message||error).slice(0,500);
    try { await db.from('bg_gezondheid').insert({gemeten_op:observedAt,onderdeel:'relationship-public-research',soort:'commercial-intelligence',status:'fout',detail,gegevens:{contract:CONTRACT}}); } catch { /* best-effort failure telemetry */ }
    return json({ok:false,contract:CONTRACT,error:detail},503);
  }
});
