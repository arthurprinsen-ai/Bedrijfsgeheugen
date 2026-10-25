import { createClient } from 'npm:@supabase/supabase-js@2';

const CONTRACT='powerhouse-linkedin-sales-machine-v1';
const clean=(v:unknown)=>String(v??'').trim();
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});

async function secret(db:any,name:string){
  const env=Deno.env.get(name); if(env)return clean(env);
  const {data}=await db.rpc('bg_geheim',{p_naam:name});
  return clean(data);
}
const COMPOSIO_BASE='https://backend.composio.dev/api/v3.1';
class SalesRobotProviderBlock extends Error{
  evidence:any;
  constructor(code:string,evidence:any){super(code);this.evidence=evidence;}
}
async function composioExecuteArgs(apiKey:string,connectedAccountId:string,userId:string,toolSlug:string,args:Record<string,unknown>){
  // Composio v3.1 must bind both connected_account_id and its exact user_id.
  // Without user_id the live SalesRobot read-only tool returned HTTP 400 even for ACTIVE connections.
  if(!clean(userId)||!clean(connectedAccountId))throw new Error('SALESROBOT_COMPOSIO_IDENTITY_MISSING');
  const response=await fetch(COMPOSIO_BASE+'/tools/execute/'+toolSlug,{
    method:'POST',headers:{'content-type':'application/json','x-api-key':apiKey},
    body:JSON.stringify({connected_account_id:connectedAccountId,user_id:userId,version:'latest',arguments:args}),
    signal:AbortSignal.timeout(18000)
  });
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok||body?.successful!==true){
    const err=body?.error||body?.message||body?.data?.message||body;
    const detail=typeof err==='string'?err:JSON.stringify(err);
    throw new Error('COMPOSIO_'+toolSlug+'_'+response.status+':'+clean(detail).slice(0,240));
  }
  return body;
}
function salesRobotExecutionBlock(account:any):string|null{
  const license=clean(account?.paymentStatus||account?.subscription).toUpperCase();
  if(!['ACTIVE','TRIAL_ACTIVE'].includes(license))return 'SALESROBOT_BILLING_INACTIVE';
  const days=Number(account?.daysOfExecutionRemaining);
  if(!Number.isFinite(days)||days<=0)return 'SALESROBOT_EXECUTION_DAYS_EXHAUSTED';
  if(account?.hasCampaigns!==true)return 'SALESROBOT_CAMPAIGN_REQUIRED';
  if(account?.hasActiveCampaigns!==true)return 'SALESROBOT_ACTIVE_CAMPAIGN_REQUIRED';
  return null;
}
async function salesRobotContext(db:any){
  const apiKey=await secret(db,'COMPOSIO_API_KEY');
  if(!apiKey)throw new Error('SALESROBOT_COMPOSIO_API_KEY_MISSING');
  const response=await fetch(COMPOSIO_BASE+'/connected_accounts?toolkit_slugs=salesrobot&statuses=ACTIVE&account_type=ALL&limit=25',{headers:{'x-api-key':apiKey}});
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error('SALESROBOT_ACCOUNT_DISCOVERY_'+response.status);
  const items=Array.isArray(body?.items)?body.items:Array.isArray(body?.data?.items)?body.data.items:Array.isArray(body?.data)?body.data:[];
  const active=items.filter((x:any)=>clean(x?.status).toUpperCase()==='ACTIVE'&&x?.is_disabled!==true);
  active.sort((a:any,b:any)=>Number(clean(b?.alias)==='powerhouse-linkedin-dm-direct')-Number(clean(a?.alias)==='powerhouse-linkedin-dm-direct'));
  const connected=active[0]; if(!connected)throw new Error('SALESROBOT_CONNECTION_UNAVAILABLE');
  const connectedAccountId=clean(connected?.id||connected?.connected_account_id);
  const userId=clean(connected?.user_id);
  if(!userId)throw new Error('SALESROBOT_COMPOSIO_USER_ID_MISSING');
  const probe=await composioExecuteArgs(apiKey,connectedAccountId,userId,'SALESROBOT_LIST_LINKEDIN_ACCOUNTS',{limit:25});
  const data:any=probe?.data||probe;
  const accounts=Array.isArray(data?.items)?data.items:Array.isArray(data?.data?.items)?data.data.items:Array.isArray(data?.data?.data)?data.data.data:[];
  const healthy=accounts.find((x:any)=>clean(x?.healthStatus).toUpperCase()==='HEALTHY'&&x?.cookieExpired!==true&&x?.connectionTempPaused!==true&&x?.connectionLimitReached!==true);
  // Persist exact provider-reported blockers, not merely the health of an ACTIVE Composio adapter.
  const observed=healthy||accounts[0]||{};
  const payment=clean(observed?.paymentStatus||observed?.subscription).toUpperCase();
  const observedHealth=clean(observed?.healthStatus).toUpperCase();
  const readinessEvidence={
    provider_health:observedHealth||'MISSING',payment_status:payment||'MISSING',
    cookie_expired:observed?.cookieExpired===true,
    execution_days_remaining:Number.isFinite(Number(observed?.daysOfExecutionRemaining))?Number(observed.daysOfExecutionRemaining):null,
    campaign_present:observed?.hasCampaigns===true,
    active_campaign_present:observed?.hasActiveCampaigns===true,
    linked_account_observed:accounts.length>0,
    provider_probe_verified:true,
    send_proof:false
  };
  const problems:string[]=[];
  if(!['ACTIVE','TRIAL_ACTIVE'].includes(payment))problems.push('SALESROBOT_BILLING_INACTIVE');
  if(Number(readinessEvidence.execution_days_remaining)<=0||readinessEvidence.execution_days_remaining===null)problems.push('SALESROBOT_EXECUTION_DAYS_EXHAUSTED');
  if(readinessEvidence.cookie_expired)problems.push('SALESROBOT_COOKIE_EXPIRED');
  if(observedHealth!=='HEALTHY')problems.push('SALESROBOT_LINKEDIN_ACCOUNT_NOT_HEALTHY');
  if(observed?.hasActiveCampaigns!==true)problems.push('SALESROBOT_ACTIVE_CAMPAIGN_REQUIRED');
  if(!healthy)throw new SalesRobotProviderBlock('SALESROBOT_LINKEDIN_ACCOUNT_NOT_HEALTHY',{...readinessEvidence,blockers:problems});
  const blocked=salesRobotExecutionBlock(healthy);
  if(blocked)throw new SalesRobotProviderBlock(blocked,{...readinessEvidence,blockers:problems});
  return {apiKey,connectedAccountId,userId,linkedinAccountUuid:clean(healthy.linkedinAccountUuid),healthStatus:clean(healthy.healthStatus),subscription:clean(healthy.subscription||healthy.paymentStatus),
    readinessEvidence:{...readinessEvidence,blockers:[]}};
}
async function recordCapability(db:any,capability:string,status:string,evidence:any){
  const {error}=await db.from('powerhouse_channel_capabilities_v1').upsert({
    capability_key:capability,provider:'salesrobot',channel:'linkedin_dm',status,
    checked_at:new Date().toISOString(),expires_at:new Date(Date.now()+60*60*1000).toISOString(),evidence
  },{onConflict:'capability_key'});
  if(error)throw new Error('SALESROBOT_CAPABILITY_WRITE:'+error.message);
}
function salesRobotAddress(action:any){
  const e=action?.evidence||{};
  return {
    prospect_uuid:clean(e?.salesrobot_prospect_uuid||e?.prospect_uuid),
    thread_id:clean(e?.salesrobot_thread_id||e?.thread_id),
    unipile_chat_id:clean(e?.salesrobot_unipile_chat_id||e?.unipile_chat_id),
    unipile_sales_nav_chat_id:clean(e?.salesrobot_sales_nav_chat_id||e?.unipile_sales_nav_chat_id)
  };
}
// The action's human-approval bit alone cannot authorize a person addressed by LinkedIn.
async function approvedLinkedinRecipient(db:any,action:any):Promise<boolean>{
  const identity=clean(action?.person_key);
  if(!identity||action?.evidence?.human_approved!==true)return false;
  let result=await db.from('bg_connecties').select('sleutel,linkedin_url,extra').eq('sleutel',identity).limit(2);
  if(result.error)throw new Error('LINKEDIN_CONTACT_AUTHORITY_READ:'+result.error.message);
  if(!result.data?.length)result=await db.from('bg_connecties').select('sleutel,linkedin_url,extra').eq('linkedin_url',identity).limit(2);
  if(result.error)throw new Error('LINKEDIN_CONTACT_AUTHORITY_READ:'+result.error.message);
  if(result.data?.length!==1)return false;
  const contact=result.data[0],authority=contact?.extra||{};
  return (clean(contact.sleutel)===identity||clean(contact.linkedin_url)===identity)
    &&authority.human_approved===true
    &&authority.do_not_contact!==true
    &&authority.linkedin_dm_allowed!==false;
}

// Reconcile against an independent observed inbox receipt, never against provider send response alone.
// The five historical verified SalesRobot receipts already use this canonical runtime event contract.
async function reconcileVerifiedSalesRobotReceipts(db:any){
  const {data:pending,error}=await db.from('powerhouse_sales_actions')
    .select('action_id,person_key,company_key,evidence')
    .eq('channel','linkedin_dm').eq('status','waiting')
    .contains('evidence',{salesrobot_execution:{needs_readback:true}}).limit(10);
  if(error)throw new Error('SALESROBOT_RECEIPT_RECONCILE_READ:'+error.message);
  const resolved:any[]=[];
  for(const action of pending||[]){
    const old=action.evidence?.salesrobot_execution||{};
    const messageId=clean(old.provider_message_id),prospectId=clean(old.prospect_uuid);
    if(!messageId||!prospectId||old.republish_forbidden!==true)continue;
    const {data:events,error:receiptError}=await db.from('powerhouse_runtime_events')
      .select('event_id,occurred_at,evidence')
      .eq('event_type','salesrobot_linkedin_dm_sent').eq('source','salesrobot')
      .eq('channel','linkedin_dm')
      .eq('evidence->>inbox_message_id',messageId)
      .eq('evidence->>provider_prospect_uuid',prospectId).limit(2);
    if(receiptError)throw new Error('SALESROBOT_PROVIDER_RECEIPT_READ:'+receiptError.message);
    if(events?.length!==1)continue;
    const receipt=events[0],proof=receipt.evidence||{};
    if(proof.provider_inbox_readback!==true||proof.inbox_message_sent_by_me!==true||
       clean(proof.provider_step_status).toUpperCase()!=='SENT'||
       clean(proof.inbox_message_id)!==messageId||clean(proof.provider_prospect_uuid)!==prospectId)continue;
    const attemptedMs=Date.parse(clean(old.attempted_at||old.executed_at)),proofMs=Date.parse(clean(receipt.occurred_at));
    if(!Number.isFinite(attemptedMs)||!Number.isFinite(proofMs)||proofMs<attemptedMs-300000)continue;
    const canonicalEventId=clean(receipt.event_id);
    const {error:outcomeError}=await db.from('powerhouse_sales_outcomes').upsert({
      dedupe_key:'salesrobot-verified-inbox:'+action.action_id,action_id:action.action_id,
      outcome_type:'sent',subject_key:'relationship:'+clean(action.person_key),
      person_key:action.person_key,company_key:action.company_key,
      channel:'linkedin_dm',revenue_eur:0,occurred_at:receipt.occurred_at,
      evidence:{contract:CONTRACT,provider:'salesrobot',provider_readback_verified:true,
        provider_message_id:messageId,provider_event_id:canonicalEventId,provider_prospect_uuid:prospectId}
    },{onConflict:'dedupe_key'});
    if(outcomeError)throw new Error('SALESROBOT_VERIFIED_OUTCOME_WRITE:'+outcomeError.message);
    const verifiedEvidence={...(action.evidence||{}),salesrobot_execution:{
      ...old,provider_ack_verified:true,provider_readback_verified:true,
      provider_event_id:canonicalEventId,readback_at:new Date().toISOString(),
      needs_readback:false,republish_forbidden:true
    }};
    const {data:confirmed,error:writeError}=await db.from('powerhouse_sales_actions')
      .update({status:'done',executed_at:receipt.occurred_at,
        evidence:verifiedEvidence,updated_at:new Date().toISOString()})
      .eq('action_id',action.action_id).eq('status','waiting').select('action_id').maybeSingle();
    if(writeError)throw new Error('SALESROBOT_VERIFIED_ACTION_WRITE:'+writeError.message);
    if(confirmed)resolved.push({action_id:action.action_id,provider_readback_verified:true});
  }
  return resolved;
}

async function generateComment(apiKey:string,model:string,action:any){
  const evidence=action.evidence||{};
  const response=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'},
    body:JSON.stringify({
      model,max_tokens:400,temperature:0.2,
      system:'Je schrijft een inhoudelijke LinkedIn-reactie namens Arthur Prinsen. Reageer uitsluitend op de aangeleverde postcontext. Voeg één concrete observatie, nuance of nuttige vraag toe. Geen verkooptekst, geen Bedrijfsgeheugen-pitch, geen afspraak-CTA, geen overdreven compliment, geen verzonnen feit, geen emoji-spam. Nederlands tenzij de postcontext duidelijk Engelstalig is. Maximaal 450 tekens.',
      messages:[{role:'user',content:JSON.stringify({
        person_name:action.person_name,company_name:action.company_name,role:action.role,
        headline:evidence.headline,summary:evidence.summary,trigger_type:evidence.trigger_type,source_url:action.source_url
      })}]
    }),
    signal:AbortSignal.timeout(30000)
  });
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error('COMMENT_AI_'+response.status+':'+clean(body?.error?.message).slice(0,180));
  const text=clean((body?.content||[]).find((x:any)=>x.type==='text')?.text);
  if(!text||text.length>500)throw new Error('COMMENT_AI_OUTPUT_INVALID');
  if(/bedrijfsgeheugen|bel(l)?en|afspraak|demo|scan|offerte/i.test(text))throw new Error('COMMENT_AI_SALES_PITCH_BLOCKED');
  return text;
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({ok:false,error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL')||'',service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!service)return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const expected=await secret(db,'powerhouse_daily_scheduler_token');
  if(!expected||req.headers.get('x-powerhouse-token')!==expected)return json({ok:false,error:'UNAUTHORIZED'},401);
  let input:any={}; try{input=await req.json();}catch{}
  const runDate=clean(input?.run_date)||new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const dryRun=input?.dry_run===true;
  const now=new Date().toISOString();

  try{
    // Probe transport before AI, drafting or daily SQL; a composer failure must not hide provider loss.
    // Dry-run may inspect the external provider but must never mutate CRM, message plans or capability state.
    let srPreflight:any=null, srPreflightError='', srPreflightDetails:any={};
    try{ srPreflight=await salesRobotContext(db);srPreflightDetails=srPreflight?.readinessEvidence||{}; }
    catch(err:any){ srPreflightError=clean(err?.message||err).slice(0,240);srPreflightDetails=err?.evidence||{}; }
    const providerStatus=srPreflight?'CONFIG_REQUIRED':
      (/^SALESROBOT_(CONNECTION_UNAVAILABLE|LINKEDIN_ACCOUNT_NOT_HEALTHY)$/.test(srPreflightError)?'UNAVAILABLE':'CONFIG_REQUIRED');
    if(dryRun){
      const [comments,dms]=await Promise.all([
        db.from('powerhouse_sales_actions').select('action_id',{count:'exact',head:true})
          .eq('action_type','reply_post').eq('channel','linkedin_personal').eq('status','prepared'),
        db.from('powerhouse_sales_actions').select('action_id,action_type,person_key,evidence,message_draft',{count:'exact'})
          .eq('channel','linkedin_dm').in('status',['prepared','suggested'])
          .order('priority',{ascending:false}).limit(100)
      ]);
      if(comments.error||dms.error)throw new Error('LINKEDIN_DRY_RUN_READ:'+clean(comments.error?.message||dms.error?.message));
      const candidateRows=dms.data||[];
      const approvedRows=candidateRows.filter((a:any)=>a?.evidence?.human_approved===true);
      const addressedRows=candidateRows.filter((a:any)=>Object.values(salesRobotAddress(a)).some(Boolean));
      let verifiedRecipientCount=0;
      for(const action of approvedRows.filter((a:any)=>Object.values(salesRobotAddress(a)).some(Boolean))){
        if(await approvedLinkedinRecipient(db,action))verifiedRecipientCount++;
      }
      return json({ok:true,dry_run:true,contract:CONTRACT,
        comment_candidates:comments.count||0,dm_candidates:dms.count||0,
        dm_candidate_sample_count:candidateRows.length,dm_action_approved:approvedRows.length,
        dm_provider_addressable:addressedRows.length,dm_crm_recipient_approved:verifiedRecipientCount,
        dm_ready_for_send:srPreflight?verifiedRecipientCount:0,
        dm_capability:providerStatus,dm_provider:'salesrobot',provider_probe_error:srPreflightError||null,
        provider_evidence:srPreflightDetails,external_side_effects:false,canonical_mutations:false});
    }
    const providerEvidence={
      contract:'powerhouse-capability-routing-v1',checked_at:now,
      provider_preflight_before_composer:true,provider_probe_error:srPreflightError||null,
      account_transport_healthy:!!srPreflight,subscription:srPreflight?.subscription||null,
      human_approval_required:true,provider_readback_required:true,send_proof:false,
      reason:srPreflightError||'RECIPIENT_APPROVAL_AND_PROVIDER_RECEIPT_REQUIRED',
      ...srPreflightDetails
    };
    await recordCapability(db,'salesrobot.linkedin_dm',providerStatus,providerEvidence);
    await recordCapability(db,'salesrobot.campaign_outreach',providerStatus,providerEvidence);
    if(input?.mode==='provider_preflight'){
      return json({ok:true,contract:CONTRACT,mode:'provider_preflight',
        dm_capability:providerStatus,provider_probe_error:srPreflightError||null,
        provider_evidence:srPreflightDetails,
        external_side_effects:false,commercial_outbound_sent:false,composer_called:false,
        existing_canonical_scheduler:true});
    }
    // Reconcile existing verified receipts even while SalesRobot's license/cookie is unavailable.
    const reconciledDms=await reconcileVerifiedSalesRobotReceipts(db);
    const {data:prep,error:prepError}=await db.rpc('powerhouse_prepare_linkedin_sales_machine_v1',{p_run_date:runDate});
    if(prepError)throw new Error('LINKEDIN_SALES_PREP:'+prepError.message);

    const {data:actions,error:aErr}=await db.from('powerhouse_sales_actions')
      .select('action_id,person_key,company_key,person_name,company_name,role,source_url,evidence,status,priority')
      .eq('action_type','reply_post').eq('channel','linkedin_personal').eq('status','prepared')
      .order('priority',{ascending:false}).limit(3);
    if(aErr)throw new Error('LINKEDIN_COMMENT_READ:'+aErr.message);
    await db.rpc('powerhouse_refresh_message_plans_v1',{p_limit:100});
    const composerResponse=await fetch(url+'/functions/v1/powerhouse-commercial-message-composer',{
      method:'POST',headers:{'content-type':'application/json','x-powerhouse-token':expected},
      body:JSON.stringify({limit:10,channels:['linkedin_dm']}),signal:AbortSignal.timeout(120000)
    });
    const composerBody:any=await composerResponse.json().catch(()=>({}));
    if(!composerResponse.ok||composerBody?.ok!==true)throw new Error('LINKEDIN_DM_COMPOSER_UNAVAILABLE:'+clean(composerBody?.error).slice(0,220));
    const {data:dmActions,error:dmErr}=await db.from('powerhouse_sales_actions')
      .select('action_id,person_key,company_key,person_name,company_name,role,source_url,evidence,status,priority,message_draft')
      .eq('channel','linkedin_dm').in('status',['prepared','suggested'])
      .order('priority',{ascending:false}).limit(3);
    if(dmErr)throw new Error('LINKEDIN_DM_READ:'+dmErr.message);



    const aiKey=await secret(db,'ANTHROPIC_API_KEY');
    if(!aiKey)throw new Error('ANTHROPIC_API_KEY_MISSING');
    const {data:gov,error:govError}=await db.from('brain_ai_governance_registry')
      .select('model_id,provider,approved,lifecycle_status')
      .eq('tenant_id','canonical').eq('use_case_id','supabase-bg-native-content-generate-v4').maybeSingle();
    if(govError||!gov||gov.approved!==true||gov.lifecycle_status!=='ACTIVE'||gov.provider!=='Anthropic')throw new Error('AI_GOVERNANCE_UNAVAILABLE');
    const model=clean(gov.model_id);
    const generated:any[]=[];

    for(const action of actions||[]){
      try{
        const comment=await generateComment(aiKey,model,action);
        const evidence={...(action.evidence||{}),comment_generation:{
          contract:CONTRACT,provider:'Anthropic',model,generated_at:now,
          no_sales_pitch_verified:true,max_chars:500,source_url:action.source_url
        }};
        const {error:uErr}=await db.from('powerhouse_sales_actions')
          .update({message_draft:comment,status:'suggested',evidence,updated_at:now})
          .eq('action_id',action.action_id).eq('status','prepared');
        if(uErr)throw new Error('COMMENT_PREP_WRITE:'+uErr.message);
        generated.push({action_id:action.action_id,status:'suggested'});
      }catch(err:any){
        await db.from('powerhouse_sales_actions').update({
          status:'error',
          evidence:{...(action.evidence||{}),comment_generation:{contract:CONTRACT,failed_at:now,error:clean(err?.message||err).slice(0,300)}},
          updated_at:now
        }).eq('action_id',action.action_id).eq('status','prepared');
        generated.push({action_id:action.action_id,status:'error'});
      }
    }

    let autopilot:any=null;
    if(generated.some(x=>x.status==='suggested')){
      const publisher=await fetch(url+'/functions/v1/powerhouse-social-publisher',{
        method:'POST',
        headers:{'content-type':'application/json','x-powerhouse-token':expected},
        body:JSON.stringify({runDate,mode:'cockpit_autopilot'}),
        signal:AbortSignal.timeout(120000)
      });
      autopilot=await publisher.json().catch(()=>({}));
      if(!publisher.ok)throw new Error('LINKEDIN_AUTOPILOT_'+publisher.status+':'+clean(autopilot?.error).slice(0,200));
    }

    const dmResults:any[]=[];
    let dmCapability='UNAVAILABLE';
    try{
      const sr=srPreflight;
      if(!sr)throw new Error(srPreflightError||'SALESROBOT_PROVIDER_PREFLIGHT_UNAVAILABLE');
      // Account health is not recipient eligibility nor a verified DM delivery receipt.
      dmCapability='CONFIG_REQUIRED';

      for(const action of dmActions||[]){
        const composerProof=action?.evidence?.commercial_intelligence?.composer||{};
        const strategy=clean(action?.evidence?.commercial_intelligence?.message_strategy);
        if(composerProof?.contract!=='powerhouse-human-commercial-message-composer-v2'||composerProof?.quality_passed!==true||composerProof?.source_specific_evidence_ok!==true||composerProof?.semantic_novelty_ok!==true||composerProof?.new_followup_evidence_ok!==true||!strategy||!clean(action.message_draft)){
          const evidence={...(action.evidence||{}),execution_gate:{contract:'powerhouse-human-commercial-message-gate-v1',blocked_at:now,reason:'HUMAN_MESSAGE_QUALITY_NOT_PROVEN',message_strategy:strategy||null,quality_passed:composerProof?.quality_passed===true,composer_contract:clean(composerProof?.contract)||null}};
          await db.from('powerhouse_sales_actions').update({evidence,updated_at:now}).eq('action_id',action.action_id);
          dmResults.push({action_id:action.action_id,status:'held',reason:'HUMAN_MESSAGE_QUALITY_NOT_PROVEN'});
          continue;
        }
        const address=salesRobotAddress(action);
        const message=clean(action.message_draft);
        if(action?.evidence?.human_approved!==true){
          const evidence={...(action.evidence||{}),capability_routing:{contract:'powerhouse-capability-routing-v1',preferred:'linkedin_dm',provider:'salesrobot',status:'AWAITING_HUMAN_APPROVAL',fallback_required:false,checked_at:now}};
          await db.from('powerhouse_sales_actions').update({evidence,updated_at:now}).eq('action_id',action.action_id);
          dmResults.push({action_id:action.action_id,status:'awaiting_human_approval',reason:'UNSOLICITED_OUTBOUND_APPROVAL_REQUIRED'});
          continue;
        }
        if(!await approvedLinkedinRecipient(db,action)){
          dmResults.push({action_id:action.action_id,status:'held',reason:'LINKEDIN_RECIPIENT_CRM_APPROVAL_NOT_PROVEN'});
          continue;
        }
        if(!message){dmResults.push({action_id:action.action_id,status:'fallback',reason:'MESSAGE_MISSING'});continue;}
        const hasAddress=!!(address.prospect_uuid||address.thread_id||address.unipile_chat_id||address.unipile_sales_nav_chat_id);
        if(!hasAddress){
          const evidence={...(action.evidence||{}),capability_routing:{contract:'powerhouse-capability-routing-v1',preferred:'linkedin_dm',provider:'salesrobot',status:'NOT_ADDRESSABLE',fallback_required:true,checked_at:now}};
          await db.from('powerhouse_sales_actions').update({evidence,updated_at:now}).eq('action_id',action.action_id);
          dmResults.push({action_id:action.action_id,status:'fallback',reason:'SALESROBOT_RECIPIENT_NOT_ADDRESSABLE'});
          continue;
        }
        const {data:claimed}=await db.from('powerhouse_sales_actions').update({status:'waiting',updated_at:now}).eq('action_id',action.action_id).in('status',['prepared','suggested']).select('action_id').maybeSingle();
        if(!claimed){dmResults.push({action_id:action.action_id,status:'skipped',reason:'ALREADY_CLAIMED'});continue;}
        let tentativeAck:any=null;
        try{
          const args:any={linkedin_account_uuid:sr.linkedinAccountUuid,message};
          for(const [k,v] of Object.entries(address))if(v)args[k]=v;
          const sent=await composioExecuteArgs(sr.apiKey,sr.connectedAccountId,sr.userId,'SALESROBOT_SEND_MESSAGE',args);
          const providerData:any=sent?.data||sent;
          const messageId=clean(providerData?.message_id||providerData?.messageId||
            providerData?.data?.message_id||providerData?.data?.messageId||
            providerData?.data?.id||providerData?.id);
          tentativeAck={provider_ack_received:true,provider_message_id:messageId||null,
            prospect_uuid:address.prospect_uuid||null};
          const attemptedAt=new Date().toISOString();
          const evidence={...(action.evidence||{}),salesrobot_execution:{
            contract:'powerhouse-capability-routing-v1',provider:'salesrobot',tool:'SALESROBOT_SEND_MESSAGE',
            ...tentativeAck,provider_ack_verified:false,provider_readback_verified:false,
            needs_readback:true,republish_forbidden:true,attempted_at:attemptedAt,
            provider_response:providerData
          }};
          // HTTP acknowledgement is not proof of a sent inbox message. Preserve original claim.
          const {data:pending,error:pendingError}=await db.from('powerhouse_sales_actions')
            .update({status:'waiting',evidence,updated_at:attemptedAt})
            .eq('action_id',action.action_id).eq('status','waiting').select('action_id').maybeSingle();
          if(pendingError||!pending)throw new Error('SALESROBOT_RECEIPT_CHECKPOINT_FAILED:'+clean(pendingError?.message||'missing claim'));
          dmResults.push({action_id:action.action_id,status:'awaiting_provider_readback',
            provider_ack_received:true,provider_readback_verified:false,republish_forbidden:true});
        }catch(dmError:any){
          // A network/adapter exception may happen AFTER provider delivery: never unlock for a second send.
          const attemptedAt=new Date().toISOString();
          const evidence={...(action.evidence||{}),
            salesrobot_execution:{
              contract:'powerhouse-capability-routing-v1',provider:'salesrobot',tool:'SALESROBOT_SEND_MESSAGE',
              ...(tentativeAck||{}),provider_ack_verified:false,provider_readback_verified:false,needs_readback:true,
              republish_forbidden:true,attempted_at:attemptedAt,uncertainty_code:'SALESROBOT_SEND_OUTCOME_AMBIGUOUS'
            },
            capability_routing:{
              contract:'powerhouse-capability-routing-v1',preferred:'linkedin_dm',provider:'salesrobot',
              status:'PROVIDER_OUTCOME_UNCERTAIN',fallback_required:false,checked_at:attemptedAt,
              reason:'INDEPENDENT_PROVIDER_READBACK_REQUIRED'
            }
          };
          // Claim already has status waiting. A failed checkpoint still leaves the original claim locked.
          const {data:checkpoint,error:checkpointError}=await db.from('powerhouse_sales_actions')
            .update({status:'waiting',evidence,updated_at:attemptedAt})
            .eq('action_id',action.action_id).eq('status','waiting').select('action_id').maybeSingle();
          dmResults.push({
            action_id:action.action_id,status:'unverified',reason:'SALESROBOT_SEND_OUTCOME_AMBIGUOUS',
            checkpoint_written:!checkpointError&&!!checkpoint,requires_provider_readback:true,
            republish_forbidden:true
          });
        }
      }
    }catch(srError:any){
      const reason=clean(srError?.message||srError).slice(0,240);
      // A failed API preflight (e.g. 400 from an adapter) cannot prove an account is disconnected.
      // Keep it non-sendable while preserving the last known provider-health distinction.
      const confirmedDisconnected=/^SALESROBOT_(CONNECTION_UNAVAILABLE|LINKEDIN_ACCOUNT_NOT_HEALTHY)$/.test(reason);
      dmCapability=confirmedDisconnected?'UNAVAILABLE':'CONFIG_REQUIRED';
      // Preflight is authoritative for capability. Do not downgrade a verified healthy
      // account because a later unrelated action/composer/database operation failed.
      if(!srPreflight)await recordCapability(db,'salesrobot.linkedin_dm',dmCapability,{error:reason,checked_at:now,send_proof:false,account_health_unverified:true,provider_probe_failed:true,retryable:!confirmedDisconnected,requires_exact_provider_readback:true,proof_boundary:'probe_error_is_not_verified_disconnection'});
      dmResults.push({status:'held',reason:confirmedDisconnected?'SALESROBOT_PROVIDER_DISCONNECTED':'SALESROBOT_PROBE_OR_ELIGIBILITY_UNVERIFIED'});
    }
    return json({ok:true,contract:CONTRACT,prepared:prep,generated,autopilot,
      verified_receipts_reconciled:reconciledDms.length,
      dm_capability:dmCapability,dm_provider:'salesrobot',dm_results:dmResults,
      dm_fallback:'REQUIRES_SEPARATE_EXECUTION_PROOF'});
  }catch(err:any){
    return json({ok:false,contract:CONTRACT,error:clean(err?.message||err).slice(0,500)},503);
  }
});
