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
function portalIntake(v:unknown){
  const x=safeObj(v);
  const email=clean(x.email,320).toLowerCase();
  const company=clean(x.company_name,240);
  const contact=clean(x.contact_name,240);
  const consent=x.consent===true;
  if(!consent||!company||!contact||!/^\S+@\S+\.\S+$/.test(email))return null;
  return {
    company_name:company,contact_name:contact,email,
    website:clean(x.website,1000)||null,
    employees:clean(x.employees,120)||null,
    sector:clean(x.sector,160)||null,
    region:clean(x.region,160)||null
  };
}
function preprovisionProjection(scan:any,intake:any,tenantId:string){
  const now=new Date().toISOString();
  const domainScores=Object.fromEntries(Object.entries(scan.dimensions).map(([k,v])=>[k,Math.round(Number(v)*20)]));
  return {
    schemaVersion:2,tenantId,origin:'canonical-brain',updatedBy:'workshop-scan',updatedAt:now,sourceUpdatedAt:now,
    data:{
      company:{name:intake.company_name,employees:intake.employees,sector:intake.sector,region:intake.region,website:intake.website,lastSync:now},
      managementSummary:{
        title:'Jouw persoonlijke workshopscan',
        score:scan.score,
        summary:'Dit portaal is vooraf gevuld met de uitkomsten van jouw workshopscan.',
        priorities:String(scan.doel||'').split(' | ').filter(Boolean).slice(0,3)
      },
      healthCards:Object.entries(domainScores).map(([key,value])=>({id:key,label:key,score:value,source:'workshop_scan'})),
      businessInputs:{
        workshopScan:{submissionKey:scan.submissionKey,score:scan.score,niveau:scan.niveau,dimensions:scan.dimensions,answers:scan.answers,branche:scan.branche,omvang:scan.omvang,doel:scan.doel,scanDate:scan.datum}
      },
      sourceMeta:{kind:'canonical-brain',live:true,label:'Workshopscan · vooraf gevuld',updatedAt:now}
    }
  };
}
function normalize(body:any){
  const input=safeObj(body?.scan);
  const submissionKey=clean(body?.submission_key||input.submission_key,180);
  if(!validKey(submissionKey))throw new Error('INVALID_SUBMISSION_KEY');
  const score=num(input.score,0,100); if(score===null)throw new Error('INVALID_SCORE');
  const niveau=num(input.niveau,1,5);
  const dimIn=safeObj(input.dimAvg||input.niveaus); const dimensions:Record<string,number>={};
  for(const [k,v] of Object.entries(dimIn)){const n=num(v,0,5);if(n!==null)dimensions[clean(k,80)]=n;}
  if(!Object.keys(dimensions).length)throw new Error('INVALID_DIMENSIONS');
  const canonical=clean(body?.canonical||`${ORIGIN}/frisse-blik`,1000);
  const isFrisse=canonical===`${ORIGIN}/frisse-blik`||canonical.startsWith(`${ORIGIN}/frisse-blik?`);
  const isWorkshop=canonical===`${ORIGIN}/scan`||canonical.startsWith(`${ORIGIN}/scan?`);
  if(!(isFrisse||isWorkshop))throw new Error('INVALID_CANONICAL');
  const kind=isWorkshop?'workshop_scan':'frisse_blik';
  return {submissionKey,score,niveau,dimensions,answers:safeAnswers(input.antwoorden),branche:clean(input.branche,120)||null,omvang:clean(input.omvang,120)||null,doel:clean(input.doel,500)||null,datum:clean(input.datum,40)||new Date().toISOString().slice(0,10),canonical,kind,raw:input};
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
  const token=req.headers.get('x-bg-service-token')||'';
  if(await sha256(token)!==TOKEN_HASH)return json({error:'UNAUTHORIZED'},401);
  let body:any;try{body=await req.json()}catch{return json({error:'INVALID_JSON'},400)}
  const url=Deno.env.get('SUPABASE_URL'); const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return json({error:'SERVER_CONFIG'},500);
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});

  if(body?.action==='health'){
    const {count,error}=await client.from('scan_inzendingen').select('*',{count:'exact',head:true});
    if(error)return json({ok:false,error:'SCAN_STORE_UNAVAILABLE'},503);
    return json({ok:true,contract:'powerhouse-canonical-scan-loop-v1',scan_store:'scan_inzendingen',scan_count:count??0});
  }

  if(body?.action==='history'){
    const tenantId=clean(body?.tenant_id,180); if(!tenantId)return json({error:'INVALID_TENANT'},422);
    let query=client.from('powerhouse_scan_history_v1').select('scan_id,submission_key,schema_version,tenant_identity_status,soort,bron,bron_url,scan_datum,aangemaakt,score,vorige_score,score_delta,branche,omvang,niveaus,doel,powerhouse_event_id').order('aangemaakt',{ascending:false}).limit(50);
    query=uuidRe.test(tenantId)?query.eq('organisatie_id',tenantId):query.eq('klant_slug',tenantId);
    const {data,error}=await query; if(error)return json({error:'SCAN_HISTORY_FAILED',detail:error.message.slice(0,200)},500);
    return json({ok:true,contract:'powerhouse-canonical-scan-loop-v1',tenant_id:tenantId,scans:data||[]});
  }

  if(body?.action==='claim'){
    const tenantId=clean(body?.tenant_id,180);const submissionKey=clean(body?.submission_key,180);
    if(!tenantId||!validKey(submissionKey))return json({error:'INVALID_CLAIM'},422);
    let org:any=null;
    if(uuidRe.test(tenantId)){
      const result=await client.from('organisaties').select('id,slug,naam').eq('id',tenantId).maybeSingle();
      if(result.error||!result.data)return json({error:'ORGANISATION_NOT_FOUND'},404);
      org=result.data;
    }
    const {data:scan,error:scanError}=await client.from('scan_inzendingen').select('id,submission_key,tenant_identity_status,organisatie_id,powerhouse_event_id').eq('submission_key',submissionKey).maybeSingle();
    if(scanError||!scan)return json({error:'SCAN_NOT_FOUND'},404);
    if(scan.organisatie_id&&org&&scan.organisatie_id!==org.id)return json({error:'SCAN_ALREADY_CLAIMED'},409);
    const companyKey=org?`org:${org.slug||org.id}`:`tenant:${tenantId}`;
    const patch:any={company_key:companyKey,tenant_identity_status:'verified',bijgewerkt_op:new Date().toISOString()};
    if(org){patch.organisatie_id=org.id;patch.klant_slug=org.slug||null;}
    const {data:claimed,error:claimError}=await client.from('scan_inzendingen').update(patch).eq('id',scan.id).select('id,submission_key,organisatie_id,company_key,tenant_identity_status').single();
    if(claimError)return json({error:'SCAN_CLAIM_FAILED',detail:claimError.message.slice(0,200)},500);

    const preTenant=`scan:${submissionKey}`;
    const {data:pre}=await client.rpc('bg_portal_state_get_internal',{p_tenant_id:preTenant,p_layer:'canonical-brain'});
    const prePayload=Array.isArray(pre)&&pre[0]?.payload?pre[0].payload:null;
    if(prePayload){
      const next={...prePayload,tenantId,updatedBy:'portal-claim',updatedAt:new Date().toISOString(),sourceUpdatedAt:new Date().toISOString(),
        data:{...(prePayload.data||{}),sourceMeta:{...(prePayload.data?.sourceMeta||{}),live:true,label:'Workshopscan · gekoppeld aan klantportaal',updatedAt:new Date().toISOString()}}};
      const {error:portalError}=await client.rpc('bg_portal_state_put_internal',{p_tenant_id:tenantId,p_layer:'canonical-brain',p_payload:next});
      if(portalError)return json({error:'PORTAL_CLAIM_FAILED',detail:portalError.message.slice(0,200)},500);
    }
    await client.from('workshop_portal_intakes').update({status:'claimed',claimed_tenant_id:tenantId,claimed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('submission_key',submissionKey);

    const verifyKey=`scan-identity:${submissionKey}:${tenantId}`;
    const {error:eventError}=await client.from('powerhouse_runtime_events').upsert({dedupe_key:verifyKey,event_type:'scan_identity_verified',source:'portal.identity',company_key:companyKey,channel:'portal',topic_key:'digital_maturity',occurred_at:new Date().toISOString(),evidence:{scan_id:scan.id,submission_key:submissionKey,original_event_id:scan.powerhouse_event_id},context:{organisation_id:org?.id||null,organisation_slug:org?.slug||null,portal_tenant_id:tenantId,tenant_identity_status:'verified',learning_scope:'account_and_aggregate'},state:'observed',data_quality:'VERIFIED',confidence:1},{onConflict:'dedupe_key',ignoreDuplicates:true});
    if(eventError)return json({error:'IDENTITY_EVENT_FAILED',scan:claimed,detail:eventError.message.slice(0,200)},500);
    return json({ok:true,claimed:true,scan:claimed,portal_preprovisioned:Boolean(prePayload)});
  }

  let scan:any;try{scan=normalize(body)}catch(e){return json({error:String((e as Error).message||'INVALID_SCAN')},422)}
  if(body?.dry_run===true)return json({ok:true,dry_run:true,contract:'powerhouse-canonical-scan-loop-v1',normalized:{submission_key:scan.submissionKey,score:scan.score,niveau:scan.niveau,dimensions:Object.keys(scan.dimensions).length}});
  const scanRow={submission_key:scan.submissionKey,schema_version:2,soort:scan.kind,scan_datum:scan.datum,score:scan.score,branche:scan.branche,omvang:scan.omvang,niveaus:scan.dimensions,taken:[],doel:scan.doel,bron:'website',bron_url:scan.canonical,organisatie_id:null,tenant_identity_status:'unverified',company_key:null,payload:{contract:'powerhouse-canonical-scan-loop-v1',niveau:scan.niveau,dimensions:scan.dimensions,antwoorden:scan.answers,source_version:clean(scan.raw?.stempel,120)||null,source_kind:clean(scan.raw?.source_kind,80)||scan.kind,attribution:safeObj(scan.raw?.attribution)}};
  const {data:created,error:insertError}=await client.from('scan_inzendingen').upsert(scanRow,{onConflict:'submission_key',ignoreDuplicates:true}).select('id,submission_key,score,tenant_identity_status,powerhouse_event_id,aangemaakt').maybeSingle();
  if(insertError)return json({error:'SCAN_STORE_FAILED',detail:insertError.message.slice(0,300)},500);
  let stored=created;
  if(!stored){const {data,error}=await client.from('scan_inzendingen').select('id,submission_key,score,tenant_identity_status,powerhouse_event_id,aangemaakt').eq('submission_key',scan.submissionKey).maybeSingle();if(error||!data)return json({error:'SCAN_READBACK_FAILED'},500);stored=data;}
  const dedupe=`scan:${scan.submissionKey}`;
  const eventRow={dedupe_key:dedupe,event_type:'scan_submitted',source:scan.kind==='workshop_scan'?'website.workshop_scan':'website.frisse_blik',channel:'website',topic_key:'digital_maturity',occurred_at:new Date().toISOString(),evidence:{scan_id:stored.id,submission_key:scan.submissionKey,canonical:scan.canonical},context:{score:scan.score,niveau:scan.niveau,dimensions:scan.dimensions,scan_kind:scan.kind,tenant_identity_status:'unverified',learning_scope:'aggregate_only'},state:'observed',data_quality:'OBSERVED',confidence:0.9};
  const {data:eventCreated,error:eventError}=await client.from('powerhouse_runtime_events').upsert(eventRow,{onConflict:'dedupe_key',ignoreDuplicates:true}).select('event_id,dedupe_key').maybeSingle();
  if(eventError)return json({error:'POWERHOUSE_EVENT_FAILED',scan_id:stored.id,detail:eventError.message.slice(0,300)},500);
  let event=eventCreated;
  if(!event){const {data,error}=await client.from('powerhouse_runtime_events').select('event_id,dedupe_key').eq('dedupe_key',dedupe).maybeSingle();if(error||!data)return json({error:'POWERHOUSE_EVENT_READBACK_FAILED',scan_id:stored.id},500);event=data;}
  const {error:updateError}=await client.from('scan_inzendingen').update({powerhouse_event_id:event.event_id,bijgewerkt_op:new Date().toISOString()}).eq('id',stored.id);
  if(updateError)return json({error:'SCAN_EVENT_LINK_FAILED',scan_id:stored.id,event_id:event.event_id},500);

  let portalPreprovisioned=false;
  if(scan.kind==='workshop_scan'){
    const intake=portalIntake(body?.portal_intake);
    if(intake){
      const portalTenantId=`scan:${scan.submissionKey}`;
      const snapshot={score:scan.score,niveau:scan.niveau,dimensions:scan.dimensions,answers:scan.answers,branche:scan.branche,omvang:scan.omvang,doel:scan.doel,datum:scan.datum};
      const {error:intakeError}=await client.from('workshop_portal_intakes').upsert({
        submission_key:scan.submissionKey,portal_tenant_id:portalTenantId,
        company_name:intake.company_name,contact_name:intake.contact_name,email:intake.email,website:intake.website,
        employees:intake.employees,sector:intake.sector,region:intake.region,scan_snapshot:snapshot,updated_at:new Date().toISOString()
      },{onConflict:'submission_key'});
      if(intakeError)return json({error:'PORTAL_INTAKE_STORE_FAILED',detail:intakeError.message.slice(0,200)},500);
      const projection=preprovisionProjection(scan,intake,portalTenantId);
      const {error:portalError}=await client.rpc('bg_portal_state_put_internal',{p_tenant_id:portalTenantId,p_layer:'canonical-brain',p_payload:projection});
      if(portalError)return json({error:'PORTAL_PREPROVISION_FAILED',detail:portalError.message.slice(0,200)},500);
      portalPreprovisioned=true;
    }
  }

  await client.from('growth_events').upsert({event_id:dedupe,event_type:'scan_completed',canonical:scan.canonical,intent:scan.kind==='workshop_scan'?'workshop_scan':'frisse_blik',intent_owner:'bedrijfsgeheugen',source:'website',medium:'organic',occurred_at:new Date().toISOString(),page_role:'conversion',funnel_stage:'lead',value:0,payload:{scan_id:stored.id,score:scan.score,niveau:scan.niveau,scan_kind:scan.kind,privacy_scope:'no_pii'}},{onConflict:'event_id',ignoreDuplicates:true});
  return json({ok:true,stored:true,deduped:!created,contract:'powerhouse-canonical-scan-loop-v1',scan_id:stored.id,event_id:event.event_id,tenant_identity_status:'unverified',portal_preprovisioned:portalPreprovisioned},created?201:200);
});