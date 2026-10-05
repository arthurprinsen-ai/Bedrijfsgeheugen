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
async function composioExecuteArgs(apiKey:string,connectedAccountId:string,toolSlug:string,args:Record<string,unknown>){
  const response=await fetch(COMPOSIO_BASE+'/tools/execute/'+toolSlug,{
    method:'POST',headers:{'content-type':'application/json','x-api-key':apiKey},
    body:JSON.stringify({connected_account_id:connectedAccountId,version:'latest',arguments:args})
  });
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok||body?.successful!==true)throw new Error('COMPOSIO_'+toolSlug+'_'+response.status+':'+clean(body?.error||body?.message||body?.data?.message||JSON.stringify(body)).slice(0,240));
  return body;
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
  const probe=await composioExecuteArgs(apiKey,connectedAccountId,'SALESROBOT_LIST_LINKEDIN_ACCOUNTS',{limit:25});
  const data:any=probe?.data||probe;
  const accounts=Array.isArray(data?.items)?data.items:Array.isArray(data?.data?.data)?data.data.data:[];
  const healthy=accounts.find((x:any)=>clean(x?.healthStatus).toUpperCase()==='HEALTHY'&&x?.cookieExpired!==true&&x?.connectionTempPaused!==true&&x?.connectionLimitReached!==true);
  if(!healthy)throw new Error('SALESROBOT_LINKEDIN_ACCOUNT_NOT_HEALTHY');
  return {apiKey,connectedAccountId,linkedinAccountUuid:clean(healthy.linkedinAccountUuid),healthStatus:clean(healthy.healthStatus),subscription:clean(healthy.subscription||healthy.paymentStatus)};
}
async function recordCapability(db:any,capability:string,status:string,evidence:any){
  await db.from('powerhouse_channel_capabilities_v1').upsert({
    capability_key:capability,provider:'salesrobot',channel:'linkedin_dm',status,
    checked_at:new Date().toISOString(),expires_at:new Date(Date.now()+6*60*60*1000).toISOString(),evidence
  },{onConflict:'capability_key'});
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

    if(dryRun)return json({ok:true,dry_run:true,prepared:prep,comment_candidates:(actions||[]).length,dm_candidates:(dmActions||[]).length,external_side_effects:false});

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
      const sr=await salesRobotContext(db);
      dmCapability='AVAILABLE';
      await recordCapability(db,'salesrobot.linkedin_dm','AVAILABLE',{health_status:sr.healthStatus,subscription:sr.subscription,verified_at:now,tool:'SALESROBOT_SEND_MESSAGE'});
      for(const action of dmActions||[]){
        const composer=action?.evidence?.commercial_intelligence?.composer||{};
        const strategy=clean(action?.evidence?.commercial_intelligence?.message_strategy);
        if(composer?.quality_passed!==true||!strategy||!clean(action.message_draft)){
          const evidence={...(action.evidence||{}),execution_gate:{contract:'powerhouse-human-commercial-message-gate-v1',blocked_at:now,reason:'HUMAN_MESSAGE_QUALITY_NOT_PROVEN',message_strategy:strategy||null,quality_passed:composer?.quality_passed===true}};
          await db.from('powerhouse_sales_actions').update({evidence,updated_at:now}).eq('action_id',action.action_id);
          dmResults.push({action_id:action.action_id,status:'held',reason:'HUMAN_MESSAGE_QUALITY_NOT_PROVEN'});
          continue;
        }
        const address=salesRobotAddress(action);
        const message=clean(action.message_draft);
        const composer=action?.evidence?.commercial_intelligence?.composer||{};
        const strategy=clean(action?.evidence?.commercial_intelligence?.message_strategy);
        if(composer?.quality_passed!==true||!strategy){
          const evidence={...(action.evidence||{}),execution_gate:{contract:'powerhouse-human-commercial-message-gate-v1',blocked_at:now,reason:'HUMAN_MESSAGE_QUALITY_NOT_PROVEN',message_strategy:strategy||null,quality_passed:composer?.quality_passed===true}};
          await db.from('powerhouse_sales_actions').update({evidence,updated_at:now}).eq('action_id',action.action_id);
          dmResults.push({action_id:action.action_id,status:'held',reason:'HUMAN_MESSAGE_QUALITY_NOT_PROVEN'});
          continue;
        }
        if(action?.evidence?.human_approved!==true){
          const evidence={...(action.evidence||{}),capability_routing:{contract:'powerhouse-capability-routing-v1',preferred:'linkedin_dm',provider:'salesrobot',status:'AWAITING_HUMAN_APPROVAL',fallback_required:false,checked_at:now}};
          await db.from('powerhouse_sales_actions').update({evidence,updated_at:now}).eq('action_id',action.action_id);
          dmResults.push({action_id:action.action_id,status:'awaiting_human_approval',reason:'UNSOLICITED_OUTBOUND_APPROVAL_REQUIRED'});
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
        try{
          const args:any={linkedin_account_uuid:sr.linkedinAccountUuid,message};
          for(const [k,v] of Object.entries(address))if(v)args[k]=v;
          const sent=await composioExecuteArgs(sr.apiKey,sr.connectedAccountId,'SALESROBOT_SEND_MESSAGE',args);
          const providerData:any=sent?.data||sent;
          const evidence={...(action.evidence||{}),salesrobot_execution:{contract:'powerhouse-capability-routing-v1',provider:'salesrobot',tool:'SALESROBOT_SEND_MESSAGE',provider_ack_verified:true,executed_at:new Date().toISOString(),provider_response:providerData}};
          await db.from('powerhouse_sales_actions').update({status:'done',executed_at:new Date().toISOString(),evidence,updated_at:new Date().toISOString()}).eq('action_id',action.action_id).eq('status','waiting');
          dmResults.push({action_id:action.action_id,status:'executed',provider:'salesrobot',provider_ack_verified:true});
        }catch(dmError:any){
          const evidence={...(action.evidence||{}),capability_routing:{contract:'powerhouse-capability-routing-v1',preferred:'linkedin_dm',provider:'salesrobot',status:'PROVIDER_FAILED',fallback_required:true,error:clean(dmError?.message||dmError).slice(0,240),checked_at:new Date().toISOString()}};
          await db.from('powerhouse_sales_actions').update({status:'suggested',evidence,updated_at:new Date().toISOString()}).eq('action_id',action.action_id).eq('status','waiting');
          dmResults.push({action_id:action.action_id,status:'fallback',reason:'SALESROBOT_PROVIDER_FAILED'});
        }
      }
    }catch(srError:any){
      await recordCapability(db,'salesrobot.linkedin_dm','UNAVAILABLE',{error:clean(srError?.message||srError).slice(0,240),checked_at:now});
      dmResults.push({status:'fallback',reason:'SALESROBOT_CAPABILITY_UNAVAILABLE'});
    }
    return json({ok:true,contract:CONTRACT,prepared:prep,generated,autopilot,dm_capability:dmCapability,dm_provider:'salesrobot',dm_results:dmResults,dm_fallback:'highest-ranked executable channel'});
  }catch(err:any){
    return json({ok:false,contract:CONTRACT,error:clean(err?.message||err).slice(0,500)},503);
  }
});
