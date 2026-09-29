import { createClient } from 'npm:@supabase/supabase-js@2';

const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const domain=(u:string)=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch{return ''}};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const topic=(text:string)=>{
 const t=text.toLowerCase();
 if(/wachtwoord|inlog|2fa|code/.test(t)) return 'wachtwoord-en-inloggen';
 if(/school|ouderportaal|magister|parro|social schools/.test(t)) return 'schoolapps-en-oudercommunicatie';
 if(/parkeren|parkeerapp|zone/.test(t)) return 'parkeren-en-apps';
 if(/pakket|bezorg|postnl|dhl/.test(t)) return 'bezorging-en-pakketten';
 if(/abonnement|opzeg|subscription/.test(t)) return 'abonnementen-en-opzeggen';
 if(/chatbot|klantenservice|helpdesk/.test(t)) return 'chatbots-en-klantenservice';
 if(/melding|notificatie|whatsapp|groep/.test(t)) return 'meldingen-en-groepsapps';
 if(/update|app|account|scherm/.test(t)) return 'appstapeling-en-digitale-frictie';
 return 'dagelijkse-digitale-frictie';
};
const queries=[
 '2026 Nederland klacht irritant app account wachtwoord inloggen 2FA gewone gebruiker forum blog',
 '2026 Nederland forum ergernis schoolapp ouderportaal berichten meldingen ouders',
 '2026 Nederland klacht parkeerapp zone account betalen parkeren forum',
 '2026 Nederland forum klacht pakket bezorger niet thuis bezorging app',
 '2026 Nederland klacht abonnement opzeggen app klantenservice chatbot consumenten',
 '2026 Nederland blog digitale frustratie te veel apps schermen bevestigingen dagelijks leven'
];
const complaintRichDomains=['reddit.com','tweakers.net','radar.avrotros.nl','kassa.bnnvara.nl','klachtenkompas.nl','consumentenbond.nl','ecommercenews.nl'];
const blockedPath=/(\/contact\/?$|\/support\/?$|\/service\/?$|\/help\/?$|\/faq\/?$|mijnomgeving|klantenservice\/?$)/i;
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST') return json({error:'POST_ONLY'},405);
 const url=Deno.env.get('SUPABASE_URL'), key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!key) return json({error:'CONFIG'},500);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const incoming=req.headers.get('x-powerhouse-token')||'';
 const expected=String((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data||'');
 if(!expected||incoming!==expected) return json({error:'UNAUTHORIZED'},401);
 const tavily=String(Deno.env.get('TAVILY_API_KEY')||((await db.rpc('bg_geheim',{p_naam:'TAVILY_API_KEY'})).data||'')).trim();
 const [dfsLogin,dfsPassword]=await Promise.all([db.rpc('bg_geheim',{p_naam:'DATAFORSEO_LOGIN'}),db.rpc('bg_geheim',{p_naam:'DATAFORSEO_PASSWORD'})]);
 const dfsUser=String(dfsLogin.data||'').trim(), dfsPass=String(dfsPassword.data||'').trim();
 if(!tavily&&!dfsUser) return json({error:'SEARCH_PROVIDER_UNAVAILABLE'},503);
 const search=async(q:string)=>{
   if(tavily){
     const r=await fetch('https://api.tavily.com/search',{method:'POST',headers:{authorization:'Bearer '+tavily,'content-type':'application/json'},body:JSON.stringify({query:q,topic:'general',search_depth:'basic',max_results:6,include_answer:false})});
     const b:any=await r.json().catch(()=>({}));
     if(r.ok) return {provider:'tavily',results:(b.results||[]).map((x:any)=>({url:x.url,title:x.title,content:x.content,score:x.score}))};
     if(r.status!==432 && r.status!==429) throw new Error('TAVILY_'+r.status);
   }
   if(dfsUser&&dfsPass){
     const r=await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced',{method:'POST',headers:{authorization:'Basic '+btoa(dfsUser+':'+dfsPass),'content-type':'application/json'},body:JSON.stringify([{keyword:q,location_code:2528,language_code:'nl',device:'desktop',os:'windows',depth:10}])});
     const b:any=await r.json().catch(()=>({}));
     if(!r.ok||Number(b?.status_code||0)!==20000) throw new Error('DATAFORSEO_'+r.status);
     const items=Array.isArray(b?.tasks?.[0]?.result?.[0]?.items)?b.tasks[0].result[0].items:[];
     return {provider:'dataforseo',results:items.filter((x:any)=>x.type==='organic'&&x.url).slice(0,6).map((x:any)=>({url:x.url,title:x.title,content:x.description||'',score:1/Math.max(1,Number(x.rank_absolute||10))}))};
   }
   return {provider:'none',results:[]};
 };
 const body=await req.json().catch(()=>({}));
 const runDate=String(body?.runDate||new Date(Date.now()+86400000).toISOString().slice(0,10));
 let stored=0, eligible=0; const seen=new Set<string>(); const errors:string[]=[];
 for(const q of queries){
  let sr:any; try{sr=await search(q)}catch(e:any){errors.push(q+':'+String(e?.message||e));continue}
  for(const x of (sr.results||[])){
   const sourceUrl=String(x.url||'').trim(); if(!sourceUrl||seen.has(sourceUrl)) continue; seen.add(sourceUrl);
   const d=domain(sourceUrl); const title=String(x.title||'').trim(); const excerpt=String(x.content||'').slice(0,1800);
   if(!d||title.length<12) continue;
   const all=(title+' '+excerpt).toLowerCase();
   const explicitComplaint=/(klacht|erger|irrit|frustr|gedoe|waardeloos|werkt niet|kan niet|onterecht|misleid|teleurgesteld|elke keer|steeds weer|waarom moet)/.test(all);
   const richDomain=complaintRichDomains.some(v=>d===v||d.endsWith('.'+v));
   const blocked=blockedPath.test(sourceUrl) || /^(contact opnemen|klantenservice|support|service)$/i.test(title);
   const complaint=(explicitComplaint||richDomain)?1:0.35;
   const personal=/(\bik\b|\bmijn\b|thuis|kind|school|parkeren|pakket|wachtwoord|app|abonnement|chatbot)/.test(all)?1:0.6;
   const share=/(herken|iedereen|steeds|elke keer|weer|waarom)/.test(all)?0.95:0.65;
   const evidence=clamp(Number(x.score)||0.5);
   const yearMatch=all.match(/\b(20\d{2})\b/);
   const year=yearMatch?Number(yearMatch[1]):null;
   const recency=year===null?0.6:year>=2026?1:year===2025?0.75:0.35;
   const originality=0.8;
   const total=Math.round((recency*.17+personal*.18+complaint*.28+share*.15+originality*.10+evidence*.12)*1000)/1000;
   const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sourceUrl+'|'+title));
   const sourceHash=[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('');
   const row={source_url:sourceUrl,source_domain:d,source_type:d.includes('reddit')||d.includes('tweakers')?'forum':d.includes('radar')||d.includes('kassa')||d.includes('klachtenkompas')||d.includes('consumentenbond')?'consumer_complaint':'blog_web',title,excerpt,topic_key:topic(all),observed_at:new Date().toISOString(),freshness_score:recency,recognition_score:personal,friction_score:complaint,shareability_score:share,originality_score:originality,evidence_score:evidence,total_score:total,eligible:!blocked&&explicitComplaint&&total>=0.70,source_hash:sourceHash,metadata:{query:q,search_provider:sr.provider,provider_score:x.score??null,contract:'mira-public-complaint-source-loop-v1',explicit_complaint:explicitComplaint,complaint_rich_domain:richDomain,blocked_support_page:blocked,published_year:year}};
   const up=await db.from('powerhouse_mira_problem_signals_v1').upsert(row,{onConflict:'source_url'}); if(up.error){errors.push('upsert:'+up.error.message);continue}
   stored++; if(row.eligible) eligible++;
  }
 }
 const mat=await db.rpc('powerhouse_materialize_mira_problem_recommendation_v1',{p_date:runDate});
 return json({ok:errors.length===0,runDate,stored,eligible,materialized:mat.data,errors});
});
