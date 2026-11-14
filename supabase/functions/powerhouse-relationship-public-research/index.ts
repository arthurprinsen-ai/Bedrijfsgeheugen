import {researchSourceCandidate,researchRetryAt,researchNoSourceFeedback} from '../_shared/relationship-research-feedback.mjs';
import {eligiblePublicCompanyPage,publishedBusinessMailto} from '../_shared/public-business-email-evidence.mjs';
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


const isTrue=(v:unknown)=>v===true||v==='true';
async function readBoundedPublicPage(url:string):Promise<string|null>{
  // Read only a public HTTPS company page from an existing organic or first-party sourced company domain.
  // Never follow redirects or auth challenges; cap both time and bytes.
  try{
    const res=await fetch(url,{method:'GET',redirect:'error',signal:AbortSignal.timeout(2500),
      headers:{accept:'text/html,application/xhtml+xml'}});
    const len=Number(res.headers.get('content-length')||0);
    if(!res.ok||!/^text\/html|^application\/xhtml\+xml/i.test(res.headers.get('content-type')||'')||
      len>160000||!res.body)return null;
    const reader=res.body.getReader(), chunks:Uint8Array[]=[];
    let size=0;
    for(;;){
      const part=await reader.read();
      if(part.done)break;
      size+=part.value.byteLength;
      if(size>160000){await reader.cancel();return null;}
      chunks.push(part.value);
    }
    const buffer=new Uint8Array(size);let offset=0;
    for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.byteLength;}
    return new TextDecoder().decode(buffer);
  }catch{return null;}
}
async function ingestPublicWorkEmail(db:any,action:any,organic:any[],observedAt:string){
  // The original business contact record and its explicit approval are mandatory.
  // STAGE ONLY: unverified public address is never promoted to the canonical contact delivery field.
  let q=await db.from('bg_connecties')
    .select('sleutel,linkedin_url,naam,bedrijf,rol,email,extra,bijgewerkt_op')
    .eq('sleutel',action.person_key).limit(1).maybeSingle();
  if(q.error)throw new Error('PUBLIC_EMAIL_CONTACT_READ:'+q.error.message);
  if(!q.data)q=await db.from('bg_connecties')
    .select('sleutel,linkedin_url,naam,bedrijf,rol,email,extra,bijgewerkt_op')
    .eq('linkedin_url',action.person_key).limit(1).maybeSingle();
  if(q.error)throw new Error('PUBLIC_EMAIL_CONTACT_READ:'+q.error.message);
  const contact=q.data;
  if(!contact||
     Object.hasOwn(contact.extra||{},'approval_revoked')||isTrue(contact.extra?.opt_out)||
     isTrue(contact.extra?.do_not_contact)||
     clean(contact.naam).toLowerCase()!==clean(action.person_name).toLowerCase()||
     clean(contact.bedrijf).toLowerCase()!==clean(action.company_name).toLowerCase()||
     clean(contact.email))
    return {status:'NOT_ELIGIBLE',sites:0,stored:0,receipts:0};
  const sites=(organic||[]).filter((item:any)=>['organic','first_party_company_domain'].includes(item?.type)&&
    eligiblePublicCompanyPage(item?.url,contact.bedrijf)).slice(0,2);
  let checked=0;
  for(const item of sites){
    const page=await readBoundedPublicPage(clean(item.url));
    if(!page)continue;
    checked++;
    const evidence=publishedBusinessMailto({html:page,sourceUrl:item.url,
      personName:contact.naam,companyName:contact.bedrijf,observedAt});
    if(!evidence)continue;
    const {data:suppressed,error:sErr}=await db.from('powerhouse_email_contact_suppressions')
      .select('suppression_id').eq('active',true).ilike('email',evidence.email).limit(1);
    if(sErr)throw new Error('PUBLIC_EMAIL_SUPPRESSION_READ:'+sErr.message);
    if((suppressed||[]).length)return {status:'SUPPRESSED',sites:checked,stored:0,receipts:0};
    const lineage={
      contract:evidence.contract,classification:evidence.classification,
      source_url:evidence.source_url,observed_at:evidence.observed_at,
      person_key:action.person_key,research_action_id:action.action_id,
      provider:'original-public-page-read',confidence:evidence.confidence,
      delivery_status:'UNVERIFIED',contact_approval_evidenced:isTrue(contact.extra?.human_approved),
      lawful_outreach_basis:'NOT_INFERRED',
      send_authorized:false,consumer_processed:false
    };
    let written=0;
    const existingCandidate=contact.extra?.public_work_email_candidate;
    if(clean(existingCandidate?.email)&&existingCandidate?.research_action_id!==action.action_id)
      return {status:'EXISTING_CANDIDATE_AWAITS_VERIFICATION',sites:checked,stored:0,receipts:0};
    const samePrior=existingCandidate?.email===evidence.email&&
      existingCandidate?.research_action_id===action.action_id;
    if(!samePrior){
      const query=db.from('bg_connecties').update({
         extra:{...(contact.extra||{}),public_work_email_candidate:{...lineage,email:evidence.email,
           data_processing_state:'CANDIDATE_NOT_PROMOTED',email_verification:'UNVERIFIED'}},
         bijgewerkt_op:observedAt
       });
      const scoped=contact.sleutel?query.eq('sleutel',contact.sleutel):query.eq('linkedin_url',contact.linkedin_url);
      const guardedBase=scoped.eq('bijgewerkt_op',contact.bijgewerkt_op);
      const guarded=contact.email==null?guardedBase.is('email',null):guardedBase.eq('email','');
      const {data:updated,error:uErr}=await guarded.select('sleutel');
      if(uErr)throw new Error('PUBLIC_EMAIL_CANONICAL_WRITE:'+uErr.message);
      if(!updated?.length)return {status:'CAS_CONFLICT',sites:checked,stored:0,receipts:0};
      written=1;
    }
    // Candidate ACK != consumer PROCESSED. #138 identity graph and #116 NBA
    // must independently read this real canonical contact/event on their natural runs.
    const {data:evt,error:eErr}=await db.from('powerhouse_runtime_events').upsert({
      dedupe_key:'public-work-email-source:'+action.action_id,
      event_type:'contact_public_work_email_candidate',
      source:CONTRACT,subject_key:'relationship:'+action.person_key,
      person_key:action.person_key,company_key:action.company_key,
      occurred_at:observedAt,
      evidence:{contract:evidence.contract,classification:evidence.classification,
        source_url:evidence.source_url,observed_at:evidence.observed_at,
        candidate_address_present:true,
        canonical_email_written:false,
        deliverability:'UNVERIFIED',
        provider_send_authorized:false,
        original_research_action_id:action.action_id,
        handoff_state:'CANDIDATE_INGEST_ACK_CONSUMER_PROCESSED_PENDING'},
      context:{original_owner:'powerhouse-commercial-learning-v1',consumer_owner:'powerhouse-identity-graph-v1',
        correlation_id:action.action_id,person_key:action.person_key,
        external_messages_sent:0,source_revision:evidence.observed_at},
      state:'observed',data_quality:'SOURCE_ATTESTED_NOT_DELIVERABILITY',confidence:evidence.confidence
    },{onConflict:'dedupe_key'}).select('event_id').maybeSingle();
    if(eErr||!evt)throw new Error('PUBLIC_EMAIL_ORIGINAL_EVENT_ACK:'+(eErr?.message||'READBACK_MISSING'));
    return {status:'SOURCE_CANDIDATE_INGESTED_CONSUMER_PENDING',sites:checked,stored:written,receipts:1};
  }
  return {status:'NO_EXPLICIT_NAMED_OFFICIAL_MAILTO',sites:checked,stored:0,receipts:0};
}


async function originalFirstPartyDomainCandidatePass(db:any,observedAt:string){
  // No new SERP/provider call. Reuse verified-format business domains in the
  // existing first-party connection graph to select missing-address colleagues.
  // Research is not mailing authority; original recipient gate is unchanged.
  const day=observedAt.slice(0,10);
  const {data:known,error:kErr}=await db.from('bg_connecties')
    .select('sleutel,bedrijf,email').not('email','is',null)
    .order('sleutel',{ascending:true}).limit(900);
  if(kErr)throw new Error('FIRST_PARTY_DOMAIN_READ:'+kErr.message);
  const domains=new Map<string,{company:string,domain:string}>();
  for(const row of known||[]){
    const company=clean(row.bedrijf),mail=clean(row.email).toLowerCase();
    if(!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(mail)||!company)continue;
    const domain=mail.split('@')[1],site='https://'+domain+'/team';
    if(!eligiblePublicCompanyPage(site,company))continue;
    if(!domains.has(company.toLowerCase()))domains.set(company.toLowerCase(),{company,domain});
  }
  const entries=[...domains.values()].sort((a,b)=>a.company.localeCompare(b.company));
  if(!entries.length)return {companies:0,sites:0,candidates:0,ingest_acks:0,reason:'NO_SOURCE_DOMAIN'};
  const offset=Math.floor(Date.parse(day+'T00:00:00Z')/86400000)%entries.length;
  const {count:already,error:countErr}=await db.from('powerhouse_sales_actions')
    .select('action_id',{count:'exact',head:true})
    .like('dedupe_key','relationship-research:public-domain:'+day+':%');
  if(countErr)throw new Error('FIRST_PARTY_DAILY_CAP_READ:'+countErr.message);
  const remaining=Math.max(0,8-Number(already||0));
  let companies=0,eligibleSlots=0,sites=0,candidates=0,ingestAcks=0;
  // Bounded deterministic first eight ELIGIBLE company/contact slots each day.
  // Concurrent original calls select the same idempotent keys, not next eight.
  for(let n=0;n<Math.min(entries.length,80)&&eligibleSlots<8;n++){
    const {company,domain}=entries[(offset+n)%entries.length];
    const {data:targets,error:tErr}=await db.from('bg_connecties')
      .select('sleutel,linkedin_url,naam,bedrijf,rol,email,extra')
      .eq('bedrijf',company).is('email',null)
      .order('prioriteit',{ascending:false}).limit(1);
    if(tErr)throw new Error('FIRST_PARTY_TARGET_READ:'+tErr.message);
    const c=targets?.[0];
    if(!c||!clean(c.sleutel)||!clean(c.naam)||!clean(c.bedrijf)||
       Object.hasOwn(c.extra||{},'approval_revoked')||isTrue(c.extra?.opt_out)||
       isTrue(c.extra?.do_not_contact))continue;
    eligibleSlots++;
    const key='relationship-research:public-domain:'+day+':'+clean(c.sleutel);
    const {data:prior,error:priorErr}=await db.from('powerhouse_sales_actions')
      .select('action_id,evidence,person_key,person_name,company_name,company_key').eq('dedupe_key',key).maybeSingle();
    if(priorErr)throw new Error('FIRST_PARTY_RESEARCH_DEDUPE:'+priorErr.message);
    if(prior?.evidence?.public_email_source_checked===true)continue;
    if(prior?.evidence?.public_email_next_attempt_at&&
       Date.parse(prior.evidence.public_email_next_attempt_at)>Date.parse(observedAt))continue;
    if(!prior&&companies>=remaining)continue;
    const record={
      dedupe_key:key,subject_key:'relationship:'+c.sleutel,person_key:c.sleutel,
      company_key:company.toLowerCase(),action_type:'research_enrichment',
      channel:'internal',priority:0,reason:'Bounded public business contact source candidate; external side effects prohibited.',
      evidence:{contract:'powerhouse-first-party-domain-research-v1',
        first_party_domain:domain,public_page_only:true,no_new_provider_query:true,
        source_person_key:c.sleutel,requires_independent_public_mailto:true,
        send_authorized:false,external_side_effect_allowed:false},
      message_draft:'',status:'done',executed_at:observedAt,
      person_name:c.naam,company_name:c.bedrijf,role:c.rol
    };
    let selected=prior;
    if(!selected){
      const {data:created,error:aErr}=await db.from('powerhouse_sales_actions')
        .insert(record).select('action_id,person_key,person_name,company_name,company_key,evidence').maybeSingle();
      if(aErr){
        if(aErr.code==='23505')continue;
        throw new Error('FIRST_PARTY_ORIGINAL_ACTION_CREATE:'+aErr.message);
      }
      if(!created)continue;
      selected=created;
    }
    companies++;
    const result=await ingestPublicWorkEmail(db,selected,
      [{type:'first_party_company_domain',url:'https://'+domain+'/team'},
       {type:'first_party_company_domain',url:'https://'+domain+'/contact'}],observedAt);
    // This original action is terminal only after a real source disposition AND
    // its original evidence receipt. An HTTP/DB error leaves it retriable.
    const checked=result.sites>0||result.status==='SUPPRESSED'||
      result.status==='EXISTING_CANDIDATE_AWAITS_VERIFICATION';
    const nextAttemptAt=checked?null:new Date(Date.parse(observedAt)+4*3600000).toISOString();
    const evidence={...(selected.evidence||record.evidence),
      public_email_source_checked:checked,public_email_source_status:result.status,
      public_email_source_checked_at:observedAt,public_email_next_attempt_at:nextAttemptAt,
      public_email_ingest_ack:result.receipts>0,
      recipient_send_authority_inferred:false,external_send_executed:false};
    const {data:updated,error:uErr}=await db.from('powerhouse_sales_actions')
      .update({evidence}).eq('action_id',selected.action_id).eq('dedupe_key',key)
      .select('action_id').maybeSingle();
    if(uErr||!updated)throw new Error('FIRST_PARTY_RESEARCH_DISPOSITION_ACK:'+(uErr?.message||'NOT_PERSISTED'));
    sites+=result.sites;candidates+=result.stored;ingestAcks+=result.receipts;
  }
  return {companies,sites,candidates,ingest_acks:ingestAcks,source:'ORIGINAL_FIRST_PARTY_COMPANY_GRAPH',new_provider_queries:0};
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST') return json({ok:false,error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL')||'', service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!service) return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const expected=clean((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data);
  if(!expected||req.headers.get('x-powerhouse-token')!==expected) return json({ok:false,error:'UNAUTHORIZED'},401);

  const observedAt=new Date().toISOString();
  try{
    const {data:actions,error:aErr}=await db.from('powerhouse_sales_actions')
      .select('action_id,dedupe_key,person_key,company_key,company_name,person_name,role,priority,evidence')
      .eq('action_type','research_enrichment').eq('channel','internal').in('status',['suggested','prepared','waiting'])
      .like('dedupe_key','relationship-research:%').or('due_at.is.null,due_at.lte.'+observedAt).order('priority',{ascending:false}).limit(10);
    if(aErr) throw new Error('ACTIONS:'+aErr.message);

    // First-party public work-email candidate research remains runnable without
    // paid SERP credentials. A source failure is recorded and never swallows
    // the original legitimate company research or recipient safety gates.
    let freeDomain:any={companies:0,sites:0,candidates:0,ingest_acks:0,new_provider_queries:0};
    let freeDomainFailure:string|null=null;
    try{
      freeDomain=await originalFirstPartyDomainCandidatePass(db,observedAt);
    }catch(error:any){
      freeDomainFailure=clean(error?.message||error).slice(0,350);
      await db.from('bg_gezondheid').insert({gemeten_op:observedAt,
        onderdeel:'relationship-public-research:first-party',soort:'commercial-intelligence',
        status:'fout',detail:freeDomainFailure,
        gegevens:{contract:CONTRACT,source:'ORIGINAL_FIRST_PARTY_COMPANY_GRAPH',
          original_owner:'powerhouse-commercial-learning-v1',
          consumer_processed:false,external_send_executed:false}});
    }
    let user='',pass='';
    if((actions||[]).length){
      const [{data:login},{data:password}]=await Promise.all([
        db.rpc('bg_geheim',{p_naam:'DATAFORSEO_LOGIN'}),
        db.rpc('bg_geheim',{p_naam:'DATAFORSEO_PASSWORD'})
      ]);
      user=clean(login);pass=clean(password);
      if(!user||!pass)throw new Error('DATAFORSEO_CREDENTIALS_MISSING');
    }

    let researched=0,matched=0,events=0,noEvidence=0,sourceCandidatesReadback=0,noSourceFeedbackReadback=0,deferredOwnerAcks=0;
    let publicEmailSites=freeDomain.sites,publicWorkEmailCandidatesStaged=freeDomain.candidates,publicWorkEmailIngestAcks=freeDomain.ingest_acks,publicEmailSourceUnavailable=0;
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
      // Reuse the SAME already paid-for SERP result; do not buy extra searches,
      // run a parallel contact harvester or grant outbound permission.
      const publicEmail=await ingestPublicWorkEmail(db,action,organic,observedAt);
      publicEmailSites+=publicEmail.sites;
      publicWorkEmailCandidatesStaged+=publicEmail.stored;
      publicWorkEmailIngestAcks+=publicEmail.receipts;
      if(publicEmail.status==='CAS_CONFLICT')deferredOwnerAcks++;
      if(publicEmail.status==='NO_EXPLICIT_NAMED_OFFICIAL_MAILTO')publicEmailSourceUnavailable++;

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
        const candidate=researchSourceCandidate(action,best,observedAt);
        // Bridge only safe candidate metadata into the ORIGINAL held email.
        // Never set public_source_evidence, source_url, message_plan flags or Gmail send permission.
        if(candidate){
          const originId=candidate.original_outreach_action_id;
          const {data:origin,error:originErr}=await db.from('powerhouse_sales_actions')
            .select('action_id,person_key,company_key,status,evidence,updated_at')
            .eq('action_id',originId).eq('person_key',action.person_key)
            .eq('company_key',action.company_key).in('status',['prepared','waiting']).maybeSingle();
          if(originErr)throw new Error('ORIGINAL_OUTREACH_LOOKUP:'+originErr.message);
          if(origin?.evidence?.execution_gate?.reason==='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'){
            const {data:saved,error:saveErr}=await db.from('powerhouse_sales_actions').update({
              evidence:{...origin.evidence,relationship_source_candidate:candidate},
              updated_at:observedAt
            }).eq('action_id',originId).eq('status',origin.status)
              .eq('updated_at',origin.updated_at).select('action_id').maybeSingle();
            if(saveErr)throw new Error('ORIGINAL_OUTREACH_SOURCE_CANDIDATE:'+saveErr.message);
            if(saved)sourceCandidatesReadback++;
            else deferredOwnerAcks++;
          }
        }
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
          evidence:{...(action.evidence||{}),relationship_source_candidate:candidate||null,public_research_execution:{contract:CONTRACT,trigger_type:best.trigger_type,headline:best.title,summary:best.summary,source_url:best.url,confidence,observed_at:observedAt,provider:'dataforseo-serp',vendor_used:false,evidence_only:true,original_outreach_writeback_scoped:true}}
        }).eq('action_id',action.action_id);
        if(uErr) throw new Error('ACTION_UPDATE:'+uErr.message);
      }else{
        noEvidence++;
        const nextResearchAt=['source_specific_evidence','public_work_email_source'].includes(action?.evidence?.research_need)
          ?researchRetryAt(observedAt,24):null;
        const {error:uErr}=await db.from('powerhouse_sales_actions').update({
          status:'waiting',...(nextResearchAt?{due_at:nextResearchAt}:{}),
          evidence:{...(action.evidence||{}),public_research_execution:{
            contract:CONTRACT,no_current_trigger_evidence:true,researched_at:observedAt,
            next_research_at:nextResearchAt,reason:'NO_VERIFIED_SOURCE_IN_BOUNDED_ORIGINAL_SEARCH',
            provider:'dataforseo-serp',vendor_used:false,evidence_only:true,
            external_outreach_executed:false}}
        }).eq('action_id',action.action_id);
        if(uErr) throw new Error('ACTION_WAIT:'+uErr.message);
        // Exact original owner receives the NO_SOURCE disposition, even when
        // original recipient action is WAITING; preserve the no-outbound gate.
        const originId=clean(action?.evidence?.original_outreach_action_id);
        if(originId){
          const {data:origin,error:originErr}=await db.from('powerhouse_sales_actions')
            .select('action_id,person_key,company_key,status,evidence,updated_at')
            .eq('action_id',originId).eq('person_key',action.person_key)
            .eq('company_key',action.company_key)
            .in('status',['prepared','waiting']).maybeSingle();
          if(originErr)throw new Error('ORIGINAL_NO_SOURCE_OWNER_LOOKUP:'+originErr.message);
          const feedback=researchNoSourceFeedback(action,origin,observedAt,nextResearchAt);
          if(feedback){
            const {data:saved,error:saveErr}=await db.from('powerhouse_sales_actions')
              .update({evidence:{...origin.evidence,relationship_research_feedback:feedback},updated_at:observedAt})
              .eq('action_id',originId).eq('status',origin.status)
              .eq('updated_at',origin.updated_at).select('action_id').maybeSingle();
            if(saveErr)throw new Error('ORIGINAL_NO_SOURCE_OWNER_WRITEBACK:'+saveErr.message);
            if(saved)noSourceFeedbackReadback++;
            else deferredOwnerAcks++; // Original #116 reconciler will safely replay ACK.
          }
        }
      }
    }

    if(events>0){
      const {error:rErr}=await db.rpc('powerhouse_refresh_trigger_based_mkb_acquisition_v1',{p_run_date:observedAt.slice(0,10)});
      if(rErr) throw new Error('TRIGGER_REFRESH:'+rErr.message);
    }
    await db.from('bg_gezondheid').insert({
      gemeten_op:observedAt,onderdeel:'relationship-public-research',soort:'commercial-intelligence',
      status:freeDomainFailure?'fout':'ok',detail:`researched=${researched}; matched=${matched}; events=${events}; no_evidence=${noEvidence}`,
      gegevens:{contract:CONTRACT,researched,matched,events,no_evidence:noEvidence,source_candidates_writeback:sourceCandidatesReadback,no_source_owner_acks:noSourceFeedbackReadback,deferred_owner_acks:deferredOwnerAcks,public_email_sites_checked:publicEmailSites,public_work_email_candidates_staged:publicWorkEmailCandidatesStaged,public_email_source_ingest_acks:publicWorkEmailIngestAcks,public_email_unavailable:publicEmailSourceUnavailable,free_domain_research:freeDomain,free_domain_error:freeDomainFailure,public_email_consumer_processed:'NOT_PROVEN',vendor_enrichment:false,external_outreach_executed:false}
    });
    return json({ok:!freeDomainFailure,contract:CONTRACT,researched,matched,events,no_evidence:noEvidence,source_candidates_writeback:sourceCandidatesReadback,no_source_owner_acks:noSourceFeedbackReadback,deferred_owner_acks:deferredOwnerAcks,public_email_sites_checked:publicEmailSites,public_work_email_candidates_staged:publicWorkEmailCandidatesStaged,public_email_source_ingest_acks:publicWorkEmailIngestAcks,public_email_unavailable:publicEmailSourceUnavailable,public_email_consumer_processed:'NOT_PROVEN',vendor_enrichment:false,external_outreach_executed:false,observed_at:observedAt});
  }catch(error:any){
    const detail=clean(error?.message||error).slice(0,500);
    try { await db.from('bg_gezondheid').insert({gemeten_op:observedAt,onderdeel:'relationship-public-research',soort:'commercial-intelligence',status:'fout',detail,gegevens:{contract:CONTRACT}}); } catch { /* best-effort failure telemetry */ }
    return json({ok:false,contract:CONTRACT,error:detail},503);
  }
});
