import { createClient } from 'npm:@supabase/supabase-js@2';

const TOKEN_HASH='0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75';
const ORIGIN='https://www.bedrijfsgeheugen.nl';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const clean=(v:unknown,max=500)=>String(v??'').trim().slice(0,max);
async function sha256(value:string){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
const uuidRe=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function num(v:unknown,min:number,max:number){const n=Number(v);return Number.isFinite(n)&&n>=min&&n<=max?n:null;}
function validKey(v:string){return /^[A-Za-z0-9._:-]{12,180}$/.test(v);}
function safeObj(v:unknown){return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};}
function safeAnswers(v:unknown){return Array.isArray(v)?v.slice(0,100).map((x:any)=>({vraag:clean(x?.vraag,500),antwoord:clean(x?.antwoord,500),dim:clean(x?.dim,80),ctx:clean(x?.ctx,500)})):[];}
function normalize(body:any){
  const input=safeObj(body?.scan);
  const submissionKey=clean(body?.submission_key||input.submission_key,180);
  if(!validKey(submissionKey))throw new Error('INVALID_SUBMISSION_KEY');
  const score=num(input.score,0,100);if(score===null)throw new Error('INVALID_SCORE');
  const niveau=num(input.niveau,1,5);
  const dimIn=safeObj(input.dimAvg||input.niveaus);const dimensions:Record<string,number>={};
  for(const [k,v] of Object.entries(dimIn)){const n=num(v,0,5);if(n!==null)dimensions[clean(k,80)]=n;}
  if(!Object.keys(dimensions).length)throw new Error('INVALID_DIMENSIONS');
  const canonical=clean(body?.canonical||`${ORIGIN}/frisse-blik`,1000);
  if(!(canonical===`${ORIGIN}/frisse-blik`||canonical.startsWith(`${ORIGIN}/frisse-blik?`)))throw new Error('INVALID_CANONICAL');
  return {submissionKey,score,niveau,dimensions,answers:safeAnswers(input.antwoorden),branche:clean(input.branche,120)||null,omvang:clean(input.omvang,120)||null,doel:clean(input.doel,500)||null,datum:clean(input.datum,40)||new Date().toISOString().slice(0,10),canonical,raw:input};
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
  const token=req.headers.get('x-bg-service-token')||'';if(await sha256(token)!==TOKEN_HASH)return json({error:'UNAUTHORIZED'},401);
  let body:any;try{body=await req.json()}catch{return json({error:'INVALID_JSON'},400)}
  const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(!url||!key)return json({error:'SERVER_CONFIG'},500);
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});

  if(body?.action==='health'){
    const {count,error}=await client.from('scan_inzendingen').select('*',{count:'exact',head:true});
    return error?json({ok:false,error:'SCAN_STORE_UNAVAILABLE'},503):json({ok:true,contract:'powerhouse-canonical-scan-loop-v1',scan_store:'scan_inzendingen',scan_count:count??0});
  }
  if(body?.action==='history'){
    const tenantId=clean(body?.tenant_id,180);if(!tenantId)return json({error:'INVALID_TENANT'},422);
    let query=client.from('powerhouse_scan_history_v1').select('scan_id,submission_key,schema_version,tenant_identity_status,soort,bron,bron_url,scan_datum,aangemaakt,score,vorige_score,score_delta,branche,omvang,niveaus,doel,powerhouse_event_id').order('aangemaakt',{ascending:false}).limit(50);
    query=uuidRe.test(tenantId)?query.eq('organisatie_id',tenantId):query.eq('klant_slug',tenantId);
    const {data,error}=await query;return error?json({error:'SCAN_HISTORY_FAILED',detail:error.message.slice(0,200)},500):json({ok:true,contract:'powerhouse-canonical-scan-loop-v1',tenant_id:tenantId,scans:data||[]});
  }
  if(body?.action==='claim'){
    const tenantId=clean(body?.tenant_id,180),submissionKey=clean(body?.submission_key,180);if(!uuidRe.test(tenantId)||!validKey(submissionKey))return json({error:'IDENTITY_NOT_ORGANISATION'},422);
    const {data:org,error:orgError}=await client.from('organisaties').select('id,slug,naam').eq('id',tenantId).maybeSingle();if(orgError||!org)return json({error:'ORGANISATION_NOT_FOUND'},404);
    const {data:scan,error:scanError}=await client.from('scan_inzendingen').select('id,submission_key,tenant_identity_status,organisatie_id,powerhouse_event_id').eq('submission_key',submissionKey).maybeSingle();if(scanError||!scan)return json({error:'SCAN_NOT_FOUND'},404);
    if(scan.organisatie_id&&scan.organisatie_id!==tenantId)return json({error:'SCAN_ALREADY_CLAIMED'},409);
    const companyKey=`org:${org.slug||org.id}`;
    const {data:claimed,error:claimError}=await client.from('scan_inzendingen').update({organisatie_id:tenantId,klant_slug:org.slug||null,company_key:companyKey,tenant_identity_status:'verified',bijgewerkt_op:new Date().toISOString()}).eq('id',scan.id).select('id,submission_key,organisatie_id,company_key,tenant_identity_status').single();if(claimError)return json({error:'SCAN_CLAIM_FAILED',detail:claimError.message.slice(0,200)},500);
    const {error:eventError}=await client.from('powerhouse_runtime_events').upsert({dedupe_key:`scan-identity:${submissionKey}:${tenantId}`,event_type:'scan_identity_verified',source:'portal.identity',company_key:companyKey,channel:'portal',topic_key:'digital_maturity',occurred_at:new Date().toISOString(),evidence:{scan_id:scan.id,submission_key:submissionKey,original_event_id:scan.powerhouse_event_id},context:{organisation_id:tenantId,organisation_slug:org.slug||null,tenant_identity_status:'verified',learning_scope:'account_and_aggregate'},state:'observed',data_quality:'VERIFIED',confidence:1},{onConflict:'dedupe_key',ignoreDuplicates:true});if(eventError)return json({error:'IDENTITY_EVENT_FAILED',scan:claimed,detail:eventError.message.slice(0,200)},500);
    return json({ok:true,claimed:true,scan:claimed});
  }

  let scan:any;try{scan=normalize(body)}catch(e){return json({error:String((e as Error).message||'INVALID_SCAN')},422)}
  if(body?.dry_run===true)return json({ok:true,dry_run:true,contract:'powerhouse-canonical-scan-loop-v1',normalized:{submission_key:scan.submissionKey,score:scan.score,niveau:scan.niveau,dimensions:Object.keys(scan.dimensions).length}});
  const scanRow={submission_key:scan.submissionKey,schema_version:2,soort:'frisse_blik',scan_datum:scan.datum,score:scan.score,branche:scan.branche,omvang:scan.omvang,niveaus:scan.dimensions,taken:[],doel:scan.doel,bron:'website',bron_url:scan.canonical,organisatie_id:null,tenant_identity_status:'unverified',company_key:null,payload:{contract:'powerhouse-canonical-scan-loop-v1',niveau:scan.niveau,dimensions:scan.dimensions,antwoorden:scan.answers,source_version:clean(scan.raw?.stempel,120)||null}};
  const {data:created,error:insertError}=await client.from('scan_inzendingen').upsert(scanRow,{onConflict:'submission_key',ignoreDuplicates:true}).select('id,submission_key,score,tenant_identity_status,powerhouse_event_id,aangemaakt').maybeSingle();if(insertError)return json({error:'SCAN_STORE_FAILED',detail:insertError.message.slice(0,300)},500);
  let stored=created;if(!stored){const {data,error}=await client.from('scan_inzendingen').select('id,submission_key,score,tenant_identity_status,powerhouse_event_id,aangemaakt').eq('submission_key',scan.submissionKey).maybeSingle();if(error||!data)return json({error:'SCAN_READBACK_FAILED'},500);stored=data;}
  const dedupe=`scan:${scan.submissionKey}`;const eventRow={dedupe_key:dedupe,event_type:'scan_submitted',source:'website.frisse_blik',channel:'website',topic_key:'digital_maturity',occurred_at:new Date().toISOString(),evidence:{scan_id:stored.id,submission_key:scan.submissionKey,canonical:scan.canonical},context:{score:scan.score,niveau:scan.niveau,dimensions:scan.dimensions,tenant_identity_status:'unverified',learning_scope:'aggregate_only'},state:'observed',data_quality:'OBSERVED',confidence:0.9};
  const {data:eventCreated,error:eventError}=await client.from('powerhouse_runtime_events').upsert(eventRow,{onConflict:'dedupe_key',ignoreDuplicates:true}).select('event_id,dedupe_key').maybeSingle();if(eventError)return json({error:'POWERHOUSE_EVENT_FAILED',scan_id:stored.id,detail:eventError.message.slice(0,300)},500);
  let event=eventCreated;if(!event){const {data,error}=await client.from('powerhouse_runtime_events').select('event_id,dedupe_key').eq('dedupe_key',dedupe).maybeSingle();if(error||!data)return json({error:'POWERHOUSE_EVENT_READBACK_FAILED',scan_id:stored.id},500);event=data;}
  const {error:updateError}=await client.from('scan_inzendingen').update({powerhouse_event_id:event.event_id,bijgewerkt_op:new Date().toISOString()}).eq('id',stored.id);if(updateError)return json({error:'SCAN_EVENT_LINK_FAILED',scan_id:stored.id,event_id:event.event_id},500);
  await client.from('growth_events').upsert({event_id:dedupe,event_type:'scan_completed',canonical:scan.canonical,intent:'frisse_blik',intent_owner:'bedrijfsgeheugen',source:'website',medium:'organic',occurred_at:new Date().toISOString(),page_role:'conversion',funnel_stage:'lead',value:0,payload:{scan_id:stored.id,score:scan.score,niveau:scan.niveau,privacy_scope:'no_pii'}},{onConflict:'event_id',ignoreDuplicates:true});
  return json({ok:true,stored:true,deduped:!created,contract:'powerhouse-canonical-scan-loop-v1',scan_id:stored.id,event_id:event.event_id,tenant_identity_status:'unverified'},created?201:200);
});
