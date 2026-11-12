import { createClient } from 'npm:@supabase/supabase-js@2';

const BRON='bg-analytics-sync-composio';
const FAILOVER_CONTRACT='ga4-auth-failover-v1';
const DEFAULT_PROPERTY='properties/546874601';
const DEFAULT_WINDSOR_ACCOUNT='546874601';
const WINDSOR_SOURCE='windsor-googleanalytics4';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const clean=(v:unknown)=>{const s=String(v??'').trim();return!s||s==='(not set)'||s==='(direct)'?null:s};
const csvCell=(v:unknown)=>{const s=String(v??'');return /[",\n\r]/.test(s)?`"${s.replaceAll('"','""')}"`:s};
const b64url=(buf:ArrayBuffer|Uint8Array)=>btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const enc=(o:unknown)=>b64url(new TextEncoder().encode(JSON.stringify(o)));
async function sha256(v:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function yesterdayUtc(){const d=new Date();d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10)}
function parseAccount(raw:string|null):{client_email:string;private_key:string}|null{if(!raw)return null;try{const j=JSON.parse(raw);if(j?.client_email&&j?.private_key)return j}catch{}return null}
function classifyFailure(detail:string){return /401|403|TOKEN|PERMISSION/i.test(detail)?'AUTH':'REMOTE'}
async function secret(db:any,name:string){const env=Deno.env.get(name);if(env)return env;const {data}=await db.rpc('bg_geheim',{p_naam:name});return typeof data==='string'&&data.trim()?data.trim():null}
async function accessToken(sa:{client_email:string;private_key:string}){const pem=sa.private_key.replace(/\\n/g,'\n').replace(/-----[^-]+-----/g,'').replace(/\s+/g,'');const der=Uint8Array.from(atob(pem),c=>c.charCodeAt(0));const key=await crypto.subtle.importKey('pkcs8',der,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);const now=Math.floor(Date.now()/1000);const unsigned=`${enc({alg:'RS256',typ:'JWT'})}.${enc({iss:sa.client_email,scope:'https://www.googleapis.com/auth/analytics.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600})}`;const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(unsigned));const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${unsigned}.${b64url(sig)}`})});const b:any=await r.json().catch(()=>({}));if(!r.ok||!b.access_token)throw new Error(`GOOGLE_TOKEN_${r.status}:${String(b.error_description||b.error||'').slice(0,160)}`);return b.access_token}
function reportRows(report:any){const dims=(report.dimensionHeaders||[]).map((x:any)=>x.name);const metrics=(report.metricHeaders||[]).map((x:any)=>x.name);return (report.rows||[]).map((row:any)=>{const out:Record<string,string>={};dims.forEach((name:string,i:number)=>out[name]=row.dimensionValues?.[i]?.value??'');metrics.forEach((name:string,i:number)=>out[name]=row.metricValues?.[i]?.value??'');return out})}
async function directGA4(sa:{client_email:string;private_key:string},property:string,day:string){const token=await accessToken(sa);const r=await fetch(`https://analyticsdata.googleapis.com/v1beta/${property}:runReport`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({dateRanges:[{startDate:day,endDate:day}],dimensions:[{name:'date'},{name:'pagePath'},{name:'sessionCampaignName'}],metrics:[{name:'sessions'},{name:'activeUsers'},{name:'eventCount'}],limit:250000,keepEmptyRows:false})});const b:any=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`GA4_${r.status}:${String(b?.error?.message||'').slice(0,200)}`);return reportRows(b)}
async function windsorGA4(apiKey:string,accountId:string,day:string){const u=new URL('https://connectors.windsor.ai/googleanalytics4');u.searchParams.set('api_key',apiKey);u.searchParams.set('fields','date,page_path,campaign_name,sessions,active_users,event_count,measurement_id');u.searchParams.set('date_from',day);u.searchParams.set('date_to',day);u.searchParams.set('select_accounts',accountId);u.searchParams.set('_renderer','json');u.searchParams.set('refresh_since','3d');u.searchParams.set('refresh_interval','1h');const r=await fetch(u,{headers:{'user-agent':'Bedrijfsgeheugen-Powerhouse/1.0'}});const b:any=await r.json().catch(()=>({}));if(!r.ok||!Array.isArray(b?.data))throw new Error(`WINDSOR_API_${r.status}:${String(b?.error?.message||b?.error||'invalid response').slice(0,200)}`);return b.data.map((x:any)=>({date:String(x.date||'').replaceAll('-',''),pagePath:String(x.page_path||'/'),sessionCampaignName:String(x.campaign_name||''),sessions:String(x.sessions??0),activeUsers:String(x.active_users??0),eventCount:String(x.event_count??0),measurementId:String(x.measurement_id||'')}))}
async function recentWindsorReadback(db:any){const cutoff=new Date(Date.now()-48*3600*1000).toISOString();const {data,error}=await db.from('bg_ga4_csv_batches').select('run_id,period_start,period_end,rows_total,rows_attributed,completed_at,source,detail').ilike('source','windsor%').gte('completed_at',cutoff).gt('rows_total',0).order('completed_at',{ascending:false}).limit(1);if(error)throw new Error(`WINDSOR_READBACK_LOOKUP:${error.message}`);return data?.[0]||null}
async function writeRuntime(db:any,dedupeKey:string,state:string,evidence:any,eventType='ga4_failover_observed'){await db.from('powerhouse_runtime_events').upsert({dedupe_key:dedupeKey,event_type:eventType,source:BRON,subject_key:'ga4-analytics',channel:'website',occurred_at:new Date().toISOString(),evidence,context:{contract:FAILOVER_CONTRACT,canonical_collector:BRON},state,data_quality:'verified',confidence:1},{onConflict:'dedupe_key'})}

async function originalGa4EmptyRepair(db:any,day:string,sourceRoute:string,report:any){
 const fingerprint='powerhouse|ga4|empty-success-without-resolve|20261104-v1';
 const owner='bg-analytics-sync-composio / original ONE BRAIN Data Spine owner';
 const identity={p_obligation_type:'MEASUREMENT_REPAIR',p_capability_id:'powerhouse-data-intake-learning-spine-v1',p_business_entity:'ga4-analytics',p_business_period:'ongoing',p_business_timezone:'Europe/Amsterdam',p_payload_sha256:await sha256('ga4-analytics|empty-success|stale-source|recovery-v1'),p_change_id:fingerprint,p_owner:owner};
 let {data:ob,error}=await db.rpc('brain_create_obligation',identity);
 if(error||!ob)throw new Error('GA4_CANONICAL_REPAIR_ENQUEUE_FAILED:'+String(error?.message||'no obligation').slice(0,160));
 // The original collector and Brain owner may race on the SAME canonical obligation.
 // Retry only a proven CAS version conflict. Do not re-create, downgrade or replay any
 // external GA4 observation; rebuild evidence from the latest canonical row every time.
 for(let attempt=0;attempt<3;attempt++){
  if(['FULFILLED','CANCELLED','BREACHED'].includes(ob.state)){
   if(identity.p_business_period==='ongoing'){
    identity.p_business_period=day;
    ({data:ob,error}=await db.rpc('brain_create_obligation',identity));
    if(error||!ob)throw new Error('GA4_RECURRENCE_REPAIR_ENQUEUE_FAILED:'+String(error?.message||'no obligation').slice(0,160));
   }
   // A day-scoped recurrence may itself already be terminal: never reopen it.
   if(['FULFILLED','CANCELLED','BREACHED'].includes(ob.state)){
    return {obligation_id:ob.id,obligation_state:ob.state,obligation_version:ob.version,terminal_protected:true,cas_retries:attempt};
   }
  }
  const historical=(ob.evidence&&typeof ob.evidence==='object'&&!Array.isArray(ob.evidence))?ob.evidence:{};
  const evidence={...historical,status:'REPAIR_REQUIRED',latest_observation:report,fingerprint,owner,recovery_state:'PROVIDER_EMPTY_REQUIRES_ORIGINAL_OWNER',first_time_right:'NO_FAKE_OK',historical_zero_rows_not_traffic_proof:true,checkpoints:['independent GA4 provider totals and property readback','consent-aware site tag diagnostics','nonempty genuine source observation or independently confirmed no-data','protected regression, original runtime and Brain learning proof']};
  const nextState=['RUNNING','BLOCKED'].includes(ob.state)?ob.state:'READY';
  const {data:updated,error:transitionError}=await db.rpc('brain_transition_obligation',{p_obligation_id:ob.id,p_expected_version:ob.version,p_state:nextState,p_owner:owner,p_evidence:evidence});
  if(!transitionError&&updated)return {obligation_id:updated.id,obligation_state:updated.state,obligation_version:updated.version,cas_retries:attempt};
  const failure=String(transitionError?.message||'no updated obligation');
  if(!failure.includes('STATE_VERSION_CONFLICT'))throw new Error('GA4_CANONICAL_REPAIR_CAS_FAILED:'+failure.slice(0,160));
  if(attempt===2)throw new Error('GA4_CANONICAL_REPAIR_CAS_EXHAUSTED:STATE_VERSION_CONFLICT');
  const {data:fresh,error:readError}=await db.from('brain_obligations').select('id,state,version,evidence,business_period').eq('id',ob.id).single();
  if(readError||!fresh||fresh.id!==ob.id)throw new Error('GA4_CANONICAL_REPAIR_READBACK_FAILED:'+String(readError?.message||'canonical obligation missing or mismatched').slice(0,160));
  ob=fresh;
 }
 throw new Error('GA4_CANONICAL_REPAIR_CAS_EXHAUSTED:UNEXPECTED');
}
async function originalGa4AggregateProbe(sa:{client_email:string;private_key:string},property:string,day:string){
 const token=await accessToken(sa);
 const response=await fetch(`https://analyticsdata.googleapis.com/v1beta/${property}:runReport`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({dateRanges:[{startDate:day,endDate:day}],metrics:[{name:'sessions'},{name:'activeUsers'},{name:'eventCount'}],keepEmptyRows:true})});
 const jsonBody:any=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error('GA4_TOTALS_'+response.status+':'+String(jsonBody?.error?.message||'').slice(0,120));
 const metrics=jsonBody.rows?.[0]?.metricValues||[];
 return {sessions:Number(metrics[0]?.value||0),active_users:Number(metrics[1]?.value||0),event_count:Number(metrics[2]?.value||0),source:'independent_metric_only_provider_readback'};
}

Deno.serve(async(req:Request)=>{
 if(req.method!=='POST')return json({error:'POST_ONLY'},405);
 const url=(Deno.env.get('SUPABASE_URL')||'').replace(/\/$/,'');const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';if(!url||!serviceKey)return json({error:'CONFIG'},500);
 const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 // Same private token already sent by ORIGINAL pg_cron #42 through bg_roep_functie.
 // Preserve existing verify_jwt=false at the Supabase transport boundary while
 // refusing anonymous callers BEFORE Google API, Vault provider calls or Brain writes.
 const schedulerSecret=String((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data||'').trim();
 const callerToken=String(req.headers.get('x-powerhouse-token')||'').trim();
 if(!schedulerSecret || callerToken.length<16 || callerToken!==schedulerSecret) return json({ok:false,error:'UNAUTHORIZED'},401);
 const bewijs=(groen:boolean,detail:unknown,klasse:string|null=null)=>db.rpc('bg_bewijs',{p_bron:BRON,p_groen:groen,p_detail:detail,p_foutklasse:klasse}).then(()=>{},()=>{});
 const property=Deno.env.get('GA4_PROPERTY_RESOURCE')||DEFAULT_PROPERTY;
 const envSa=parseAccount(Deno.env.get('GOOGLE_SERVICE_ACCOUNT')||null);const {data:vaultSa}=await db.rpc('bg_geheim',{p_naam:'GOOGLE_SERVICE_ACCOUNT'});const sa=envSa||parseAccount((vaultSa as string)||null);
 const runId=crypto.randomUUID(),day=yesterdayUtc(),started=new Date().toISOString();let rows:any[]=[];let sourceRoute='google-analytics-data-api';let primaryFailure:string|null=null;
 try{
  if(!sa)throw new Error('GOOGLE_SERVICE_ACCOUNT_ONVOLLEDIG');
  try{rows=await directGA4(sa,property,day)}catch(error){
   primaryFailure=error instanceof Error?error.message.slice(0,300):'unknown';const failureClass=classifyFailure(primaryFailure);
   if(failureClass!=='AUTH')throw new Error(`DIRECT_NON_AUTH_FAILURE:${primaryFailure}`);
   const apiKey=await secret(db,'WINDSOR_API_KEY');const accountId=(await secret(db,'WINDSOR_GA4_ACCOUNT_ID'))||DEFAULT_WINDSOR_ACCOUNT;
   if(apiKey){try{rows=await windsorGA4(apiKey,accountId,day);sourceRoute=WINDSOR_SOURCE}catch(fallbackError){const cached=await recentWindsorReadback(db);if(!cached)throw fallbackError;sourceRoute='windsor-verified-readback-cache';await db.from('bg_ga4_sync').insert({run_id:runId,afgelopen_uur:started,pages_opgehaald:Number(cached.rows_total||0),pages_bijgewerkt:Number(cached.rows_attributed||0),metingen_ingevuld:Number(cached.rows_attributed||0),status:Number(cached.rows_attributed||0)>0?'ok':'partial',fout:`primary AUTH failed; live Windsor API failed; reused verified Windsor readback ${cached.run_id}`,uitgevoerd_op:new Date().toISOString()});const out={ok:true,contract:FAILOVER_CONTRACT,run_id:runId,day,status:Number(cached.rows_attributed||0)>0?'READBACK_REUSED_ATTRIBUTED':'READBACK_REUSED_SOURCE_ONLY',source:sourceRoute,source_route:sourceRoute,primary_failure:primaryFailure,readback_run_id:cached.run_id,readback_completed_at:cached.completed_at};await writeRuntime(db,`ga4-failover:${day}:${cached.run_id}`, 'observed',out);await bewijs(Number(cached.rows_attributed||0)>0,out,Number(cached.rows_attributed||0)>0?null:'ATTRIBUTION_NOT_PROVEN');return json(out,Number(cached.rows_attributed||0)>0?200:207)}}
   else {const cached=await recentWindsorReadback(db);if(!cached)throw new Error(`WINDSOR_FALLBACK_UNAVAILABLE:missing WINDSOR_API_KEY; primary=${primaryFailure}`);sourceRoute='windsor-verified-readback-cache';await db.from('bg_ga4_sync').insert({run_id:runId,afgelopen_uur:started,pages_opgehaald:Number(cached.rows_total||0),pages_bijgewerkt:Number(cached.rows_attributed||0),metingen_ingevuld:Number(cached.rows_attributed||0),status:Number(cached.rows_attributed||0)>0?'ok':'partial',fout:`primary AUTH failed; WINDSOR_API_KEY absent; reused verified Windsor readback ${cached.run_id}`,uitgevoerd_op:new Date().toISOString()});const out={ok:true,contract:FAILOVER_CONTRACT,run_id:runId,day,status:Number(cached.rows_attributed||0)>0?'READBACK_REUSED_ATTRIBUTED':'READBACK_REUSED_SOURCE_ONLY',source:sourceRoute,source_route:sourceRoute,primary_failure:primaryFailure,readback_run_id:cached.run_id,readback_completed_at:cached.completed_at};await writeRuntime(db,`ga4-failover:${day}:${cached.run_id}`, 'observed',out);await bewijs(Number(cached.rows_attributed||0)>0,out,Number(cached.rows_attributed||0)>0?null:'ATTRIBUTION_NOT_PROVEN');return json(out,Number(cached.rows_attributed||0)>0?200:207)}
  }

  // HTTP200 with zero returned rows is verified emptiness, NOT a successful import
  // and never proof of zero business traffic (GA4 is consent-dependent).
  if(rows.length===0){
   let aggregate:any=null,probeError:string|null=null;
   if(sourceRoute==='google-analytics-data-api'){
    try{aggregate=await originalGa4AggregateProbe(sa,property,day)}
    catch(e){probeError=e instanceof Error?e.message.slice(0,180):'GA4_TOTALS_UNKNOWN';}
   }
   // Consent-safe source discrimination: no consented native browser events
   // plus zero GA4 totals is a privacy boundary, NOT proof that Google is broken.
   const nextDay=new Date(day+'T00:00:00.000Z');nextDay.setUTCDate(nextDay.getUTCDate()+1);
   const {data:consentEvents,error:consentError}=await db.from('bg_interacties').select('id')
     .eq('toestemming',true).eq('is_robot',false)
     .gte('gebeurd_op',day+'T00:00:00.000Z').lt('gebeurd_op',nextDay.toISOString()).limit(1);
   const consentedHumanEvidence=consentError?null:Array.isArray(consentEvents)?consentEvents.length>0:null;
   const totalsPositive=(aggregate?.sessions||0)>0||(aggregate?.event_count||0)>0;
   const consentLimited=consentedHumanEvidence===false && aggregate!==null && !totalsPositive;
   const reason=totalsPositive?'GA4_DIMENSION_QUERY_EMPTY_WITH_NONZERO_TOTAL'
     :consentLimited?'GA4_CONSENT_LIMITED_NO_SOURCE_ROWS'
     :consentedHumanEvidence===true?'GA4_ZERO_DESPITE_CONSENTED_SITE_EVENTS'
     :'GA4_EMPTY_SOURCE_INDEPENDENT_EVIDENCE_DUE';
   const observation={ok:false,source_data_available:false,status:consentLimited?'CONSENT_LIMITED':'NO_SOURCE_DATA',
     reason,day,property,source_route:sourceRoute,provider_report_rows:0,aggregate_probe:aggregate,
     aggregate_probe_error:probeError,consented_human_first_party_event_present:consentedHumanEvidence,
     consent_evidence_error:consentError?String(consentError.message||'unknown').slice(0,160):null,
     primary_failure:primaryFailure,actual_site_sessions:'UNKNOWN_NOT_INFERRED',
     privacy_boundary:'NO_CONSENT_BYPASS_NO_FORCED_GA4_TRACKING',recommended_existing_source:'privacy-minimized bg_interacties for CRO only',
     run_id:runId,owner:BRON,checked_at:new Date().toISOString()};
   const {error:syncError}=await db.from('bg_ga4_sync').insert({run_id:runId,afgelopen_uur:started,pages_opgehaald:0,pages_bijgewerkt:0,metingen_ingevuld:0,
     status:consentLimited?'privacy_limited':'error',fout:reason,uitgevoerd_op:new Date().toISOString()});
   if(syncError)throw new Error('GA4_EMPTY_RECEIPT_STORE_FAILED:'+syncError.message.slice(0,160));
   await writeRuntime(db,`ga4-source-empty:${day}:${sourceRoute}`,consentLimited?'observed':'error',observation,'ga4_source_empty_observed');
   const repair=await originalGa4EmptyRepair(db,day,sourceRoute,observation);
   const result={...observation,...repair};
   await bewijs(false,result,consentLimited?'CONSENT_BOUNDARY':'EMPTY_SOURCE');
   // Healthy invocation but unavailable GA4 measurement; original Data Spine
   // remains stale/unobserved, native CRO can use its own privacy-safe events.
   return json(result,consentLimited?200:503);
  }
  const headers=['date','pagePath','sessionCampaignName','sessions','activeUsers','eventCount'];const csv=[headers.join(','),...rows.map((r:any)=>headers.map(h=>csvCell(r[h])).join(','))].join('\n')+'\n';if(new TextEncoder().encode(csv).byteLength>5_000_000)throw new Error('GA4_CSV_TOO_LARGE');const csvHash=await sha256(csv);
  const {data:existing}=await db.from('bg_ga4_csv_batches').select('run_id,status,completed_at,rows_total,rows_attributed').eq('period_start',day).eq('period_end',day).eq('csv_sha256',csvHash).eq('source',sourceRoute).limit(1);
  if(existing?.length){
    // A previously recorded empty attribution is not new social measurement.
    // Provider page rows remain genuine source evidence, never zero visitors.
    const prev=existing[0], attributionProven=prev.status==='IMPORTED'&&Number(prev.rows_attributed||0)>0;
    const out={ok:true,contract:FAILOVER_CONTRACT,run_id:runId,day,
      status:attributionProven?'DUPLICATE_ATTRIBUTED_READBACK':'DUPLICATE_SOURCE_ONLY_READBACK',
      source:sourceRoute,source_route:sourceRoute,primary_failure:primaryFailure,
      existing_run_id:prev.run_id,csv_sha256:csvHash,
      provider_rows_observed:Number(prev.rows_total||0),
      social_post_measurements_imported:0,
      previous_attributed_rows:Number(prev.rows_attributed||0),
      source_data_available:Number(prev.rows_total||0)>0,
      website_visitors:'NOT_INFERRED_FROM_SOCIAL_POST_IMPORT'};
    await db.from('bg_ga4_sync').insert({run_id:runId,afgelopen_uur:started,
      pages_opgehaald:Number(prev.rows_total||0),pages_bijgewerkt:0,metingen_ingevuld:0,
      status:attributionProven?'ok':'partial',
      fout:attributionProven?null:'GA4_SOURCE_OBSERVED_WITHOUT_ATTRIBUTED_POST_MEASUREMENTS',
      uitgevoerd_op:new Date().toISOString()});
    await writeRuntime(db,`ga4-sync:${day}:${csvHash}:${sourceRoute}`,'observed',out);
    await bewijs(attributionProven,out,attributionProven?null:'ATTRIBUTION_NOT_PROVEN');
    return json(out,attributionProven?200:207);
  }
  const batch=await db.from('bg_ga4_csv_batches').insert({run_id:runId,period_start:day,period_end:day,csv_sha256:csvHash,csv_bytes:new TextEncoder().encode(csv).byteLength,csv_text:csv,source:sourceRoute,status:'RECEIVED',rows_total:rows.length,detail:{property,source_route:sourceRoute,primary_failure:primaryFailure,contract:FAILOVER_CONTRACT}});if(batch.error)throw new Error(`GA4_BATCH_STORE:${batch.error.message}`);
  const campaigns=[...new Set(rows.map((r:any)=>clean(r.sessionCampaignName)).filter(Boolean))] as string[];let matched:any[]=[];if(campaigns.length){const lookup=await db.from('social_posts').select('tenant_id,post_id,platform,external_post_id,source_campaign_id,topic,content_pillar,audience,funnel_stage,format,hook_type,narrative_type,emotion,cta_type,published_at').eq('tenant_id','bedrijfsgeheugen').in('source_campaign_id',campaigns);if(lookup.error)throw new Error(`CAMPAIGN_LOOKUP:${lookup.error.message}`);matched=lookup.data||[]}
  const byCampaign=new Map<string,any[]>();for(const p of matched){const k=clean(p.source_campaign_id);if(k)byCampaign.set(k,[...(byCampaign.get(k)||[]),p])}const imports:any[]=[];let unmatched=0;
  for(const r of rows){const campaign=clean(r.sessionCampaignName);if(!campaign)continue;const matches=byCampaign.get(campaign)||[];if(matches.length!==1){unmatched++;continue}const p=matches[0];imports.push({...p,campaign_key:campaign,source_campaign_id:campaign,observed_at:new Date().toISOString(),bron:sourceRoute==='google-analytics-data-api'?'ga4-direct':'ga4-windsor',source_event_id:`ga4:${day}:${p.post_id}:${r.pagePath||'/'}`,metrics:{sessions:Number(r.sessions||0),active_users:Number(r.activeUsers||0),event_count:Number(r.eventCount||0),page_path:r.pagePath||'/',ga4_date:r.date||day}})}
  let imported=0;for(let i=0;i<imports.length;i+=500){const posts=imports.slice(i,i+500);const res=await fetch(`${url}/functions/v1/bg-post-import`,{method:'POST',headers:{authorization:`Bearer ${serviceKey}`,'content-type':'application/json'},body:JSON.stringify({posts})});const body:any=await res.json().catch(()=>({}));if(!res.ok)throw new Error(`POST_IMPORT_${res.status}:${String(body?.error||'').slice(0,140)}`);imported+=Number(body?.metingen||posts.length)}
  // Source-only organic/direct sessions are real GA4 observations; they are
  // NOT proof of tagged LinkedIn/Instagram post attribution or zero visitors.
  // A social campaign that cannot be matched needs original-owner recovery.
  const campaignRows=rows.filter((r:any)=>clean(r.sessionCampaignName));
  const sourceOnlyRows=Math.max(0,rows.length-campaignRows.length);
  const campaignAttributionGap=unmatched>0;
  const noPostMeasurements=imports.length===0;
  const status=campaignAttributionGap||noPostMeasurements?'PARTIAL':'IMPORTED';
  const reason=campaignAttributionGap?'GA4_CAMPAIGN_ID_UNMATCHED_OR_AMBIGUOUS':
    noPostMeasurements?'GA4_SOURCE_OBSERVED_NO_SOCIAL_POST_ATTRIBUTION':null;
  const finishedAt=new Date().toISOString();
  const batchUpdate=await db.from('bg_ga4_csv_batches').update({status,
    rows_attributed:imports.length,rows_unmatched:unmatched,completed_at:finishedAt,
    detail:{property,source_route:sourceRoute,primary_failure:primaryFailure,
      campaigns:campaigns.length,source_only_rows:sourceOnlyRows,
      tagged_campaign_rows:campaignRows.length,matched_posts:matched.length,
      metrics_imported:imported,source_data_available:true,
      post_attribution_state:status==='IMPORTED'?'OBSERVED':'INCOMPLETE',
      no_social_campaign_is_not_zero_website_traffic:true,
      contract:FAILOVER_CONTRACT}}).eq('run_id',runId);
  if(batchUpdate.error)throw new Error('GA4_BATCH_READBACK_WRITE_FAILED:'+batchUpdate.error.message);
  const sync=await db.from('bg_ga4_sync').insert({run_id:runId,afgelopen_uur:started,
    pages_opgehaald:rows.length,pages_bijgewerkt:imports.length,
    metingen_ingevuld:imported,status:status==='IMPORTED'?'ok':'partial',
    fout:reason,uitgevoerd_op:finishedAt});
  if(sync.error)throw new Error('GA4_ATTRIBUTION_RECEIPT_WRITE_FAILED:'+sync.error.message);
  const repair=campaignAttributionGap?await originalGa4EmptyRepair(db,day,sourceRoute,{
    reason:'GA4_CAMPAIGN_ATTRIBUTION_REPAIR_REQUIRED',source_data_available:true,
    provider_report_rows:rows.length,tagged_campaign_rows:campaignRows.length,
    unlinked_campaign_rows:unmatched,imported_posts:imports.length,
    do_not_infer_zero_visitors:true}):null;
  const out={ok:true,contract:FAILOVER_CONTRACT,run_id:runId,day,rows:rows.length,
    attributed:imports.length,unmatched,source_only_rows:sourceOnlyRows,
    imported,csv_sha256:csvHash,status,source:sourceRoute,source_route:sourceRoute,
    primary_failure:primaryFailure,reason,
    source_data_available:true,
    website_visitors:'NOT_INFERRED_FROM_SOCIAL_POST_IMPORT',
    ...(repair?{original_brain_repair:repair}:{})};
  await writeRuntime(db,`ga4-sync:${day}:${csvHash}:${sourceRoute}`,'observed',out);
  await bewijs(status==='IMPORTED',out,status==='IMPORTED'?null:'ATTRIBUTION_INCOMPLETE');
  return json(out,status==='IMPORTED'?200:207);
 }catch(error){const detail=error instanceof Error?error.message.slice(0,500):'unknown';const failureClass=classifyFailure(detail);await db.from('bg_ga4_sync').insert({run_id:runId,afgelopen_uur:started,pages_opgehaald:0,pages_bijgewerkt:0,metingen_ingevuld:0,status:'error',fout:detail,uitgevoerd_op:new Date().toISOString()});const out={error:'ANALYTICS_SYNC_FAILED',contract:FAILOVER_CONTRACT,run_id:runId,detail,failure_class:failureClass,source_route:sourceRoute,primary_failure:primaryFailure};await writeRuntime(db,`ga4-failover-error:${runId}`,'error',out);await bewijs(false,out,failureClass);return json(out,503)}
});
