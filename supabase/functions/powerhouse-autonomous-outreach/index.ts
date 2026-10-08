import {createClient} from 'npm:@supabase/supabase-js@2';
const C='powerhouse-autonomous-relationship-outreach-v3',B='https://backend.composio.dev/api/v3.1';
const s=(v:any)=>String(v??'').trim(),J=(b:any,n=200)=>new Response(JSON.stringify(b),{status:n,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function sec(db:any,n:string){const e=Deno.env.get(n);if(e)return s(e);const{data}=await db.rpc('bg_geheim',{p_naam:n});return s(data)}
function pick(o:any,ks:string[]):string{if(!o||typeof o!=='object')return'';for(const k of ks)if(typeof o[k]==='string'&&s(o[k]))return s(o[k]);for(const v of Object.values(o)){const x=pick(v,ks);if(x)return x}return''}
function safe(o:any){try{return JSON.parse(JSON.stringify(o))}catch{return{unserializable:true}}}
async function gmailAccount(db:any,key:string){
 const pinned=await sec(db,'COMPOSIO_GMAIL_CONNECTED_ACCOUNT_ID');
 const r=await fetch(B+'/connected_accounts?account_type=ALL&limit=100',{headers:{'x-api-key':key}}),x:any=await r.json().catch(()=>({}));
 if(!r.ok)throw{code:'GMAIL_DISCOVERY',status:r.status,payload:safe(x),retryable:true};
 const all=(x?.items||x?.data?.items||x?.data||[]);
 const active=all.filter((z:any)=>s(z?.toolkit?.slug||z?.toolkit_slug).toLowerCase()==='gmail'&&s(z?.status).toUpperCase()==='ACTIVE'&&z?.is_disabled!==true);
 if(active.length===0)throw{code:'COMPOSIO_SERVER_GMAIL_UNAVAILABLE',configured_id_kind:pinned.startsWith('ca_')?'api_nanoid':'non_api_id',fallback_required:true,retryable:true};
 let chosen=active[0];
 if(pinned){const exact=active.find((z:any)=>s(z?.id)===pinned||s(z?.word_id)===pinned||s(z?.alias)===pinned);if(exact)chosen=exact}
 if(active.length>1&&!pinned)throw{code:'GMAIL_CONNECTION_AMBIGUOUS',count:active.length,retryable:false};
 const id=s(chosen?.id),userId=s(chosen?.user_id||chosen?.entity_id);
 if(!id||!userId)throw{code:'GMAIL_ACCOUNT_IDENTITY_INCOMPLETE',has_id:Boolean(id),has_user_id:Boolean(userId),retryable:true};
 return{id,userId};
}
async function send(key:string,acct:{id:string;userId:string},to:string,subject:string,body:string){
 const r=await fetch(B+'/tools/execute/GMAIL_SEND_EMAIL',{method:'POST',headers:{'content-type':'application/json','x-api-key':key},body:JSON.stringify({connected_account_id:acct.id,user_id:acct.userId,arguments:{recipient_email:to,subject,body,is_html:false,user_id:'me'}}),signal:AbortSignal.timeout(20000)});
 const x:any=await r.json().catch(()=>({parse_error:true}));
 if(!r.ok||x?.successful!==true)throw{code:'COMPOSIO_GMAIL_SEND_UNCERTAIN',status:r.status,payload:safe(x)};
 const d=x?.data?.data||x?.data||x;
 const message_id=s(d?.id||d?.message_id||d?.messageId||d?.message?.id),thread_id=s(d?.threadId||d?.thread_id||d?.message?.threadId);
 if(!message_id)throw{code:'SEND_ACK_MESSAGE_ID_MISSING',payload:safe(d)};
 return{message_id,thread_id};
}
async function readback(key:string,acct:{id:string;userId:string},messageId:string,recipient:string){
 if(!messageId)throw{code:'READBACK_MESSAGE_ID_MISSING'};
 const r=await fetch(B+'/tools/execute/GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID',{method:'POST',headers:{'content-type':'application/json','x-api-key':key},body:JSON.stringify({connected_account_id:acct.id,user_id:acct.userId,arguments:{message_id:messageId,user_id:'me',format:'full'}}),signal:AbortSignal.timeout(15000)});
 const x:any=await r.json().catch(()=>({parse_error:true}));
 if(!r.ok||x?.successful!==true)throw{code:'GMAIL_INDEPENDENT_READBACK_UNAVAILABLE',status:r.status,payload:safe(x)};
 const d=x?.data?.data||x?.data||x,m=d?.message||d;
 const id=s(m?.id||m?.message_id),labels=Array.isArray(m?.labelIds)?m.labelIds:(Array.isArray(m?.label_ids)?m.label_ids:[]);
 const headers=Array.isArray(m?.payload?.headers)?m.payload.headers:(Array.isArray(m?.headers)?m.headers:[]);
 const toHeader=headers.find((h:any)=>s(h?.name).toLowerCase()==='to');
 const addressed=s(toHeader?.value||m?.to).toLowerCase(),target=s(recipient).toLowerCase();
 const recipients=(addressed.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)||[]).map((v:string)=>v.toLowerCase());
 if(id!==messageId||!labels.includes('SENT')||!target||!recipients.includes(target))
  throw{code:'GMAIL_READBACK_MISMATCH',id_matches:id===messageId,sent_label:labels.includes('SENT'),recipient_matches:Boolean(target&&recipients.includes(target))};
 return{message_id:id,thread_id:s(m?.threadId||m?.thread_id),sent_label_verified:true,recipient_verified:true};
}
// Do not treat a prepared action or an authenticated scheduler as recipient authorization.
async function verifyRecipientAuthority(db:any,a:any,to:string):Promise<boolean>{
 const recipient=s(to),person=s(a?.person_key);
 if(!recipient||!person||s(a?.evidence?.recipient_email)!==recipient||a?.evidence?.human_approved!==true)return false;
 const{data,error}=await db.from('bg_connecties').select('sleutel,linkedin_url,extra').eq('email',recipient).limit(10);
 if(error)throw{code:'RECIPIENT_AUTHORITY_READ',message:error.message};
 return (data||[]).some((c:any)=>(s(c?.sleutel)===person||s(c?.linkedin_url)===person)&&c?.extra?.human_approved===true);
}
Deno.serve(async(req)=>{
 if(req.method!=='POST')return J({ok:false,error:'POST_ONLY'},405);
 const url=Deno.env.get('SUPABASE_URL')||'',role=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';if(!url||!role)return J({ok:false,error:'CONFIG'},500);
 const db=createClient(url,role,{auth:{persistSession:false,autoRefreshToken:false}}),token=await sec(db,'powerhouse_daily_scheduler_token');if(!token||req.headers.get('x-powerhouse-token')!==token)return J({ok:false,error:'UNAUTHORIZED'},401);
 let input:any={};try{input=await req.json()}catch{}const now=new Date().toISOString();
 try{
  const key=await sec(db,'COMPOSIO_API_KEY');if(!key)throw{code:'COMPOSIO_API_KEY_MISSING'};const acct=await gmailAccount(db,key);
  const out:any[]=[];
  async function settle(a:any,ack:{message_id:string;thread_id:string},recipient:string){
   const proof=await readback(key,acct,ack.message_id,recipient);
   const ev={...(a.evidence||{}),autonomous_outbound:{contract:C,provider:'composio-gmail',provider_message_id:proof.message_id,provider_thread_id:ack.thread_id||proof.thread_id,provider_ack_verified:true,provider_readback_verified:true,readback_at:new Date().toISOString(),sent_at:now,republish_forbidden:true,user_authorized:true,needs_readback:false}};
   const{error:oe}=await db.from('powerhouse_sales_outcomes').upsert({dedupe_key:'autonomous-email-sent:'+a.action_id,action_id:a.action_id,outcome_type:'sent',subject_key:'relationship:'+a.person_key,person_key:a.person_key,company_key:a.company_key,revenue_eur:0,evidence:{contract:C,provider:'composio-gmail',provider_message_id:proof.message_id,provider_thread_id:ack.thread_id||proof.thread_id,provider_readback_verified:true},occurred_at:now,channel:'email'},{onConflict:'dedupe_key'});
   if(oe)throw{code:'OUTCOME_WRITEBACK',message:oe.message};
   const{data:done,error:we}=await db.from('powerhouse_sales_actions').update({status:'done',executed_at:now,evidence:ev,updated_at:now}).eq('action_id',a.action_id).eq('status','waiting').select('action_id').maybeSingle();
   if(we||!done)throw{code:'VERIFIED_ACTION_WRITEBACK',message:we?.message||'ACTION_NOT_WAITING'};
   return{action_id:a.action_id,status:'sent',provider_message_id:proof.message_id,provider_thread_id:ack.thread_id||proof.thread_id,provider_readback_verified:true};
  }
  // Reconcile the original action; never resend while provider outcome is uncertain.
  if(input?.dry_run!==true){
   const{data:pending,error:pe}=await db.from('powerhouse_sales_actions').select('action_id,person_key,company_key,evidence').eq('action_type','autonomous_email').eq('channel','email').eq('status','waiting').contains('evidence',{autonomous_outbound:{needs_readback:true}}).limit(10);
   if(pe)throw{code:'PENDING_READBACK_READ',message:pe.message};
   for(const a of pending||[]){
    const old=a?.evidence?.autonomous_outbound||{},id=s(old.provider_message_id),to=s(a?.evidence?.recipient_email);
    if(!id||!to){out.push({action_id:a.action_id,status:'unverified',reason:'SEND_OUTCOME_AMBIGUOUS_NO_RESEND'});continue}
    try{out.push(await settle(a,{message_id:id,thread_id:s(old.provider_thread_id)},to))}
    catch(e:any){out.push({action_id:a.action_id,status:'unverified',reason:safe(e)})}
   }
  }
  // A true dry run is read-only: no mutating composer, provider send or message-plan refresh.
  if(input?.dry_run===true){
   const{data:preview,error:qe}=await db.from('powerhouse_sales_actions').select('action_id,person_key,evidence').eq('action_type','autonomous_email').eq('channel','email').eq('status','prepared').lte('due_at',now).order('priority',{ascending:false}).limit(5);
   if(qe)throw{code:'OUTREACH_PREVIEW_READ',message:qe.message};
   let authorized=0;
   for(const a of preview||[])if(await verifyRecipientAuthority(db,a,s(a?.evidence?.recipient_email)))authorized++;
   return J({ok:true,dry_run:true,eligible:authorized,prepared:(preview||[]).length,recipient_authority_unverified:(preview||[]).length-authorized,external_outreach_executed:false,account_resolved:true,contract:C});
  }
  const composerResponse=await fetch(url+'/functions/v1/powerhouse-commercial-message-composer',{
    method:'POST',headers:{'content-type':'application/json','x-powerhouse-token':token},
    body:JSON.stringify({limit:10,channels:['email']}),signal:AbortSignal.timeout(120000)
  });
  const composerBody:any=await composerResponse.json().catch(()=>({}));
  if(!composerResponse.ok||composerBody?.ok!==true)throw{code:'HUMAN_COMPOSER_UNAVAILABLE',status:composerResponse.status,payload:safe(composerBody),retryable:true};
  await db.rpc('powerhouse_refresh_message_plans_v1',{p_limit:100});
  const{data:acts,error}=await db.from('powerhouse_sales_actions').select('action_id,person_key,company_key,person_name,company_name,message_draft,evidence,priority').eq('action_type','autonomous_email').eq('channel','email').eq('status','prepared').lte('due_at',now).order('priority',{ascending:false}).limit(5);if(error)throw{code:'OUTREACH_READ',message:error.message};
  
  for(const a of acts||[]){
   const composer=a?.evidence?.commercial_intelligence?.composer||{};
   const strategy=s(a?.evidence?.commercial_intelligence?.message_strategy);
   const to=s(a.evidence?.recipient_email),sub=s(a.evidence?.email_subject),body=s(a.message_draft);
   // Known email or LinkedIn connection is not proof of approved recipient outreach.
   const recipientApproved=await verifyRecipientAuthority(db,a,to);
   if(!recipientApproved){
    const ev={...(a.evidence||{}),execution_gate:{contract:'commercial-recipient-authority-p0-v1',blocked_at:now,reason:'RECIPIENT_AUTHORITY_UNVERIFIED',owner:'contact-permission-verification',repair:'Verify lawful recipient-specific authority and human approval in CRM before dispatch; retain contact suppression and cooldown.'}};
    const{error:ae}=await db.from('powerhouse_sales_actions').update({evidence:ev,updated_at:now}).eq('action_id',a.action_id).eq('status','prepared');
    if(ae)throw{code:'RECIPIENT_AUTHORITY_BLOCK_WRITEBACK',message:ae.message};
    out.push({action_id:a.action_id,status:'held',reason:'RECIPIENT_AUTHORITY_UNVERIFIED'});
    continue;
   }
   if(composer?.contract!=='powerhouse-human-commercial-message-composer-v2'||composer?.quality_passed!==true||!strategy||!body){
     const ev={...(a.evidence||{}),execution_gate:{contract:'powerhouse-human-commercial-message-gate-v1',blocked_at:now,reason:'HUMAN_MESSAGE_QUALITY_NOT_PROVEN',message_strategy:strategy||null,quality_passed:composer?.quality_passed===true,composer_contract:s(composer?.contract)||null}};
     await db.from('powerhouse_sales_actions').update({evidence:ev,updated_at:now}).eq('action_id',a.action_id).eq('status','prepared');
     out.push({action_id:a.action_id,status:'held',reason:'HUMAN_MESSAGE_QUALITY_NOT_PROVEN'});
     continue;
   }
   if(!to||!sub||!body){await db.from('powerhouse_sales_actions').update({status:'error',evidence:{...(a.evidence||{}),autonomous_outbound:{contract:C,failed_at:now,error:{code:'MISSING_RECIPIENT_SUBJECT_OR_BODY'},retryable:false}},updated_at:now}).eq('action_id',a.action_id);out.push({action_id:a.action_id,status:'error',reason:'MISSING_FIELDS'});continue}
   const{data:blocked,error:be}=await db.from('powerhouse_email_contact_suppressions').select('suppression_id,reason').eq('email',to.toLowerCase()).eq('active',true).maybeSingle();if(be)throw{code:'SUPPRESSION_READ',message:be.message};
   if(blocked){await db.from('powerhouse_sales_actions').update({status:'skipped',evidence:{...(a.evidence||{}),suppressed:{reason:blocked.reason,checked_at:now}},updated_at:now}).eq('action_id',a.action_id).eq('status','prepared');out.push({action_id:a.action_id,status:'skipped',reason:'CONTACT_SUPPRESSED'});continue}
   const{data:claim,error:ce}=await db.from('powerhouse_sales_actions').update({status:'waiting',updated_at:now}).eq('action_id',a.action_id).eq('status','prepared').select('action_id').maybeSingle();if(ce)throw{code:'CLAIM',message:ce.message};if(!claim){out.push({action_id:a.action_id,status:'skipped',reason:'ALREADY_CLAIMED'});continue}
   let ack:{message_id:string;thread_id:string}|null=null;
   try{
    ack=await send(key,acct,to,sub,body);
    const attempted={...(a.evidence||{}),autonomous_outbound:{contract:C,provider:'composio-gmail',provider_message_id:ack.message_id,provider_thread_id:ack.thread_id,provider_ack_verified:false,provider_readback_verified:false,needs_readback:true,republish_forbidden:true,attempted_at:now}};
    const{error:ae}=await db.from('powerhouse_sales_actions').update({evidence:attempted,updated_at:now}).eq('action_id',a.action_id).eq('status','waiting');
    if(ae)throw{code:'ACK_CHECKPOINT_WRITEBACK',message:ae.message};
    out.push(await settle({...a,evidence:attempted},ack,to));
   }catch(e:any){
    // Ambiguous provider side effect must remain claimed, never retry automatically.
    const er=safe(e);
    const uncertainty={...(a.evidence||{}),autonomous_outbound:{contract:C,provider:'composio-gmail',provider_message_id:ack?.message_id||null,provider_thread_id:ack?.thread_id||null,provider_ack_verified:false,provider_readback_verified:false,needs_readback:true,republish_forbidden:true,attempted_at:now,uncertainty:er}};
    const{error:ue}=await db.from('powerhouse_sales_actions').update({status:'waiting',evidence:uncertainty,updated_at:now}).eq('action_id',a.action_id).eq('status','waiting');
    out.push({action_id:a.action_id,status:'unverified',reason:er,checkpoint_written:!ue});
   }
  }
  const sent=out.filter(x=>x.status==='sent').length;await db.from('bg_gezondheid').insert({gemeten_op:now,onderdeel:'powerhouse-autonomous-outreach',soort:'commercial-execution',status:sent===0||out.some(x=>x.status==='error')||out.some(x=>x.status!=='sent')?'waarschuwing':'ok',detail:'selected='+(acts||[]).length+'; sent='+sent+'; errors='+out.filter(x=>x.status==='error').length,gegevens:{contract:C,selected:(acts||[]).length,sent,results:out,user_authorized:true,delivery_gap:sent===0?((acts||[]).length===0?'NO_ELIGIBLE_PREPARED_EMAIL':'NO_PROVIDER_CONFIRMED_EMAIL'):null}});
  return J({ok:true,contract:C,selected:(acts||[]).length,sent,results:out,external_outreach_executed:sent>0,delivery_gap:sent===0?((acts||[]).length===0?'NO_ELIGIBLE_PREPARED_EMAIL':'NO_PROVIDER_CONFIRMED_EMAIL'):null});
 }catch(e:any){return J({ok:false,contract:C,error:safe(e)},503)}
});