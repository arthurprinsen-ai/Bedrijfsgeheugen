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
 'Nederland klacht irritant app account wachtwoord inloggen 2FA gewone gebruiker',
 'Nederland forum ergernis schoolapp ouderportaal berichten meldingen',
 'Nederland klacht parkeerapp zone account betalen parkeren',
 'Nederland forum klacht pakket bezorger niet thuis bezorging app',
 'Nederland klacht abonnement opzeggen app klantenservice chatbot',
 'Nederland blog digitale frustratie te veel apps schermen bevestigingen',
 'site:reddit.com Nederland app irritatie wachtwoord parkeren abonnement bezorging',
 'site:tweakers.net forum app irritatie account inloggen abonnement',
 'site:radar.avrotros.nl klacht app klantenservice abonnement',
 'site:kassa.bnnvara.nl klacht app inloggen abonnement bezorging'
];
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST') return json({error:'POST_ONLY'},405);
 const url=Deno.env.get('SUPABASE_URL'), key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!key) return json({error:'CONFIG'},500);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const incoming=req.headers.get('x-powerhouse-token')||'';
 const expected=String((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data||'');
 if(!expected||incoming!==expected) return json({error:'UNAUTHORIZED'},401);
 const tavily=String(Deno.env.get('TAVILY_API_KEY')||((await db.rpc('bg_geheim',{p_naam:'TAVILY_API_KEY'})).data||'')).trim();
 if(!tavily) return json({error:'TAVILY_UNAVAILABLE'},503);
 const body=await req.json().catch(()=>({}));
 const runDate=String(body?.runDate||new Date(Date.now()+86400000).toISOString().slice(0,10));
 let stored=0, eligible=0; const seen=new Set<string>(); const errors:string[]=[];
 for(const q of queries){
  const r=await fetch('https://api.tavily.com/search',{method:'POST',headers:{authorization:'Bearer '+tavily,'content-type':'application/json'},body:JSON.stringify({query:q,topic:'general',search_depth:'basic',max_results:6,include_answer:false})});
  const b:any=await r.json().catch(()=>({}));
  if(!r.ok){errors.push(q+':'+r.status);continue}
  for(const x of (b.results||[])){
   const sourceUrl=String(x.url||'').trim(); if(!sourceUrl||seen.has(sourceUrl)) continue; seen.add(sourceUrl);
   const d=domain(sourceUrl); const title=String(x.title||'').trim(); const excerpt=String(x.content||'').slice(0,1800);
   if(!d||title.length<12) continue;
   const all=(title+' '+excerpt).toLowerCase();
   const complaint=/(klacht|erger|irrit|frustr|gedoe|lastig|waardeloos|probleem|werkt niet|kan niet|steeds|moet ik|waarom)/.test(all)?1:0.55;
   const personal=/(ik|mijn|thuis|kind|school|parkeren|pakket|wachtwoord|app|abonnement|klantenservice|chatbot)/.test(all)?1:0.6;
   const share=/(herken|iedereen|steeds|elke keer|weer|waarom)/.test(all)?0.95:0.65;
   const evidence=clamp(Number(x.score)||0.5);
   const recency=0.8;
   const originality=0.8;
   const total=Math.round((recency*.10+personal*.23+complaint*.25+share*.18+originality*.12+evidence*.12)*1000)/1000;
   const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sourceUrl+'|'+title));
   const sourceHash=[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('');
   const row={source_url:sourceUrl,source_domain:d,source_type:d.includes('reddit')||d.includes('tweakers')?'forum':d.includes('radar')||d.includes('kassa')?'consumer_complaint':'blog_web',title,excerpt,topic_key:topic(all),observed_at:new Date().toISOString(),freshness_score:recency,recognition_score:personal,friction_score:complaint,shareability_score:share,originality_score:originality,evidence_score:evidence,total_score:total,eligible:total>=0.72,source_hash:sourceHash,metadata:{query:q,tavily_score:x.score??null,contract:'mira-public-complaint-source-loop-v1'}};
   const up=await db.from('powerhouse_mira_problem_signals_v1').upsert(row,{onConflict:'source_url'}); if(up.error){errors.push('upsert:'+up.error.message);continue}
   stored++; if(row.eligible) eligible++;
  }
 }
 const mat=await db.rpc('powerhouse_materialize_mira_problem_recommendation_v1',{p_date:runDate});
 return json({ok:errors.length===0,runDate,stored,eligible,materialized:mat.data,errors});
});
