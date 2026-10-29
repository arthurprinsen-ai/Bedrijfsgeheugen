import { createClient } from 'npm:@supabase/supabase-js@2';
import { authorizePowerhouseScheduler } from '../_shared/powerhouse-scheduler-auth.ts';
import { evaluateMiraPublicationFreshness } from '../_shared/mira-publication-freshness.mjs';
import { MIRA_CASES } from '../_shared/mira-entrepreneur-caption.mjs';
import { selectMiraSourceQueries } from '../_shared/mira-source-query-rotation.mjs';

const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const domain=(u:string)=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch{return ''}};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const topic=(text:string)=>{
 const t=text.toLowerCase();
 if(/offerte|salesopvolging|follow.up|acquisitie.*opvolging/.test(t))return'offertes-zonder-opvolging';
 if(/eigenaar.*besluit|directeur.*goedkeur|directie.*bottleneck|escalatie.*directie/.test(t))return'directie-bottleneck';
 if(/kennisoverdracht|kennisborg|sleutelmedewerker|sop|werkinstruct|afspraak.*hoofd/.test(t))return'kennisoverdracht';
 if(/excel|spreadsheet|verschillende cijfers|losse bestanden/.test(t))return'excel-chaos';
 if(/dubbel.*invoe|handmatig.*overzet|crm.*erp|erp.*crm|overtypen/.test(t))return'dubbele-invoer';
 if(/projectmarge|projectbudget|meerwerk/.test(t))return'projectmarge';
 if(/groei.*winst|omzet.*marge/.test(t))return'groei-zonder-winst';
 if(/personeelstekort|capaciteitsplann|backlog|planning.*vol/.test(t))return'capaciteitsplanning';
 if(/debiteur|dso|openstaande factur|oninbare vorder|onbetaalde factur|betalingsachterstand|factuur.*onbetaald|achterstallige betaling/.test(t))return'debiteuren';
 if(/late factur|facturatie.*vertraging|werk.*niet gefactureerd/.test(t))return'late-facturering';
 if(/klantconcentratie|afhankelijk.*grote klant/.test(t))return'klantafhankelijkheid';
 if(/klantverlies|churn|klant.*minder bestell/.test(t))return'klantverlies';
 return '';
};
const portalIds:Record<string,string>={
 'offertes-zonder-opvolging':'PH-P002','directie-bottleneck':'PH-P001','kennisoverdracht':'PH-P005',
 'excel-chaos':'PH-P006','dubbele-invoer':'PH-P007','projectmarge':'PH-P004',
 'groei-zonder-winst':'PH-P003','capaciteitsplanning':'PH-P008','debiteuren':'PH-P010',
 'late-facturering':'PH-P011','klantafhankelijkheid':'PH-P012','klantverlies':'PH-P013'
};
// Fixed eight-call daily budget, varied by business date through the approved PH-P source-topic catalog.
const MAX_AGE_DAYS=45; // inside the shared 60-day gate; Google News ranks by relevance, not recency
// Provider timestamps like "2026-10-26 16:19:48 +00:00" are normalised to ISO so the
// shared freshness gate (which stays the single authority) can parse them.
const isoFromProvider=(v:unknown)=>{
 const raw=String(v??'').trim(); if(!raw) return null;
 const m=raw.match(/^(20\d{2}-\d{2}-\d{2})(?:[T\s]|$)/);
 if(m) return m[1];
 const t=Date.parse(raw); // e.g. RFC 2822 "Mon, 26 Oct 2026 10:00:00 GMT" from Tavily news
 return Number.isFinite(t)?new Date(t).toISOString().slice(0,10):null;
};
const withinWindow=(iso:string|null)=>{
 if(!iso) return false;
 const age=(Date.now()-Date.parse(iso+'T00:00:00Z'))/86400000;
 return age>=-1&&age<=MAX_AGE_DAYS;
};
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST') return json({error:'POST_ONLY'},405);
 const auth=await authorizePowerhouseScheduler(req);
 if(!auth.ok) return json({error:auth.error},auth.status);
 const url=Deno.env.get('SUPABASE_URL'), key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!key) return json({error:'CONFIG'},500);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const tavily=String(Deno.env.get('TAVILY_API_KEY')||((await db.rpc('bg_geheim',{p_naam:'TAVILY_API_KEY'})).data||'')).trim();
 const [dfsLogin,dfsPassword]=await Promise.all([db.rpc('bg_geheim',{p_naam:'DATAFORSEO_LOGIN'}),db.rpc('bg_geheim',{p_naam:'DATAFORSEO_PASSWORD'})]);
 const dfsUser=String(dfsLogin.data||'').trim(), dfsPass=String(dfsPassword.data||'').trim();
 if(!tavily&&!dfsUser) return json({error:'SEARCH_PROVIDER_UNAVAILABLE'},503);
 const providers:Record<string,number>={};
 const search=async(q:string)=>{
   if(tavily){
     const r=await fetch('https://api.tavily.com/search',{method:'POST',headers:{authorization:'Bearer '+tavily,'content-type':'application/json'},body:JSON.stringify({query:q,topic:'news',days:MAX_AGE_DAYS,search_depth:'basic',max_results:8,include_answer:false})});
     const b:any=await r.json().catch(()=>({}));
     if(r.ok){
       providers.tavily_raw=(providers.tavily_raw||0)+(b.results||[]).length;
       const rows=(b.results||[]).map((x:any)=>({url:x.url,title:x.title,content:x.content,score:x.score,publishedAt:isoFromProvider(x.published_date||x.published_at)})).filter((x:any)=>withinWindow(x.publishedAt));
       if(rows.length) return {provider:'tavily_news',results:rows};
     } else if(r.status!==432 && r.status!==429) throw new Error('TAVILY_'+r.status);
   }
   if(dfsUser&&dfsPass){
     // Google News live accepts one task per request and ignores time_range, so the age window is enforced here.
     // The request can be 20000 while the task itself failed (e.g. 40101): check both. Task 40101 (Google-side, no results for a niche query) is counted, not an error.
     let r:Response, b:any, taskCode=0;
     for(let attempt=0;attempt<1;attempt++){
       r=await fetch('https://api.dataforseo.com/v3/serp/google/news/live/advanced',{method:'POST',headers:{authorization:'Basic '+btoa(dfsUser+':'+dfsPass),'content-type':'application/json'},body:JSON.stringify([{keyword:q,location_code:2528,language_code:'nl',depth:20}])});
       b=await r.json().catch(()=>({}));
       taskCode=Number(b?.tasks?.[0]?.status_code||0);
       if(r.ok&&Number(b?.status_code||0)===20000&&taskCode===20000) break;
     }
     if(r!.ok&&Number(b?.status_code||0)===20000&&taskCode===40101){ providers.dataforseo_no_results=(providers.dataforseo_no_results||0)+1; return {provider:'dataforseo_news',results:[]}; }
     if(!r!.ok||Number(b?.status_code||0)!==20000||taskCode!==20000) throw new Error('DATAFORSEO_'+r!.status+'_TASK_'+taskCode);
     const items=Array.isArray(b?.tasks?.[0]?.result?.[0]?.items)?b.tasks[0].result[0].items:[];
     const rows:any[]=[];
     for(const x of items){
       const flat=x.type==='news_search'?[x]:Array.isArray(x.items)?x.items:[x];
       for(const y of flat){ if(y?.url) rows.push({url:y.url,title:y.title,content:y.snippet||y.description||'',score:1/Math.max(1,Number(y.rank_absolute||10)),publishedAt:isoFromProvider(y.timestamp||y.date)}); }
     }
     return {provider:'dataforseo_news',results:rows.filter(x=>withinWindow(x.publishedAt)).slice(0,8)};
   }
   return {provider:'none',results:[]};
 };
 const body=await req.json().catch(()=>({}));
 const runDate=String(body?.runDate||new Date(Date.now()+86400000).toISOString().slice(0,10));
 const queries=selectMiraSourceQueries(runDate);
 let stored=0, eligible=0; const seen=new Set<string>(); const errors:string[]=[];
 for(const q of queries){
  let sr:any; try{sr=await search(q)}catch(e:any){errors.push(q+':'+String(e?.message||e));continue}
  providers[sr.provider]=(providers[sr.provider]||0)+(sr.results||[]).length;
  for(const x of (sr.results||[])){
   const sourceUrl=String(x.url||'').trim(); if(!sourceUrl||seen.has(sourceUrl)) continue; seen.add(sourceUrl);
   const d=domain(sourceUrl); const title=String(x.title||'').trim(); const excerpt=String(x.content||'').slice(0,1800);
   if(!d||title.length<12) continue;
   const problemTopic=topic(title+' '+excerpt); const portalProblemId=portalIds[problemTopic]||''; if(!portalProblemId) continue;
   const all=(title+' '+excerpt).toLowerCase();
   const complaint=/(klacht|erger|irrit|frustr|gedoe|lastig|waardeloos|probleem|werkt niet|kan niet|steeds|moet ik|waarom)/.test(all)?1:0.55;
   const personal=/(ondernemer|bedrijf|mkb|directie|medewerker|collega|crm|erp|project|offerte|factur|planning|excel|proces|klant)/.test(all)?1:0.6;
   const share=/(herken|iedereen|steeds|elke keer|weer|waarom)/.test(all)?0.95:0.65;
   const evidence=clamp(Number(x.score)||0.5);
   const publication=evaluateMiraPublicationFreshness({providerPublishedAt:x.publishedAt,title,excerpt,observedAt:Date.now()});
   const recency=publication.score;
   const originality=0.8;
   const total=Math.round((recency*.10+personal*.23+complaint*.25+share*.18+originality*.12+evidence*.12)*1000)/1000;
   const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sourceUrl+'|'+title));
   const sourceHash=[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('');
   const row={source_url:sourceUrl,source_domain:d,source_type:d.includes('reddit')||d.includes('tweakers')?'forum':d.includes('radar')||d.includes('kassa')?'consumer_complaint':'blog_web',title,excerpt,topic_key:problemTopic,source_published_at:publication.publishedAt,observed_at:new Date().toISOString(),freshness_score:recency,recognition_score:personal,friction_score:complaint,shareability_score:share,originality_score:originality,evidence_score:evidence,total_score:total,eligible:total>=0.72&&publication.eligible&&Boolean(portalProblemId),source_hash:sourceHash,metadata:{query:q,search_provider:sr.provider,provider_score:x.score??null,source_publication_date_status:publication.status,source_age_days:publication.ageDays,source_publication_date_evidence:publication.publishedAt?'DATED':'UNVERIFIED',contract:'mira-entrepreneur-portal-story-v1',audience:'ondernemers',portal_problem_id:portalProblemId,approved_mira_scene:MIRA_CASES.find(c=>c.id===portalProblemId)?.scene||null,evidence_kind:'public_signal_not_customer_fact',fictional_mira_scenario:true}};
   const up=await db.from('powerhouse_mira_problem_signals_v1').upsert(row,{onConflict:'source_url'}); if(up.error){errors.push('upsert:'+up.error.message);continue}
   stored++; if(row.eligible) eligible++;
  }
 }
 const mat=await db.rpc('powerhouse_materialize_mira_problem_recommendation_v1',{p_date:runDate});
 return json({ok:errors.length===0,runDate,stored,eligible,providers,max_age_days:MAX_AGE_DAYS,materialized:mat.data,errors});
});
