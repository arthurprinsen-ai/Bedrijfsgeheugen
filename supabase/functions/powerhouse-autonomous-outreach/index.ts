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
async function send(key:string,acct:{id:string,userId:string},to:string,subject:string,body:string){const r=await fetch(B+'/tools/execute/GMAIL_SEND_EMAIL',{method:'POST',headers:{'content-type':'application/json','x-api-key':key},body:JSON.stringify({connected_account_id:acct.id,user_id:acct.userId,arguments:{recipient_email:to,subject,body,is_html:false,user_id:'me'}})}),x:any=await r.json().catch(()=>({parse_error:true}));if(!r.ok||x?.successful!==true)throw{code:'COMPOSIO_GMAIL_SEND',status:r.status,payload:safe(x)};const d=x?.data||x;return{message_id:pick(d,['id','message_id','messageId']),thread_id:pick(d,['threadId','thread_id']),provider:safe(d)}}
Deno.serve(async(req)=>{
 if(req.method!=='POST')return J({ok:false,error:'POST_ONLY'},405);
 const url=Deno.env.get('SUPABASE_URL')||'',role=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';if(!url||!role)return J({ok:false,error:'CONFIG'},500);
 const db=createClient(url,role,{auth:{persistSession:false,autoRefreshToken:false}}),token=await sec(db,'powerhouse_daily_scheduler_token');if(!token||req.headers.get('x-powerhouse-token')!==token)return J({ok:false,error:'UNAUTHORIZED'},401);
 let input:any={};try{input=await req.json()}catch{}const now=new Date().toISOString();
 try{
  const key=await sec(db,'COMPOSIO_API_KEY');if(!key)throw{code:'COMPOSIO_API_KEY_MISSING'};const acct=await gmailAccount(db,key);
  const composerResponse=await fetch(url+'/functions/v1/powerhouse-commercial-message-composer',{
    method:'POST',headers:{'content-type':'application/json','x-powerhouse-token':token},
    body:JSON.stringify({limit:10,channels:['email']}),signal:AbortSignal.timeout(120000)
  });
  const composerBody:any=await composerResponse.json().catch(()=>({}));
  if(!composerResponse.ok||composerBody?.ok!==true)throw{code:'HUMAN_COMPOSER_UNAVAILABLE',status:composerResponse.status,payload:safe(composerBody),retryable:true};
  await db.rpc('powerhouse_refresh_message_plans_v1',{p_limit:100});
  const{data:acts,error}=await db.from('powerhouse_sales_actions').select('action_id,person_key,company_key,person_name,company_name,message_draft,evidence,priority').eq('action_type','autonomous_email').eq('channel','email').eq('status','prepared').lte('due_at',now).order('priority',{ascending:false}).limit(5);if(error)throw{code:'OUTREACH_READ',message:error.message};
  if(input?.dry_run===true)return J({ok:true,dry_run:true,eligible:(acts||[]).length,account_resolved:true,account_user_resolved:Boolean(acct.userId),contract:C});
  const out:any[]=[];
  for(const a0 of acts||[]){
   const compose=await fetch(url+'/functions/v1/powerhouse-human-sales-composer',{method:'POST',headers:{'content-type':'application/json','x-powerhouse-token':token},body:JSON.stringify({action_id:a0.action_id}),signal:AbortSignal.timeout(45000)});
   const composeBody:any=await compose.json().catch(()=>({}));
   if(!compose.ok||composeBody?.composed!==true){out.push({action_id:a0.action_id,status:'held',reason:composeBody?.reason||composeBody?.state||'COPY_QUALITY_NOT_PROVEN'});continue;}
   const {data:a,error:reloadError}=await db.from('powerhouse_sales_actions').select('action_id,person_key,company_key,person_name,company_name,message_draft,evidence,priority').eq('action_id',a0.action_id).maybeSingle();
   if(reloadError||!a){out.push({action_id:a0.action_id,status:'error',reason:'ACTION_RELOAD_FAILED'});continue;}
   if(a.evidence?.commercial_intelligence?.quality_passed!==true){out.push({action_id:a.action_id,status:'held',reason:'COPY_QUALITY_GATE_FAILED'});continue;}
   const to=s(a.evidence?.recipient_email),sub=s(a.evidence?.email_subject),body=s(a.message_draft);
   const composer=a.evidence?.commercial_intelligence?.composer||{};
   const strategy=s(a.evidence?.commercial_intelligence?.message_strategy);
   if(composer?.quality_passed!==true||!strategy){
     const ev={...(a.evidence||{}),execution_gate:{contract:'powerhouse-human-commercial-message-gate-v1',blocked_at:now,reason:'HUMAN_MESSAGE_QUALITY_NOT_PROVEN',message_strategy:strategy||null,quality_passed:composer?.quality_passed===true}};
     await db.from('powerhouse_sales_actions').update({status:'prepared',evidence:ev,updated_at:now}).eq('action_id',a.action_id).eq('status','prepared');
     out.push({action_id:a.action_id,status:'held',reason:'HUMAN_MESSAGE_QUALITY_NOT_PROVEN'});
     continue;
   }
   if(!to||!sub||!body){await db.from('powerhouse_sales_actions').update({status:'error',evidence:{...(a.evidence||{}),autonomous_outbound:{contract:C,failed_at:now,error:{code:'MISSING_RECIPIENT_SUBJECT_OR_BODY'},retryable:false}},updated_at:now}).eq('action_id',a.action_id);out.push({action_id:a.action_id,status:'error',reason:'MISSING_FIELDS'});continue}
   const{data:blocked,error:be}=await db.from('powerhouse_email_contact_suppressions').select('suppression_id,reason').eq('email',to.toLowerCase()).eq('active',true).maybeSingle();if(be)throw{code:'SUPPRESSION_READ',message:be.message};
   if(blocked){await db.from('powerhouse_sales_actions').update({status:'skipped',evidence:{...(a.evidence||{}),suppressed:{reason:blocked.reason,checked_at:now}},updated_at:now}).eq('action_id',a.action_id).eq('status','prepared');out.push({action_id:a.action_id,status:'skipped',reason:'CONTACT_SUPPRESSED'});continue}
   const{data:claim,error:ce}=await db.from('powerhouse_sales_actions').update({status:'waiting',updated_at:now}).eq('action_id',a.action_id).eq('status','prepared').select('action_id').maybeSingle();if(ce)throw{code:'CLAIM',message:ce.message};if(!claim){out.push({action_id:a.action_id,status:'skipped',reason:'ALREADY_CLAIMED'});continue}
   try{
    const r=await send(key,acct,to,sub,body),pid=r.message_id||r.thread_id;if(!pid)throw{code:'PROVIDER_ID_MISSING',provider:r.provider};
    const ev={...(a.evidence||{}),autonomous_outbound:{contract:C,provider:'composio-gmail',provider_message_id:r.message_id,provider_thread_id:r.thread_id,provider_ack_verified:true,sent_at:now,republish_forbidden:true,user_authorized:true}};
    const{error:we}=await db.from('powerhouse_sales_actions').update({status:'done',executed_at:now,evidence:ev,updated_at:now}).eq('action_id',a.action_id).eq('status','waiting');if(we)throw{code:'WRITEBACK',message:we.message};
    await db.from('powerhouse_sales_outcomes').upsert({dedupe_key:'autonomous-email-sent:'+a.action_id,action_id:a.action_id,outcome_type:'sent',subject_key:'relationship:'+a.person_key,person_key:a.person_key,company_key:a.company_key,revenue_eur:0,evidence:{contract:C,provider:'composio-gmail',provider_message_id:r.message_id,provider_thread_id:r.thread_id},occurred_at:now,channel:'email'},{onConflict:'dedupe_key'});
    out.push({action_id:a.action_id,status:'sent',provider_message_id:r.message_id,provider_thread_id:r.thread_id});
   }catch(e:any){const er=safe(e);await db.from('powerhouse_sales_actions').update({status:'error',evidence:{...(a.evidence||{}),autonomous_outbound:{contract:C,failed_at:now,error:er,user_authorized:true,retryable:true}},updated_at:now}).eq('action_id',a.action_id).eq('status','waiting');out.push({action_id:a.action_id,status:'error',reason:er})}
  }
  const sent=out.filter(x=>x.status==='sent').length;await db.from('bg_gezondheid').insert({gemeten_op:now,onderdeel:'powerhouse-autonomous-outreach',soort:'commercial-execution',status:out.some(x=>x.status==='error')?'waarschuwing':'ok',detail:'selected='+(acts||[]).length+'; sent='+sent+'; errors='+out.filter(x=>x.status==='error').length,gegevens:{contract:C,selected:(acts||[]).length,sent,results:out,user_authorized:true}});
  return J({ok:true,contract:C,selected:(acts||[]).length,sent,results:out,external_outreach_executed:sent>0});
 }catch(e:any){return J({ok:false,contract:C,error:safe(e)},503)}
});